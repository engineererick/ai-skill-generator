import { select, confirm, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { detectAgents, installToAllAgents, formatInstallResults } from '../agents/index.js';

interface InstallOptions {
  agent?: string[];
  force?: boolean;
  yes?: boolean;
}

export async function installCommand(skillPath: string, options: InstallOptions) {
  try {
    console.log(chalk.cyan('\nInstalling skill to AI agents\n'));
    console.log(chalk.gray(`Skill: ${skillPath}\n`));

    // Detect installed agents
    const detected = await detectAgents();
    const installedAgents = detected.filter(a => a.installed);

    if (installedAgents.length === 0) {
      console.log(chalk.yellow('No AI agents detected.'));
      console.log(chalk.gray('   Supported agents: Claude Code, Cursor, VS Code, Codex, Goose, OpenCode, Gemini CLI, Letta, Amp'));
      process.exit(0);
    }

    let agentsToInstall: string[] = [];

    if (options.yes) {
      // Automatic mode: install to all
      agentsToInstall = installedAgents.map(a => a.id);
    } else if (options.agent && options.agent.length > 0) {
      // Specific agents via flag
      agentsToInstall = options.agent;
    } else {
      // Interactive mode
      const agentList = installedAgents.map(a => a.name).join(', ');

      const installAll = await confirm({
        message: `Install to all detected agents? (${agentList})`,
        default: true,
      });

      if (installAll) {
        agentsToInstall = installedAgents.map(a => a.id);
      } else {
        const choices = installedAgents.map(a => ({
          name: a.name,
          value: a.id,
          checked: true,
        }));

        agentsToInstall = await checkbox({
          message: 'Select agents:',
          choices,
          required: true,
        });
      }
    }

    if (agentsToInstall.length === 0) {
      console.log(chalk.yellow('\nNo agents selected. Installation cancelled.'));
      process.exit(0);
    }

    console.log(chalk.gray('\nInstalling...\n'));

    const results = await installToAllAgents(skillPath, agentsToInstall);

    console.log(formatInstallResults(results));
    console.log();

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      console.log(chalk.green(`Installation completed for ${successCount} agent(s)`));
    }

    const failCount = results.filter(r => !r.success).length;
    if (failCount > 0) {
      console.log(chalk.yellow(`${failCount} agent(s) could not be installed`));
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\nCancelled by user'));
      process.exit(0);
    }
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
