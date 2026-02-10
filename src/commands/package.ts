import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import chalk from 'chalk';
import { validateCommand } from './validate.js';

interface PackageOptions {
  output: string;
}

export async function packageCommand(skillPath: string, options: PackageOptions) {
  try {
    const resolvedPath = path.resolve(skillPath);
    const skillName = path.basename(resolvedPath);

    console.log(chalk.gray('Packaging skill:'), chalk.cyan(skillName));
    console.log();

    console.log(chalk.gray('Validating before packaging...'));
    console.log();

    const { validateSkill } = await import('../validators/skill-validator.js');
    const validation = await validateSkill(resolvedPath);

    if (!validation.valid) {
      console.log(chalk.red('Validation failed. Fix errors before packaging:'));
      for (const error of validation.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('Warnings (non-blocking):'));
      for (const warning of validation.warnings) {
        console.log(chalk.yellow(`  - ${warning}`));
      }
      console.log();
    }

    const zip = new AdmZip();

    const files = await getAllFiles(resolvedPath);
    for (const file of files) {
      const relativePath = path.relative(resolvedPath, file);
      const content = await fs.readFile(file);
      zip.addFile(relativePath, content);
    }

    const outputDir = path.resolve(options.output);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${skillName}.skill`);
    zip.writeZip(outputPath);

    console.log(chalk.green('Skill packaged:'), chalk.cyan(outputPath));
    console.log();
    console.log(chalk.gray('Files included:'), files.length);

    const stats = await fs.stat(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(chalk.gray('Size:'), `${sizeKB} KB`);

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
