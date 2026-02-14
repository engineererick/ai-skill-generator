import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { input, select, confirm } from '@inquirer/prompts';
import { loadCustomTemplates } from '../custom-templates/loader.js';
import { validateCustomTemplate } from '../custom-templates/validator.js';
import { getTemplateChoices } from '../templates/index.js';

export function buildTemplateCommand(): Command {
  const cmd = new Command('template')
    .alias('t')
    .description('Create and manage custom templates');

  cmd
    .command('create')
    .argument('[name]', 'Template id (kebab-case)')
    .description('Scaffold a new custom template')
    .action(templateCreateCommand);

  cmd
    .command('list')
    .description('List all available templates (built-in + custom)')
    .action(templateListCommand);

  cmd
    .command('validate')
    .argument('<file>', 'Path to a custom template YAML file')
    .description('Validate a custom template YAML file')
    .action(templateValidateCommand);

  return cmd;
}

async function templateCreateCommand(nameArg?: string) {
  try {
    console.log(chalk.cyan.bold('\n📝 Custom Template Scaffold\n'));

    // Template id
    const id = nameArg || await input({
      message: 'Template id (kebab-case):',
      validate: (value) => {
        if (!value) return 'Id is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Use only lowercase letters, numbers, and hyphens (kebab-case)';
        }
        if (value.startsWith('-') || value.endsWith('-')) {
          return 'Cannot start or end with a hyphen';
        }
        return true;
      },
    });

    const displayName = await input({
      message: 'Display name:',
      default: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    });

    const description = await input({
      message: 'Short description:',
      default: `Custom template for ${displayName}`,
    });

    // Questions
    const questions: Array<{
      name: string;
      message: string;
      type: string;
      choices?: { name: string; value: string }[];
      default?: string;
    }> = [];

    const addQuestions = await confirm({
      message: 'Add interactive questions?',
      default: true,
    });

    if (addQuestions) {
      let addMore = true;
      while (addMore) {
        const qName = await input({ message: 'Question variable name:' });
        const qMessage = await input({ message: 'Question prompt message:' });
        const qType = await select({
          message: 'Question type:',
          choices: [
            { name: 'Select (single choice)', value: 'select' },
            { name: 'Input (free text)', value: 'input' },
            { name: 'Confirm (yes/no)', value: 'confirm' },
            { name: 'Multi-select (multiple choices)', value: 'multiselect' },
          ],
        });

        const question: typeof questions[0] = { name: qName, message: qMessage, type: qType };

        if (qType === 'select' || qType === 'multiselect') {
          const choicesStr = await input({
            message: 'Choices (comma-separated values):',
            validate: (v) => v ? true : 'At least one choice required',
          });
          question.choices = choicesStr.split(',').map(c => {
            const val = c.trim();
            return { name: val.charAt(0).toUpperCase() + val.slice(1), value: val };
          });
          question.default = question.choices[0].value;
        }

        questions.push(question);

        addMore = await confirm({ message: 'Add another question?', default: false });
      }
    }

    // Variables
    const variables: Record<string, string> = {};
    const addVars = await confirm({
      message: 'Add simple variables (string interpolations)?',
      default: false,
    });

    if (addVars) {
      let addMore = true;
      while (addMore) {
        const varName = await input({ message: 'Variable name:' });
        const varExpr = await input({
          message: `Variable value (use {{questionName}} for interpolation):`,
        });
        variables[varName] = varExpr;
        addMore = await confirm({ message: 'Add another variable?', default: false });
      }
    }

    // Save location
    const scope = await select({
      message: 'Save to:',
      choices: [
        { name: 'Global (~/.skill-generator/templates/)', value: 'global' },
        { name: 'Project (.skill-generator/templates/)', value: 'project' },
      ],
    });

    const baseDir = scope === 'global'
      ? path.join(os.homedir(), '.skill-generator', 'templates')
      : path.join(process.cwd(), '.skill-generator', 'templates');

    // Build YAML content
    const questionVars = questions.map(q => `{{${q.name}}}`).join(', ');
    const templateObj: Record<string, unknown> = {
      name: displayName,
      description,
    };

    if (questions.length > 0) {
      templateObj.questions = questions;
    }

    if (Object.keys(variables).length > 0) {
      templateObj.variables = variables;
    }

    // Build SKILL.md content template
    let skillContent = `---\nname: {{name}}\ndescription: |\n  {{description}}\n---\n\n# {{titleCase}}\n\n{{description}}\n`;

    if (questions.length > 0) {
      skillContent += `\n## Configuration\n\n`;
      for (const q of questions) {
        skillContent += `- **${q.message}**: {{${q.name}}}\n`;
      }
    }

    skillContent += `\n## Usage\n\n[Add usage instructions here]\n\n---\n\n**Generated with:** Skill Generator\n`;

    templateObj.content = {
      'SKILL.md': skillContent,
    };

    const yamlContent = yaml.dump(templateObj, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });

    // Write file
    await fs.mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, `${id}.yaml`);

    try {
      await fs.access(filePath);
      const overwrite = await confirm({
        message: `Template "${id}" already exists. Overwrite?`,
        default: false,
      });
      if (!overwrite) {
        console.log(chalk.yellow('\nCancelled.'));
        return;
      }
    } catch {
      // File doesn't exist, proceed
    }

    await fs.writeFile(filePath, yamlContent, 'utf-8');

    console.log(chalk.green(`\nTemplate created: ${chalk.cyan(filePath)}`));
    console.log(chalk.gray(`\nEdit the YAML file to customize the SKILL.md template.`));
    console.log(chalk.gray(`For advanced variable logic, create a companion JS file:`));
    console.log(chalk.gray(`  ${path.join(baseDir, `${id}.js`)}`));
    console.log(chalk.gray(`\nUsage:`));
    console.log(chalk.gray(`  skill-gen init --type ${chalk.cyan(id)}`));
    console.log();

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\nCancelled by user'));
      process.exit(0);
    }
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function templateListCommand() {
  console.log(chalk.cyan.bold('\nAvailable Templates\n'));

  // Built-in templates
  console.log(chalk.white('Built-in:\n'));

  const builtInIds = ['basic', 'api', 'fullstack', 'frontend', 'microservice', 'devops', 'library'];
  const allChoices = await getTemplateChoices();

  for (const choice of allChoices) {
    if (builtInIds.includes(choice.value)) {
      console.log(chalk.cyan(`  ${choice.value}`));
      console.log(chalk.white(`    ${choice.name}`));
      console.log(chalk.gray(`    ${choice.description}`));
      console.log();
    }
  }

  // Custom templates
  const { templates, errors } = await loadCustomTemplates();

  if (templates.length > 0) {
    console.log(chalk.white('Custom:\n'));

    for (const t of templates) {
      const scope = t.sourcePath.includes(os.homedir()) ? 'global' : 'project';
      console.log(chalk.cyan(`  ${t.id}`) + chalk.yellow(' *'));
      console.log(chalk.white(`    ${t.name}`));
      console.log(chalk.gray(`    ${t.description}`));
      console.log(chalk.gray(`    [${scope}] ${t.sourcePath}`));
      console.log();
    }
  } else {
    console.log(chalk.gray('No custom templates found.\n'));
    console.log(chalk.gray('Create one with:'));
    console.log(chalk.gray(`  skill-gen template create`));
    console.log();
  }

  if (errors.length > 0) {
    console.log(chalk.yellow('Warnings:\n'));
    for (const err of errors) {
      console.log(chalk.yellow(`  ${err}`));
    }
    console.log();
  }

  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray(`  skill-gen init --type ${chalk.cyan('<template-id>')}`));
  console.log();
}

async function templateValidateCommand(file: string) {
  const filePath = path.resolve(file);

  console.log(chalk.cyan(`\nValidating: ${filePath}\n`));

  // Check file exists
  try {
    await fs.access(filePath);
  } catch {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  // Read and parse
  let parsed: unknown;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    parsed = yaml.load(content);
  } catch (err) {
    console.error(chalk.red(`YAML parse error: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }

  // Validate
  const result = validateCustomTemplate(parsed, filePath);

  if (result.templateId) {
    console.log(chalk.white(`  Template ID: ${chalk.cyan(result.templateId)}`));
    const obj = parsed as Record<string, unknown>;
    if (obj.name) {
      console.log(chalk.white(`  Name: ${obj.name}`));
    }
    console.log();
  }

  // Show results
  if (result.errors.length > 0) {
    for (const err of result.errors) {
      console.log(chalk.red(`  [ERROR] ${err}`));
    }
  }

  if (result.warnings.length > 0) {
    for (const warn of result.warnings) {
      console.log(chalk.yellow(`  [WARN] ${warn}`));
    }
  }

  if (result.valid) {
    const warnSuffix = result.warnings.length > 0
      ? ` with ${result.warnings.length} warning(s)`
      : '';
    console.log(chalk.green(`\nValidation passed${warnSuffix}.`));

    // Count questions if present
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      console.log(chalk.gray(`  ${obj.questions.length} question(s) defined`));
    }
    console.log();
  } else {
    console.log(chalk.red(`\nValidation failed with ${result.errors.length} error(s).`));
    console.log();
    process.exit(1);
  }
}
