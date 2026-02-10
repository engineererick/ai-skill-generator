import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateCommand(skillPath: string) {
  try {
    const resolvedPath = path.resolve(skillPath);

    console.log(chalk.gray('Validating skill:'), chalk.cyan(resolvedPath));
    console.log();

    const result = await validateSkill(resolvedPath);

    if (result.valid && result.warnings.length === 0) {
      console.log(chalk.green('Skill is valid'));
    } else if (result.valid) {
      console.log(chalk.yellow('Skill is valid with warnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  - ${warning}`));
      }
    } else {
      console.log(chalk.red('Validation failed:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      if (result.warnings.length > 0) {
        console.log();
        console.log(chalk.yellow('Warnings:'));
        for (const warning of result.warnings) {
          console.log(chalk.yellow(`  - ${warning}`));
        }
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function validateSkill(skillPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const skillMdPath = path.join(skillPath, 'SKILL.md');
  try {
    await fs.access(skillMdPath);
  } catch {
    result.valid = false;
    result.errors.push('SKILL.md not found');
    return result;
  }

  let content: string;
  try {
    content = await fs.readFile(skillMdPath, 'utf-8');
  } catch (error) {
    result.valid = false;
    result.errors.push(`Could not read SKILL.md: ${error instanceof Error ? error.message : error}`);
    return result;
  }

  if (!content.startsWith('---')) {
    result.valid = false;
    result.errors.push('SKILL.md must start with YAML frontmatter (---)');
    return result;
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    result.valid = false;
    result.errors.push('Invalid frontmatter. Expected format:\n---\nname: ...\ndescription: ...\n---');
    return result;
  }

  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = yaml.load(frontmatterMatch[1]) as Record<string, unknown>;
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid YAML: ${error instanceof Error ? error.message : error}`);
    return result;
  }

  const allowedKeys = ['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'];

  if (!frontmatter.name) {
    result.valid = false;
    result.errors.push('Missing required field: name');
  } else if (typeof frontmatter.name !== 'string') {
    result.valid = false;
    result.errors.push('Field "name" must be a string');
  } else {
    if (!/^[a-z0-9-]+$/.test(frontmatter.name)) {
      result.valid = false;
      result.errors.push(`Invalid name "${frontmatter.name}": use kebab-case (lowercase, numbers, hyphens)`);
    }
    if (frontmatter.name.startsWith('-') || frontmatter.name.endsWith('-') || frontmatter.name.includes('--')) {
      result.valid = false;
      result.errors.push(`Invalid name "${frontmatter.name}": cannot start/end with hyphen or have consecutive hyphens`);
    }
    if (frontmatter.name.length > 64) {
      result.valid = false;
      result.errors.push('Name too long: maximum 64 characters');
    }
  }

  if (!frontmatter.description) {
    result.valid = false;
    result.errors.push('Missing required field: description');
  } else if (typeof frontmatter.description !== 'string') {
    result.valid = false;
    result.errors.push('Field "description" must be a string');
  } else {
    if (frontmatter.description.length > 1024) {
      result.valid = false;
      result.errors.push('Description too long: maximum 1024 characters');
    }
    if (frontmatter.description.includes('<') || frontmatter.description.includes('>')) {
      result.valid = false;
      result.errors.push('Description cannot contain < or > characters');
    }
  }

  const unexpectedKeys = Object.keys(frontmatter).filter(key => !allowedKeys.includes(key));
  if (unexpectedKeys.length > 0) {
    result.valid = false;
    result.errors.push(`Unexpected keys in frontmatter: ${unexpectedKeys.join(', ')}`);
  }

  const bodyContent = content.slice(frontmatterMatch[0].length).trim();
  if (bodyContent.length === 0) {
    result.warnings.push('SKILL.md has no content after frontmatter');
  }

  return result;
}
