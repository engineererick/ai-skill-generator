import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import yaml from 'js-yaml';
import type { CustomTemplateConfig, CustomTemplateYaml } from './types.js';
import { validateCustomTemplate } from './validator.js';

const GLOBAL_DIR = path.join(os.homedir(), '.skill-generator', 'templates');
const PROJECT_DIR = path.join(process.cwd(), '.skill-generator', 'templates');

export async function loadCustomTemplates(): Promise<{
  templates: CustomTemplateConfig[];
  errors: string[];
}> {
  const allTemplates: CustomTemplateConfig[] = [];
  const allErrors: string[] = [];

  // Load global templates first
  const global = await loadCustomTemplatesFromDir(GLOBAL_DIR, 'global');
  allTemplates.push(...global.templates);
  allErrors.push(...global.errors);

  // Load project templates (shadow global ones with same id)
  const project = await loadCustomTemplatesFromDir(PROJECT_DIR, 'project');
  for (const pt of project.templates) {
    const existingIdx = allTemplates.findIndex(t => t.id === pt.id);
    if (existingIdx >= 0) {
      allTemplates[existingIdx] = pt;
    } else {
      allTemplates.push(pt);
    }
  }
  allErrors.push(...project.errors);

  return { templates: allTemplates, errors: allErrors };
}

export async function loadCustomTemplatesFromDir(
  dirPath: string,
  _scope?: string
): Promise<{ templates: CustomTemplateConfig[]; errors: string[] }> {
  const templates: CustomTemplateConfig[] = [];
  const errors: string[] = [];

  // Check if directory exists
  try {
    await fs.access(dirPath);
  } catch {
    return { templates, errors };
  }

  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    return { templates, errors };
  }

  const yamlFiles = entries.filter(f => /\.(ya?ml)$/i.test(f));

  for (const filename of yamlFiles) {
    const filePath = path.join(dirPath, filename);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.load(content);

      // Validate
      const validation = validateCustomTemplate(parsed, filePath);
      if (!validation.valid) {
        errors.push(`${filename}: ${validation.errors.join('; ')}`);
        continue;
      }

      const raw = parsed as CustomTemplateYaml;
      const id = filename.replace(/\.(ya?ml)$/i, '');

      const config: CustomTemplateConfig = {
        id,
        name: raw.name,
        description: raw.description,
        version: raw.version,
        author: raw.author,
        sourcePath: filePath,
        isCustom: true,
        questions: raw.questions ?? [],
        variables: raw.variables ?? {},
        content: raw.content,
      };

      // Try to load companion JS file
      const jsVariables = await loadCompanionJs(dirPath, id);
      if (jsVariables) {
        config.jsVariables = jsVariables;
      }

      templates.push(config);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${filename}: ${msg}`);
    }
  }

  return { templates, errors };
}

async function loadCompanionJs(
  dirPath: string,
  id: string
): Promise<Record<string, (answers: Record<string, unknown>) => string> | undefined> {
  // Try .js then .mjs
  for (const ext of ['.js', '.mjs']) {
    const jsPath = path.join(dirPath, `${id}${ext}`);
    try {
      await fs.access(jsPath);
      const fileUrl = pathToFileURL(jsPath).href;
      const mod = await import(fileUrl);
      if (mod.variables && typeof mod.variables === 'object') {
        return mod.variables as Record<string, (answers: Record<string, unknown>) => string>;
      }
    } catch {
      // File doesn't exist or can't be loaded, skip
    }
  }
  return undefined;
}
