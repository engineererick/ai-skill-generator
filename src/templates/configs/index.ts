export { frontendConfig, type TemplateConfig, type TemplateQuestion } from './frontend-config.js';
export { microserviceConfig } from './microservice-config.js';
export { basicConfig } from './basic-config.js';
export { libraryConfig } from './library-config.js';
export { apiConfig } from './api-config.js';
export { fullstackConfig } from './fullstack-config.js';
export { devopsConfig } from './devops-config.js';

import type { TemplateConfig } from './frontend-config.js';
import { frontendConfig } from './frontend-config.js';
import { microserviceConfig } from './microservice-config.js';
import { basicConfig } from './basic-config.js';
import { libraryConfig } from './library-config.js';
import { apiConfig } from './api-config.js';
import { fullstackConfig } from './fullstack-config.js';
import { devopsConfig } from './devops-config.js';
import type { CustomTemplateConfig } from '../../custom-templates/types.js';
import { loadCustomTemplates } from '../../custom-templates/loader.js';

export const templateConfigs = {
  frontend: frontendConfig,
  microservice: microserviceConfig,
  basic: basicConfig,
  library: libraryConfig,
  api: apiConfig,
  fullstack: fullstackConfig,
  devops: devopsConfig,
};

export function getTemplateConfig(type: string) {
  return templateConfigs[type as keyof typeof templateConfigs];
}

export async function resolveTemplateConfig(
  type: string
): Promise<TemplateConfig | CustomTemplateConfig | undefined> {
  // Check built-ins first (fast path)
  const builtin = templateConfigs[type as keyof typeof templateConfigs];
  if (builtin) return builtin;

  // Load custom templates
  const { templates } = await loadCustomTemplates();
  return templates.find(t => t.id === type);
}
