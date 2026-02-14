import { input, select, confirm, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import type { SkillData, GeneratedSkill } from '../templates/index.js';
import type { TemplateConfig, TemplateQuestion } from '../templates/configs/frontend-config.js';
import type { CustomTemplateConfig } from '../custom-templates/types.js';
import { evaluateWhenExpression } from '../custom-templates/renderer.js';

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function printFileTree(
  name: string,
  generated: GeneratedSkill,
  data: Partial<SkillData>
): void {
  const lines: { label: string; size: number }[] = [];

  lines.push({ label: 'SKILL.md', size: Buffer.byteLength(generated['SKILL.md'], 'utf8') });

  const subdirs: { key: 'references/' | 'scripts/' | 'assets/'; flag: boolean | undefined }[] = [
    { key: 'references/', flag: data.includeReferences },
    { key: 'scripts/', flag: data.includeScripts },
    { key: 'assets/', flag: data.includeAssets },
  ];

  for (const { key, flag } of subdirs) {
    if (generated[key]) {
      for (const [filename, content] of Object.entries(generated[key]!)) {
        lines.push({ label: `${key}${filename}`, size: Buffer.byteLength(content, 'utf8') });
      }
    } else if (flag) {
      lines.push({ label: `${key} (empty)`, size: 0 });
    }
  }

  let totalSize = 0;
  console.log(chalk.white(`  ${name}/`));

  for (let i = 0; i < lines.length; i++) {
    const isLast = i === lines.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const sizeStr = lines[i].size > 0 ? chalk.gray(` (${formatSize(lines[i].size)})`) : '';
    console.log(chalk.white(`  ${connector}${lines[i].label}`) + sizeStr);
    totalSize += lines[i].size;
  }

  console.log(chalk.gray(`\n  ${lines.length} file(s), ${formatSize(totalSize)} total`));
}

export async function previewAndConfirm(
  name: string,
  generated: GeneratedSkill,
  data: Partial<SkillData>,
  confirmMessage = 'Escribir archivos en disco?'
): Promise<boolean> {
  console.log(chalk.cyan.bold('\n--- Vista previa del skill ---\n'));

  printFileTree(name, generated, data);

  console.log(chalk.cyan('\n--- Contenido de SKILL.md ---\n'));
  console.log(highlightSkillMd(generated['SKILL.md']));

  console.log();
  return confirm({
    message: confirmMessage,
    default: true,
  });
}

export function highlightSkillMd(content: string): string {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let inCodeBlock = false;
  let frontmatterCount = 0;

  return lines.map(line => {
    // YAML frontmatter detection
    if (line.trim() === '---') {
      frontmatterCount++;
      if (frontmatterCount === 1) {
        inFrontmatter = true;
        return chalk.yellow(line);
      }
      if (frontmatterCount === 2) {
        inFrontmatter = false;
        return chalk.yellow(line);
      }
    }

    if (inFrontmatter) {
      const match = line.match(/^(\s*)([\w-]+)(:)(.*)/);
      if (match) {
        return match[1] + chalk.yellow(match[2]) + chalk.gray(match[3]) + chalk.white(match[4]);
      }
      return chalk.yellow(line);
    }

    // Code block fences
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return chalk.gray(line);
    }

    if (inCodeBlock) {
      return chalk.green(line);
    }

    // Headings
    if (line.startsWith('# ')) return chalk.cyan.bold(line);
    if (line.startsWith('## ')) return chalk.cyan(line);
    if (line.startsWith('### ')) return chalk.blue(line);

    // Table rows
    if (line.includes('|')) return chalk.white(line);

    // Bold text
    if (line.includes('**')) {
      return line.replace(/\*\*([^*]+)\*\*/g, (_: string, text: string) => chalk.bold(text));
    }

    // Inline code
    if (line.includes('`')) {
      return line.replace(/`([^`]+)`/g, (_: string, text: string) => chalk.green(`\`${text}\``));
    }

    // List items
    if (line.match(/^\s*[-*] /)) return chalk.white(line);

    return chalk.white(line);
  }).join('\n');
}

/**
 * Prompt template-specific questions interactively.
 * Returns answers keyed by question name.
 */
export async function promptTemplateQuestions(
  config: TemplateConfig | CustomTemplateConfig,
  existingData: Partial<SkillData>,
  options?: { skipLabel?: string }
): Promise<Record<string, unknown>> {
  const answers: Record<string, unknown> = {};
  const skipLabel = options?.skipLabel ?? 'current';

  for (const question of config.questions) {
    // Use existing value as default
    const currentValue = existingData[question.name];

    if (currentValue !== undefined && options?.skipLabel === undefined) {
      // In init flow: skip questions already set by preset
      console.log(chalk.gray(`  ${question.message}: ${currentValue} (from preset)`));
      answers[question.name] = currentValue;
      continue;
    }

    // Handle when clause
    const combinedData = { ...existingData, ...answers };
    if (question.when) {
      const shouldShow = typeof question.when === 'function'
        ? question.when(combinedData)
        : evaluateWhenExpression(question.when, combinedData);
      if (!shouldShow) continue;
    }

    const defaultValue = currentValue !== undefined ? currentValue : question.default;
    let answer: unknown;

    switch (question.type) {
      case 'select':
        answer = await select({
          message: question.message,
          choices: question.choices || [],
          default: defaultValue as string,
        });
        break;
      case 'multiselect':
        answer = await checkbox({
          message: question.message,
          choices: question.choices || [],
          required: false,
        });
        break;
      case 'confirm':
        answer = await confirm({
          message: question.message,
          default: defaultValue as boolean,
        });
        break;
      case 'input':
      default:
        answer = await input({
          message: question.message,
          default: defaultValue as string,
        });
    }

    answers[question.name] = answer;
  }

  return answers;
}
