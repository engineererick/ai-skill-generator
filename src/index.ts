// Export modules for programmatic use

export { initCommand } from './commands/init.js';
export { updateCommand } from './commands/update.js';
export { validateCommand } from './commands/validate.js';
export { packageCommand } from './commands/package.js';
export { listTemplatesCommand } from './commands/list-templates.js';

export { generateSkillContent, getTemplateChoices } from './templates/index.js';
export { getTemplateConfig, resolveTemplateConfig } from './templates/configs/index.js';
export { validateSkill } from './validators/skill-validator.js';
export { loadContextFiles } from './context-loaders/index.js';
export { getPreset, listPresets } from './presets/index.js';
export { detectAgents, installToAllAgents, installToAgent } from './agents/index.js';
export { loadCustomTemplates, validateCustomTemplate, renderTemplate } from './custom-templates/index.js';
export { saveMetadata, loadMetadata, getGeneratorVersion } from './metadata/index.js';
export { detectProject } from './detection/index.js';
export { importCommand } from './commands/import.js';
export { scanForImportableFiles, identifyFormat, parseImportFile, buildSkillMd } from './import/index.js';

export type { SkillData, GeneratedSkill } from './templates/index.js';
export type { DetectionResult, DetectionEvidence } from './detection/types.js';
export type { ImportableFile, ImportResult } from './import/types.js';
export type { ValidationResult } from './validators/skill-validator.js';
export type { ContextFile, LoadedContext } from './context-loaders/index.js';
export type { Preset } from './presets/index.js';
export type { TemplateConfig, TemplateQuestion } from './templates/configs/frontend-config.js';
export type { CustomTemplateConfig, CustomTemplateValidationResult } from './custom-templates/types.js';
export type { SkillMetadata } from './metadata/types.js';
