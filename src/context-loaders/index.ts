import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export interface ContextFile {
  filename: string;
  content: string;
  sourcePath: string;
}

export interface LoadedContext {
  files: ContextFile[];
  combinedContent: string;
  errors: string[];
}

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.mdx', '.yml', '.yaml', '.json'];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function loadContextFiles(
  contextPaths: string[]
): Promise<LoadedContext> {
  const result: LoadedContext = {
    files: [],
    combinedContent: '',
    errors: [],
  };

  for (const contextPath of contextPaths) {
    try {
      const resolvedPath = path.resolve(contextPath);
      const stat = await fs.stat(resolvedPath);

      if (stat.isDirectory()) {
        const entries = await fs.readdir(resolvedPath, { recursive: true });
        for (const entry of entries) {
          const entryPath = path.join(resolvedPath, entry);
          const entryStat = await fs.stat(entryPath);

          if (entryStat.isFile() && isSupportedFile(entry)) {
            await loadFile(entryPath, entry, result);
          }
        }
      } else {
        const filename = path.basename(resolvedPath);
        await loadFile(resolvedPath, filename, result);
      }
    } catch (error) {
      result.errors.push(`Could not load ${contextPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  result.combinedContent = result.files
    .map(f => `<!-- Source: ${f.sourcePath} -->\n\n${f.content}`)
    .join('\n\n---\n\n');

  return result;
}

async function loadFile(
  filePath: string,
  relativePath: string,
  result: LoadedContext
): Promise<void> {
  try {
    const stat = await fs.stat(filePath);

    if (stat.size > MAX_FILE_SIZE) {
      result.errors.push(`File too large (>1MB): ${relativePath}`);
      return;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    result.files.push({
      filename: relativePath,
      content,
      sourcePath: filePath,
    });
  } catch (error) {
    result.errors.push(`Error reading ${relativePath}: ${error instanceof Error ? error.message : error}`);
  }
}

function isSupportedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function formatContextForSkill(context: LoadedContext): string {
  if (context.files.length === 0) {
    return '';
  }

  const sections: string[] = ['## Additional Context\n'];

  for (const file of context.files) {
    sections.push(`### ${file.filename}`);
    sections.push(file.content);
    sections.push('');
  }

  return sections.join('\n');
}

export async function promptForContextFiles(): Promise<string[]> {
  const { input } = await import('@inquirer/prompts');
  const paths: string[] = [];

  console.log(chalk.gray('\nYou can add context files (.md, .txt, etc.)'));
  console.log(chalk.gray('   Press Enter without typing to continue\n'));

  while (true) {
    const answer = await input({
      message: 'Path to context file/directory (optional):',
    });

    if (!answer.trim()) {
      break;
    }

    try {
      await fs.access(path.resolve(answer));
      paths.push(answer);
      console.log(chalk.green(`  Added: ${answer}`));
    } catch {
      console.log(chalk.red(`  Not found: ${answer}`));
    }
  }

  return paths;
}
