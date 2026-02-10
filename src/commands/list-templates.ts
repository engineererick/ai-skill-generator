import chalk from 'chalk';
import { getTemplateChoices } from '../templates/index.js';

export async function listTemplatesCommand() {
  console.log(chalk.gray('Available templates:\n'));

  const templates = getTemplateChoices();

  for (const template of templates) {
    console.log(chalk.cyan(`${template.value}`));
    console.log(chalk.white(`  ${template.name}`));
    console.log(chalk.gray(`  ${template.description}`));
    console.log();
  }

  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray(`  skill-gen init --type ${chalk.cyan('<template>')}`));
  console.log();
  console.log(chalk.gray('Example:'));
  console.log(chalk.gray(`  skill-gen init --type frontend --name my-skill`));
}
