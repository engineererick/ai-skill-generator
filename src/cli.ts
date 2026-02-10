#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { packageCommand } from './commands/package.js';
import { listTemplatesCommand } from './commands/list-templates.js';
import { listPresetsCommand } from './commands/list-presets.js';
import { installCommand } from './commands/install.js';

program
  .name('skill-gen')
  .description('AI Skill Generator - Create skills for AI coding assistants')
  .version('1.0.0');

program
  .command('init')
  .description('Create a new skill from a template')
  .option('-n, --name <name>', 'Skill name (kebab-case)')
  .option('-t, --type <type>', 'Skill type (microservice, frontend, library, basic)')
  .option('-o, --output <path>', 'Output directory', './skills')
  .option('-d, --desc <description>', 'Short description')
  .option('-p, --preset <preset>', 'Use a built-in preset')
  .option('-c, --context <paths...>', 'Additional context files/directories')
  .option('--with-references', 'Include references/ directory')
  .option('--with-scripts', 'Include scripts/ directory')
  .option('--with-assets', 'Include assets/ directory')
  .option('--install', 'Install to AI agents after creation')
  .option('--install-agent <agents...>', 'Install to specific agents only (requires --install)')
  .option('--non-interactive', 'Non-interactive mode (requires mandatory flags)')
  .action(initCommand);

program
  .command('install')
  .description('Install an existing skill to AI agents')
  .argument('<path>', 'Path to the skill to install')
  .option('-a, --agent <agents...>', 'Install to specific agents only')
  .option('-f, --force', 'Overwrite if already exists')
  .option('-y, --yes', 'Install to all detected agents without prompting')
  .action(installCommand);

program
  .command('validate')
  .description('Validate a skill structure')
  .argument('<path>', 'Path to the skill to validate')
  .action(validateCommand);

program
  .command('package')
  .description('Package a skill into a .skill file')
  .argument('<path>', 'Path to the skill to package')
  .option('-o, --output <path>', 'Output directory', '.')
  .action(packageCommand);

program
  .command('list-agents')
  .alias('agents')
  .description('List detected AI agents')
  .action(async () => {
    const { detectAgents } = await import('./agents/index.js');
    const { default: chalk } = await import('chalk');

    const detected = await detectAgents();
    console.log(chalk.cyan('\nDetected AI agents:\n'));

    for (const agent of detected) {
      const icon = agent.installed ? chalk.green('✅') : chalk.gray('❌');
      console.log(`${icon} ${agent.name}`);
    }

    const installed = detected.filter(a => a.installed).length;
    console.log(chalk.gray(`\n${installed} of ${detected.length} agents installed`));
  });

program
  .command('list-templates')
  .alias('templates')
  .description('List available templates')
  .action(listTemplatesCommand);

program
  .command('list-presets')
  .alias('presets')
  .description('List built-in presets')
  .action(listPresetsCommand);

program.parse();
