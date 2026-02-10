import chalk from 'chalk';
import { listPresets } from '../presets/index.js';

export async function listPresetsCommand() {
  console.log(chalk.gray('Available presets:\n'));

  const presets = listPresets();

  for (const preset of presets) {
    console.log(chalk.cyan(`${preset.value}`));
    console.log(chalk.white(`  ${preset.name}`));
    console.log(chalk.gray(`  ${preset.description}`));
    console.log();
  }

  console.log(chalk.gray('Usage:'));
  console.log(chalk.gray(`  skill-gen init --preset ${chalk.cyan('<preset>')}`));
  console.log();
  console.log(chalk.gray('Example:'));
  console.log(chalk.gray(`  skill-gen init --preset modern-react --name my-skill`));
}
