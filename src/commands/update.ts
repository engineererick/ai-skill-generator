import { input, select, confirm, checkbox } from '@inquirer/prompts';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { generateSkillContent, SkillData, getTemplateChoices } from '../templates/index.js';
import { resolveTemplateConfig } from '../templates/configs/index.js';
import { loadContextFiles, promptForContextFiles } from '../context-loaders/index.js';
import { detectAgents, installToAllAgents, formatInstallResults } from '../agents/index.js';
import { saveMetadata, loadMetadata, getGeneratorVersion } from '../metadata/index.js';
import type { SkillMetadata } from '../metadata/types.js';
import { printFileTree, previewAndConfirm, promptTemplateQuestions } from './shared.js';

interface UpdateOptions {
  name?: string;
  type?: string;
  desc?: string;
  context?: string[];
  withReferences?: boolean;
  withoutReferences?: boolean;
  withScripts?: boolean;
  withoutScripts?: boolean;
  withAssets?: boolean;
  withoutAssets?: boolean;
  reinstall?: boolean;
  reinstallAgent?: string[];
  nonInteractive?: boolean;
  dryRun?: boolean;
  backup?: boolean; // Commander negated option: --no-backup sets this to false
}

export async function updateCommand(skillPath: string, options: UpdateOptions) {
  try {
    const resolvedPath = path.resolve(skillPath);

    console.log(chalk.cyan.bold('\n🔄 Skill Update\n'));

    // 1. Validate skill directory
    const skillMdPath = path.join(resolvedPath, 'SKILL.md');
    try {
      await fs.access(skillMdPath);
    } catch {
      console.error(chalk.red(`SKILL.md not found in: ${resolvedPath}`));
      console.log(chalk.gray('Make sure you provide the path to a valid skill directory.'));
      process.exit(1);
    }

    // 2. Load metadata
    let metadata = await loadMetadata(resolvedPath);
    let data: Partial<SkillData>;

    if (!metadata) {
      // Adoption flow: skill created before metadata tracking
      if (options.nonInteractive) {
        if (!options.type) {
          console.error(chalk.red('No .skillgen.json found. Non-interactive update requires --type flag for skills without metadata.'));
          process.exit(1);
        }
        // Build minimal SkillData from frontmatter + flags
        const frontmatter = await parseFrontmatter(skillMdPath);
        data = {
          name: options.name ?? frontmatter.name ?? path.basename(resolvedPath),
          type: options.type,
          description: options.desc ?? frontmatter.description ?? '',
          includeReferences: resolveDirectoryFlag(options.withReferences, options.withoutReferences, await dirExists(path.join(resolvedPath, 'references'))),
          includeScripts: resolveDirectoryFlag(options.withScripts, options.withoutScripts, await dirExists(path.join(resolvedPath, 'scripts'))),
          includeAssets: resolveDirectoryFlag(options.withAssets, options.withoutAssets, await dirExists(path.join(resolvedPath, 'assets'))),
        };
      } else {
        console.log(chalk.yellow('No .skillgen.json found. Entering adoption flow...\n'));
        const frontmatter = await parseFrontmatter(skillMdPath);

        const name = frontmatter.name ?? path.basename(resolvedPath);
        const description = frontmatter.description ?? '';

        console.log(chalk.gray(`  Name: ${name}`));
        console.log(chalk.gray(`  Description: ${description}\n`));

        const type = await select({
          message: 'What template was used to create this skill?',
          choices: await getTemplateChoices(),
        }) as string;

        const runQuestions = await confirm({
          message: 'Run through template questions to establish baseline?',
          default: true,
        });

        data = {
          name,
          type,
          description,
          includeReferences: await dirExists(path.join(resolvedPath, 'references')),
          includeScripts: await dirExists(path.join(resolvedPath, 'scripts')),
          includeAssets: await dirExists(path.join(resolvedPath, 'assets')),
        };

        if (runQuestions) {
          const config = await resolveTemplateConfig(type);
          if (config) {
            console.log(chalk.gray('\nTemplate configuration\n'));
            const answers = await promptTemplateQuestions(config, data, { skipLabel: 'default' });
            Object.assign(data, answers);
          }
        }

        // Create initial metadata
        metadata = {
          version: 1,
          generatorVersion: await getGeneratorVersion(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skillData: data as SkillData,
          templateType: type,
          isCustomTemplate: false,
        };
      }
    } else {
      // Use existing metadata
      data = { ...metadata.skillData };
    }

    // 3. Resolve template config
    const currentType = options.type ?? data.type!;
    let templateConfig = await resolveTemplateConfig(currentType);

    if (!templateConfig) {
      if (options.nonInteractive) {
        console.error(chalk.red(`Template '${currentType}' not found.`));
        process.exit(1);
      }
      console.log(chalk.yellow(`Template '${currentType}' not found. It may have been deleted.`));
      const newType = await select({
        message: 'Select a new template type:',
        choices: await getTemplateChoices(),
      }) as string;
      templateConfig = await resolveTemplateConfig(newType);
      if (!templateConfig) {
        console.error(chalk.red(`Template '${newType}' not found.`));
        process.exit(1);
      }
      data.type = newType;
    }

    // 4. Apply CLI flag overrides (non-interactive direct changes)
    if (options.name) data.name = options.name;
    if (options.desc) data.description = options.desc;
    if (options.type && options.type !== metadata?.templateType) {
      // Type change — reset template-specific fields
      const baseData: Partial<SkillData> = {
        name: data.name,
        type: options.type,
        description: data.description,
        includeReferences: data.includeReferences,
        includeScripts: data.includeScripts,
        includeAssets: data.includeAssets,
      };
      data = baseData;
    }

    // Apply directory flags
    if (options.withReferences !== undefined || options.withoutReferences !== undefined) {
      data.includeReferences = resolveDirectoryFlag(options.withReferences, options.withoutReferences, data.includeReferences);
    }
    if (options.withScripts !== undefined || options.withoutScripts !== undefined) {
      data.includeScripts = resolveDirectoryFlag(options.withScripts, options.withoutScripts, data.includeScripts);
    }
    if (options.withAssets !== undefined || options.withoutAssets !== undefined) {
      data.includeAssets = resolveDirectoryFlag(options.withAssets, options.withoutAssets, data.includeAssets);
    }

    // 5. Interactive update flow
    if (!options.nonInteractive) {
      // Show current config
      console.log(chalk.white.bold('Configuracion actual:\n'));
      console.log(chalk.gray(`  Template: ${chalk.cyan(data.type!)}`));
      console.log(chalk.gray(`  Name: ${data.name}`));
      console.log(chalk.gray(`  Description: ${data.description}`));

      // Show template-specific fields
      for (const question of templateConfig.questions) {
        if (data[question.name] !== undefined) {
          console.log(chalk.gray(`  ${question.name}: ${data[question.name]}`));
        }
      }

      console.log(chalk.gray(`  includeReferences: ${data.includeReferences}`));
      console.log(chalk.gray(`  includeScripts: ${data.includeScripts}`));
      console.log(chalk.gray(`  includeAssets: ${data.includeAssets}`));
      console.log();

      // Ask what to update
      const updateCategories = await checkbox({
        message: 'Que deseas actualizar?',
        choices: [
          { name: 'Nombre y descripcion', value: 'name-desc' },
          { name: 'Opciones del template (framework, database, etc.)', value: 'template-options' },
          { name: 'Directorios adicionales (references, scripts, assets)', value: 'directories' },
          { name: 'Archivos de contexto', value: 'context' },
          { name: 'Tipo de template (regeneracion completa)', value: 'template-type' },
        ],
        required: true,
      });

      // Handle template type change
      if (updateCategories.includes('template-type')) {
        console.log(chalk.yellow('\nCambiar el tipo de template regenerara todo el contenido.\n'));
        const newType = await select({
          message: 'Nuevo tipo de template:',
          choices: await getTemplateChoices(),
          default: data.type,
        }) as string;

        if (newType !== data.type) {
          // Reset template-specific fields
          const baseData: Partial<SkillData> = {
            name: data.name,
            type: newType,
            description: data.description,
            includeReferences: data.includeReferences,
            includeScripts: data.includeScripts,
            includeAssets: data.includeAssets,
          };
          data = baseData;

          templateConfig = (await resolveTemplateConfig(newType))!;
        }
      }

      // Handle name/description change
      if (updateCategories.includes('name-desc')) {
        data.name = await input({
          message: 'Skill name (kebab-case):',
          default: data.name,
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

        data.description = await input({
          message: 'Short description:',
          default: data.description,
        });
      }

      // Handle template options
      if (updateCategories.includes('template-options') || updateCategories.includes('template-type')) {
        console.log(chalk.gray('\nTemplate configuration\n'));
        const answers = await promptTemplateQuestions(templateConfig, data, { skipLabel: 'current' });
        Object.assign(data, answers);
      }

      // Handle directories
      if (updateCategories.includes('directories')) {
        console.log(chalk.gray('\nAdditional resources\n'));

        data.includeReferences = await confirm({
          message: 'Include references/ directory?',
          default: data.includeReferences ?? true,
        });

        data.includeScripts = await confirm({
          message: 'Include scripts/ directory?',
          default: data.includeScripts ?? false,
        });

        data.includeAssets = await confirm({
          message: 'Include assets/ directory?',
          default: data.includeAssets ?? false,
        });
      }

      // Handle context files
      if (updateCategories.includes('context')) {
        options.context = await promptForContextFiles();
      }
    }

    // 6. Apply template defaults for unanswered questions
    for (const question of templateConfig.questions) {
      if (data[question.name] === undefined && question.default !== undefined) {
        data[question.name] = question.default;
      }
    }

    // 7. Load context files
    let contextFiles: Awaited<ReturnType<typeof loadContextFiles>>['files'] = [];

    const contextPaths = options.context ?? metadata?.contextPaths;
    if (contextPaths && contextPaths.length > 0) {
      console.log(chalk.gray('\nLoading context files...'));
      const loaded = await loadContextFiles(contextPaths);
      contextFiles = loaded.files;

      if (contextFiles.length > 0) {
        console.log(chalk.green(`  ${contextFiles.length} file(s) loaded`));
      }

      for (const error of loaded.errors) {
        console.log(chalk.yellow(`  ${error}`));
      }
    }

    // 8. Regenerate content
    const generated = generateSkillContent(
      data as SkillData,
      templateConfig,
      contextFiles
    );

    // 9. Dry run
    if (options.dryRun) {
      console.log(chalk.cyan('\nPreview (dry run):\n'));
      printFileTree(data.name!, generated, data);
      console.log(chalk.yellow('\nNo files were written (dry-run mode)\n'));
      return;
    }

    // 10. Interactive preview
    if (!options.nonInteractive) {
      const proceed = await previewAndConfirm(data.name!, generated, data, 'Aplicar cambios?');
      if (!proceed) {
        console.log(chalk.yellow('\nCancelado. No se aplicaron cambios.\n'));
        return;
      }
    }

    // 11. Backup
    if (options.backup !== false) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').slice(0, 15);
      const backupPath = `${resolvedPath}.backup-${timestamp}`;
      await copyDir(resolvedPath, backupPath);
      console.log(chalk.gray(`\nBackup: ${backupPath}`));
    }

    // 12. Write files
    // Overwrite SKILL.md
    await fs.writeFile(path.join(resolvedPath, 'SKILL.md'), generated['SKILL.md']);

    // References
    if (generated['references/']) {
      const refsDir = path.join(resolvedPath, 'references');
      await fs.mkdir(refsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['references/'])) {
        await fs.writeFile(path.join(refsDir, filename), content);
      }
    } else if (data.includeReferences) {
      await fs.mkdir(path.join(resolvedPath, 'references'), { recursive: true });
    }

    // Scripts
    if (generated['scripts/']) {
      const scriptsDir = path.join(resolvedPath, 'scripts');
      await fs.mkdir(scriptsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['scripts/'])) {
        await fs.writeFile(path.join(scriptsDir, filename), content);
      }
    } else if (data.includeScripts) {
      await fs.mkdir(path.join(resolvedPath, 'scripts'), { recursive: true });
    }

    // Assets
    if (generated['assets/']) {
      const assetsDir = path.join(resolvedPath, 'assets');
      await fs.mkdir(assetsDir, { recursive: true });
      for (const [filename, content] of Object.entries(generated['assets/'])) {
        await fs.writeFile(path.join(assetsDir, filename), content);
      }
    } else if (data.includeAssets) {
      await fs.mkdir(path.join(resolvedPath, 'assets'), { recursive: true });
    }

    // 13. Save updated metadata
    const isCustom = 'isCustom' in templateConfig && templateConfig.isCustom === true;
    const updatedMetadata: SkillMetadata = {
      version: 1,
      generatorVersion: await getGeneratorVersion(),
      createdAt: metadata?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skillData: data as SkillData,
      templateType: data.type!,
      isCustomTemplate: isCustom,
      preset: metadata?.preset,
      contextPaths: contextPaths,
      installedAgents: metadata?.installedAgents,
    };
    await saveMetadata(resolvedPath, updatedMetadata);

    // Summary
    console.log(chalk.green('\nSkill updated successfully!\n'));
    console.log(chalk.white(`Location: ${chalk.cyan(resolvedPath)}\n`));

    // Check if name changed vs directory name
    const dirName = path.basename(resolvedPath);
    if (data.name && data.name !== dirName) {
      console.log(chalk.yellow(`Nota: El nombre del skill es '${data.name}' pero el directorio es '${dirName}'.`));
      console.log(chalk.gray(`  Para renombrar: mv ${resolvedPath} ${path.join(path.dirname(resolvedPath), data.name)}`));
      console.log();
    }

    // 14. Reinstall to agents
    if (options.reinstall) {
      console.log();
      const detected = await detectAgents();
      const installedAgents = detected.filter(a => a.installed);

      if (installedAgents.length === 0) {
        console.log(chalk.yellow('No AI agents detected.'));
      } else {
        let agentsToInstall: string[];

        if (options.reinstallAgent && options.reinstallAgent.length > 0) {
          agentsToInstall = options.reinstallAgent;
        } else if (options.nonInteractive) {
          agentsToInstall = updatedMetadata.installedAgents ?? installedAgents.map(a => a.id);
        } else {
          const agentList = installedAgents.map(a => a.name).join(', ');
          const installAll = await confirm({
            message: `Reinstall to all detected agents? (${agentList})`,
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
          console.log(chalk.gray('\nReinstalling to agents...\n'));
          const results = await installToAllAgents(resolvedPath, agentsToInstall, { force: true });
          console.log(formatInstallResults(results));

          // Update metadata with installed agents
          const successIds = results.filter(r => r.success).map((_, i) => agentsToInstall[i]);
          if (successIds.length > 0) {
            updatedMetadata.installedAgents = successIds;
            await saveMetadata(resolvedPath, updatedMetadata);
          }
          console.log();
        }
      }
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

// --- Helpers ---

async function parseFrontmatter(skillMdPath: string): Promise<{ name?: string; description?: string }> {
  try {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const parsed = yaml.load(match[1]) as Record<string, unknown>;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
    };
  } catch {
    return {};
  }
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function resolveDirectoryFlag(
  withFlag: boolean | undefined,
  withoutFlag: boolean | undefined,
  current: boolean | undefined
): boolean {
  if (withFlag) return true;
  if (withoutFlag) return false;
  return current ?? false;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
