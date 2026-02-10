import { input, select, confirm, checkbox } from '@inquirer/prompts';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { generateSkillContent, SkillData, getTemplateChoices, getTemplateConfig } from '../templates/index.js';
import { listPresets, getPreset, Preset } from '../presets/index.js';
import { loadContextFiles, promptForContextFiles } from '../context-loaders/index.js';
import { detectAgents, installToAllAgents, formatInstallResults } from '../agents/index.js';

interface InitOptions {
  name?: string;
  type?: string;
  output: string;
  desc?: string;
  preset?: string;
  context?: string[];
  withReferences?: boolean;
  withScripts?: boolean;
  withAssets?: boolean;
  nonInteractive?: boolean;
  install?: boolean;
  installAgent?: string[];
}

export async function initCommand(options: InitOptions) {
  try {
    console.log(chalk.cyan.bold('\n🚀 Skill Generator\n'));

    let data: Partial<SkillData> = {
      name: options.name,
      type: options.type as SkillData['type'] | undefined,
      description: options.desc,
      includeReferences: options.withReferences,
      includeScripts: options.withScripts,
      includeAssets: options.withAssets,
    };

    let selectedPreset: Preset | undefined;

    // NON-INTERACTIVE MODE
    if (options.nonInteractive) {
      if (options.preset) {
        selectedPreset = getPreset(options.preset);
        if (selectedPreset) {
          data.type = selectedPreset.type;
          Object.assign(data, selectedPreset.options);
        } else {
          console.error(chalk.red(`Preset not found: ${options.preset}`));
          process.exit(1);
        }
      }

      if (!data.name || !data.type || !data.description) {
        console.error(chalk.red('Non-interactive mode requires: --name, --type (or --preset), --desc'));
        process.exit(1);
      }

      data.includeReferences = options.withReferences ?? false;
      data.includeScripts = options.withScripts ?? false;
      data.includeAssets = options.withAssets ?? false;
    }
    // INTERACTIVE MODE
    else {
      // 1. Ask about presets
      const presets = listPresets();
      if (presets.length > 0) {
        const usePreset = await confirm({
          message: 'Use a built-in preset?',
          default: false,
        });

        if (usePreset) {
          const presetKey = await select({
            message: 'Select a preset:',
            choices: [
              ...presets,
              { name: 'None (manual configuration)', value: 'none', description: 'Configure everything step by step' },
            ],
          });

          if (presetKey !== 'none') {
            selectedPreset = getPreset(presetKey);
            if (selectedPreset) {
              data.type = selectedPreset.type;
              Object.assign(data, selectedPreset.options);
              console.log(chalk.green(`\nPreset selected: ${selectedPreset.name}`));
              console.log(chalk.gray(`   ${selectedPreset.description}\n`));
            }
          }
        }
      }

      // 2. Ask for name
      if (!data.name) {
        data.name = await input({
          message: 'Skill name (kebab-case):',
          validate: (value) => {
            if (!value) return 'Name is required';
            if (!/^[a-z0-9-]+$/.test(value)) {
              return 'Use only lowercase letters, numbers, and hyphens (kebab-case)';
            }
            if (value.startsWith('-') || value.endsWith('-')) {
              return 'Cannot start or end with a hyphen';
            }
            return true;
          },
        });
      }

      // 3. Ask for type if not from preset
      if (!data.type) {
        data.type = await select({
          message: 'Skill type?',
          choices: getTemplateChoices(),
        }) as SkillData['type'];
      }

      // 4. Ask for description
      if (!data.description) {
        data.description = await input({
          message: 'Short description:',
          default: `Skill for ${data.name}`,
        });
      }

      // 5. Template-specific questions (skip if already set by preset)
      const templateConfig = getTemplateConfig(data.type);
      if (templateConfig) {
        console.log(chalk.gray('\nTemplate configuration\n'));

        for (const question of templateConfig.questions) {
          if (data[question.name] !== undefined) {
            console.log(chalk.gray(`  ${question.message}: ${data[question.name]} (from preset)`));
            continue;
          }

          if (question.when && !question.when(data)) {
            continue;
          }

          let answer: unknown;

          switch (question.type) {
            case 'select':
              answer = await select({
                message: question.message,
                choices: question.choices || [],
                default: question.default as string,
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
                default: question.default as boolean,
              });
              break;
            case 'input':
            default:
              answer = await input({
                message: question.message,
                default: question.default as string,
              });
          }

          data[question.name] = answer;
        }
      }

      // 6. Ask about additional resources
      console.log(chalk.gray('\nAdditional resources\n'));

      if (data.includeReferences === undefined) {
        data.includeReferences = await confirm({
          message: 'Include references/ directory?',
          default: true,
        });
      }

      if (data.includeScripts === undefined) {
        data.includeScripts = await confirm({
          message: 'Include scripts/ directory?',
          default: false,
        });
      }

      if (data.includeAssets === undefined) {
        data.includeAssets = await confirm({
          message: 'Include assets/ directory?',
          default: false,
        });
      }

      // 7. Ask about external context
      if (!options.context || options.context.length === 0) {
        const useContext = await confirm({
          message: 'Include external context files?',
          default: false,
        });

        if (useContext) {
          options.context = await promptForContextFiles();
        }
      }
    }

    // Validate type
    const templateConfig = getTemplateConfig(data.type!);
    if (!templateConfig) {
      console.error(chalk.red(`Invalid skill type: ${data.type}`));
      console.log(chalk.gray('Valid types: basic, microservice, frontend, library'));
      process.exit(1);
    }

    // Load context if provided
    let contextFiles: Awaited<ReturnType<typeof loadContextFiles>>['files'] = [];
    let contextErrors: string[] = [];

    if (options.context && options.context.length > 0) {
      console.log(chalk.gray('\nLoading context files...'));
      const loaded = await loadContextFiles(options.context);
      contextFiles = loaded.files;
      contextErrors = loaded.errors;

      if (contextFiles.length > 0) {
        console.log(chalk.green(`  ${contextFiles.length} file(s) loaded`));
      }

      if (contextErrors.length > 0) {
        for (const error of contextErrors) {
          console.log(chalk.yellow(`  ${error}`));
        }
      }
    }

    // Create output directory
    const outputDir = path.resolve(options.output, data.name!);

    // Check if already exists
    try {
      await fs.access(outputDir);
      console.error(chalk.red(`\nDirectory already exists: ${outputDir}`));
      process.exit(1);
    } catch {
      // Does not exist, we can continue
    }

    // Generate content
    const generated = generateSkillContent(
      data as SkillData,
      templateConfig,
      contextFiles
    );

    // Create directory and write files
    await fs.mkdir(outputDir, { recursive: true });

    // Main SKILL.md
    await fs.writeFile(path.join(outputDir, 'SKILL.md'), generated['SKILL.md']);

    // References
    if (generated['references/']) {
      const refsDir = path.join(outputDir, 'references');
      await fs.mkdir(refsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['references/'])) {
        await fs.writeFile(path.join(refsDir, filename), content);
      }
    } else if (data.includeReferences) {
      await fs.mkdir(path.join(outputDir, 'references'), { recursive: true });
    }

    // Scripts
    if (generated['scripts/']) {
      const scriptsDir = path.join(outputDir, 'scripts');
      await fs.mkdir(scriptsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['scripts/'])) {
        await fs.writeFile(path.join(scriptsDir, filename), content);
      }
    } else if (data.includeScripts) {
      await fs.mkdir(path.join(outputDir, 'scripts'), { recursive: true });
    }

    // Assets
    if (generated['assets/']) {
      const assetsDir = path.join(outputDir, 'assets');
      await fs.mkdir(assetsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['assets/'])) {
        await fs.writeFile(path.join(assetsDir, filename), content);
      }
    } else if (data.includeAssets) {
      await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });
    }

    // Show summary
    console.log(chalk.green('\nSkill created successfully!\n'));
    console.log(chalk.white(`Location: ${chalk.cyan(outputDir)}\n`));

    console.log(chalk.gray('Generated files:'));
    console.log(chalk.gray('  SKILL.md'));
    if (data.includeReferences) {
      const refCount = generated['references/'] ? Object.keys(generated['references/']).length : 0;
      console.log(chalk.gray(`  references/${refCount > 0 ? ` (${refCount} files)` : ''}`));
    }
    if (data.includeScripts) {
      const scriptCount = generated['scripts/'] ? Object.keys(generated['scripts/']).length : 0;
      console.log(chalk.gray(`  scripts/${scriptCount > 0 ? ` (${scriptCount} files)` : ''}`));
    }
    if (data.includeAssets) console.log(chalk.gray('  assets/'));
    console.log();

    if (selectedPreset) {
      console.log(chalk.gray(`Preset used: ${chalk.cyan(selectedPreset.name)}`));
      console.log();
    }

    // Install to agents if requested
    if (options.install || (!options.nonInteractive && await shouldInstallPrompt())) {
      console.log();
      const detected = await detectAgents();
      const installedAgents = detected.filter(a => a.installed);

      if (installedAgents.length === 0) {
        console.log(chalk.yellow('No AI agents detected.'));
      } else {
        let agentsToInstall: string[] = [];

        if (options.installAgent && options.installAgent.length > 0) {
          agentsToInstall = options.installAgent;
        } else if (options.nonInteractive) {
          agentsToInstall = installedAgents.map(a => a.id);
        } else {
          console.log(chalk.cyan('Detected AI agents:\n'));
          for (const agent of installedAgents) {
            console.log(chalk.green(`  ${agent.name}`));
          }

          const installAll = await confirm({
            message: '\nInstall to all agents?',
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

        if (agentsToInstall.length > 0) {
          console.log(chalk.gray('\nInstalling to agents...\n'));
          const results = await installToAllAgents(outputDir, agentsToInstall);
          console.log(formatInstallResults(results));
          console.log();
        }
      }
    }

    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray(`  1. Review ${chalk.cyan('SKILL.md')} and complete the content`));
    console.log(chalk.gray(`  2. Validate: ${chalk.cyan(`skill-gen validate ${outputDir}`)}`));
    console.log(chalk.gray(`  3. Package: ${chalk.cyan(`skill-gen package ${outputDir}`)}`));
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

async function shouldInstallPrompt(): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  return confirm({
    message: 'Install this skill to your AI agents?',
    default: false,
  });
}
