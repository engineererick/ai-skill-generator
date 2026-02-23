import { confirm, checkbox } from '@inquirer/prompts';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { scanForImportableFiles, identifyFormat, parseImportFile, buildSkillMd } from '../import/index.js';
import type { ImportableFile } from '../import/types.js';
import { saveMetadata, getGeneratorVersion } from '../metadata/index.js';
import type { SkillMetadata } from '../metadata/types.js';
import { detectAgents, installToAllAgents, formatInstallResults } from '../agents/index.js';
import { validateSkill } from '../validators/skill-validator.js';
import { printFileTree, previewAndConfirm } from './shared.js';
import type { SkillData, GeneratedSkill } from '../templates/index.js';

interface ImportOptions {
  scan?: boolean;
  name?: string;
  desc?: string;
  output: string;
  install?: boolean;
  nonInteractive?: boolean;
  dryRun?: boolean;
}

export async function importCommand(file: string | undefined, options: ImportOptions) {
  try {
    console.log(chalk.cyan.bold('\n📥 Skill Import\n'));

    let filesToImport: { filePath: string; formatId: string; formatName: string }[] = [];

    if (options.scan) {
      // Scan mode: find known AI instruction files in cwd
      const cwd = process.cwd();
      const found = await scanForImportableFiles(cwd);

      if (found.length === 0) {
        console.log(chalk.yellow('No se encontraron archivos de instrucciones AI en el directorio actual.'));
        console.log(chalk.gray('\nFormatos soportados:'));
        console.log(chalk.gray('  .cursorrules, CLAUDE.md, .github/copilot-instructions.md,'));
        console.log(chalk.gray('  .windsurfrules, .goose/instructions.md, .gemini/instructions.md,'));
        console.log(chalk.gray('  codex.md, .amp/instructions.md'));
        return;
      }

      console.log(chalk.green(`Se encontraron ${found.length} archivo(s):\n`));
      for (const f of found) {
        console.log(chalk.gray(`  ${f.formatName}: ${f.relativePath}`));
      }
      console.log();

      if (options.nonInteractive) {
        // Import all found files
        filesToImport = found.map(f => ({
          filePath: f.filePath,
          formatId: f.formatId,
          formatName: f.formatName,
        }));
      } else {
        // Let user select which to import
        const selected = await checkbox({
          message: 'Seleccionar archivos a importar:',
          choices: found.map(f => ({
            name: `${f.formatName} (${f.relativePath})`,
            value: f,
            checked: true,
          })),
        });

        filesToImport = (selected as ImportableFile[]).map(f => ({
          filePath: f.filePath,
          formatId: f.formatId,
          formatName: f.formatName,
        }));
      }
    } else if (file) {
      // Single file mode
      const filePath = path.resolve(file);
      try {
        await fs.access(filePath);
      } catch {
        console.error(chalk.red(`Archivo no encontrado: ${filePath}`));
        process.exit(1);
      }

      const formatId = identifyFormat(filePath);
      filesToImport = [{ filePath, formatId, formatName: formatId }];
    } else {
      console.error(chalk.red('Debes especificar un archivo o usar --scan'));
      console.log(chalk.gray('\nUso:'));
      console.log(chalk.gray('  skill-gen import <archivo>     Importar un archivo especifico'));
      console.log(chalk.gray('  skill-gen import --scan        Buscar archivos en el directorio actual'));
      process.exit(1);
    }

    if (filesToImport.length === 0) {
      console.log(chalk.yellow('No se seleccionaron archivos para importar.'));
      return;
    }

    // Process each file
    for (const fileInfo of filesToImport) {
      await importSingleFile(fileInfo.filePath, fileInfo.formatId, options);
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\nCancelado por el usuario'));
      process.exit(0);
    }
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function importSingleFile(
  filePath: string,
  formatId: string,
  options: ImportOptions
): Promise<void> {
  // Parse the file
  const parsed = await parseImportFile(filePath, formatId);

  // Apply overrides from CLI flags
  const skillName = options.name || parsed.name;
  const skillDesc = options.desc || parsed.description;

  // Build SKILL.md content
  const skillMd = buildSkillMd(skillName, skillDesc, parsed.content);

  // Create a generated skill structure (just SKILL.md)
  const generated: GeneratedSkill = {
    'SKILL.md': skillMd,
  };

  const outputDir = path.resolve(options.output, skillName);

  // Build SkillData for metadata
  const data: Partial<SkillData> = {
    name: skillName,
    type: 'basic',
    description: skillDesc,
    includeReferences: false,
    includeScripts: false,
    includeAssets: false,
  };

  // DRY RUN MODE
  if (options.dryRun) {
    console.log(chalk.cyan(`\nPreview (dry run) - ${path.basename(filePath)}:\n`));
    printFileTree(skillName, generated, data);
    console.log(chalk.yellow('\nNo se escribieron archivos (dry-run mode)\n'));
    return;
  }

  // INTERACTIVE PREVIEW
  if (!options.nonInteractive) {
    console.log(chalk.gray(`\nImportando: ${filePath}`));
    const proceed = await previewAndConfirm(skillName, generated, data, 'Importar skill?');
    if (!proceed) {
      console.log(chalk.yellow('\nCancelado. No se escribieron archivos.\n'));
      return;
    }
  }

  // Check if already exists
  try {
    await fs.access(outputDir);
    console.error(chalk.red(`\nEl directorio ya existe: ${outputDir}`));
    if (options.nonInteractive) {
      process.exit(1);
    }
    const overwrite = await confirm({
      message: 'Sobrescribir?',
      default: false,
    });
    if (!overwrite) return;
    await fs.rm(outputDir, { recursive: true });
  } catch {
    // Does not exist, continue
  }

  // Write files
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'SKILL.md'), skillMd);

  // Save metadata
  const metadata: SkillMetadata = {
    version: 1,
    generatorVersion: await getGeneratorVersion(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    skillData: data as SkillData,
    templateType: 'basic',
    isCustomTemplate: false,
    source: 'imported',
    importSourceFormat: formatId,
    importSourceFile: filePath,
  };
  await saveMetadata(outputDir, metadata);

  // Validate
  const validation = await validateSkill(outputDir);
  if (!validation.valid) {
    console.log(chalk.yellow('\n⚠ La skill importada tiene problemas de validacion:'));
    for (const err of validation.errors) {
      console.log(chalk.red(`  ${err}`));
    }
  }

  console.log(chalk.green(`\nSkill importada: ${chalk.cyan(outputDir)}\n`));

  // Install to agents if requested
  if (options.install) {
    const detected = await detectAgents();
    const installedAgents = detected.filter(a => a.installed);

    if (installedAgents.length > 0) {
      const agentIds = installedAgents.map(a => a.id);
      console.log(chalk.gray('Instalando en agentes...\n'));
      const results = await installToAllAgents(outputDir, agentIds);
      console.log(formatInstallResults(results));

      const successfulAgents = results.filter(r => r.success).map(r => r.agent);
      if (successfulAgents.length > 0) {
        metadata.installedAgents = agentIds.filter((_, i) => results[i]?.success);
        await saveMetadata(outputDir, metadata);
      }
    }
  }
}
