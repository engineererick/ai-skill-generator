// Export modules for programmatic use

export { initCommand } from './commands/init.js';
export { validateCommand } from './commands/validate.js';
export { packageCommand } from './commands/package.js';
export { listTemplatesCommand } from './commands/list-templates.js';

export { generateSkillContent, getTemplateChoices, getTemplateConfig } from './templates/index.js';
export { validateSkill } from './validators/skill-validator.js';
export { loadContextFiles } from './context-loaders/index.js';
export { getPreset, listPresets } from './presets/index.js';
export { detectAgents, installToAllAgents, installToAgent } from './agents/index.js';

export type { SkillData, GeneratedSkill } from './templates/index.js';
export type { ValidationResult } from './validators/skill-validator.js';
export type { ContextFile, LoadedContext } from './context-loaders/index.js';
export type { Preset } from './presets/index.js';
export type { TemplateConfig, TemplateQuestion } from './templates/configs/frontend-config.js';
