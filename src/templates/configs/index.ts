export { frontendConfig, type TemplateConfig, type TemplateQuestion } from './frontend-config.js';
export { microserviceConfig } from './microservice-config.js';
export { basicConfig } from './basic-config.js';
export { libraryConfig } from './library-config.js';

import { frontendConfig } from './frontend-config.js';
import { microserviceConfig } from './microservice-config.js';
import { basicConfig } from './basic-config.js';
import { libraryConfig } from './library-config.js';

export const templateConfigs = {
  frontend: frontendConfig,
  microservice: microserviceConfig,
  basic: basicConfig,
  library: libraryConfig,
};

export function getTemplateConfig(type: string) {
  return templateConfigs[type as keyof typeof templateConfigs];
}
