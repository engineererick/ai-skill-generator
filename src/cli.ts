#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { packageCommand } from './commands/package.js';
import { listTemplatesCommand } from './commands/list-templates.js';
import { listPresetsCommand } from './commands/list-presets.js';
import { installCommand } from './commands/install.js';
import { buildTemplateCommand } from './commands/template.js';
import { updateCommand } from './commands/update.js';
import { importCommand } from './commands/import.js';

program
  .name('skill-gen')
  .description('AI Skill Generator - Create skills for AI coding assistants')
  .version('1.2.0');

program
  .command('init')
  .description('Create a new skill from a template')
  .option('-n, --name <name>', 'Skill name (kebab-case)')
  .option('-t, --type <type>', 'Skill type (api, fullstack, frontend, microservice, devops, library, basic, or custom template id)')
  .option('-a, --auto', 'Auto-detect project type and technologies from current directory')
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
  .option('--dry-run', 'Preview generated files without writing to disk')
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

program
  .command('update')
  .alias('u')
  .description('Update an existing skill with new options')
  .argument('<path>', 'Path to the skill directory to update')
  .option('-n, --name <name>', 'Change skill name (kebab-case)')
  .option('-d, --desc <description>', 'Change description')
  .option('-t, --type <type>', 'Change template type (triggers full regeneration)')
  .option('-c, --context <paths...>', 'Replace context files')
  .option('--with-references', 'Enable references/ directory')
  .option('--without-references', 'Disable references/ directory')
  .option('--with-scripts', 'Enable scripts/ directory')
  .option('--without-scripts', 'Disable scripts/ directory')
  .option('--with-assets', 'Enable assets/ directory')
  .option('--without-assets', 'Disable assets/ directory')
  .option('--reinstall', 'Re-install to agents after update')
  .option('--reinstall-agent <agents...>', 'Re-install to specific agents only')
  .option('--non-interactive', 'Non-interactive mode (only apply changes from flags)')
  .option('--dry-run', 'Preview changes without writing to disk')
  .option('--no-backup', 'Skip backup creation before overwriting')
  .action(updateCommand);

program
  .command('import')
  .alias('i')
  .description('Import an existing AI instruction file as a skill')
  .argument('[file]', 'Path to the instruction file to import')
  .option('--scan', 'Scan current directory for known AI instruction files')
  .option('-n, --name <name>', 'Override skill name')
  .option('-d, --desc <desc>', 'Override description')
  .option('-o, --output <path>', 'Output directory', './skills')
  .option('--install', 'Install to AI agents after import')
  .option('--non-interactive', 'Non-interactive mode')
  .option('--dry-run', 'Preview without writing')
  .action(importCommand);

program.addCommand(buildTemplateCommand());

program.parse();
