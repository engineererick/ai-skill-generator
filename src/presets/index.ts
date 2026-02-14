export interface Preset {
  name: string;
  description: string;
  type: string;
  options: Record<string, unknown>;
}

// Built-in presets
export const builtInPresets: Record<string, Preset> = {
  'modern-react': {
    name: 'Modern React',
    description: 'Modern stack with shadcn and 2025 tooling',
    type: 'frontend',
    options: {
      uiLibrary: 'shadcn',
      stateManagement: 'zustand',
      forms: 'react-hook-form',
      dataFetching: 'tanstack-query',
      styling: 'tailwind',
      includeStorybook: true,
      includeTesting: 'vitest',
    },
  },
  'enterprise-api': {
    name: 'Enterprise API',
    description: 'Enterprise API with Clean Architecture',
    type: 'microservice',
    options: {
      database: 'typeorm-postgres',
      architecture: 'clean',
      communication: ['rest'],
      authentication: 'jwt-internal',
      documentation: 'swagger',
      testing: 'jest',
      includeDocker: true,
    },
  },
  'fullstack-next': {
    name: 'Full Stack Next.js',
    description: 'Full stack with Next.js',
    type: 'frontend',
    options: {
      uiLibrary: 'shadcn',
      stateManagement: 'zustand',
      forms: 'react-hook-form',
      dataFetching: 'tanstack-query',
      styling: 'tailwind',
      includeStorybook: false,
      includeTesting: 'vitest',
    },
  },
  'minimal-api': {
    name: 'Minimal API',
    description: 'Lightweight microservice with minimal infrastructure',
    type: 'microservice',
    options: {
      database: 'typeorm-postgres',
      architecture: 'modular',
      communication: ['rest'],
      authentication: 'none',
      documentation: 'swagger',
      testing: 'basic',
      includeDocker: false,
    },
  },
};

export function getPreset(name: string): Preset | undefined {
  return builtInPresets[name];
}

export function listPresets(): { name: string; value: string; description: string }[] {
  return Object.entries(builtInPresets).map(([key, preset]) => ({
    name: preset.name,
    value: key,
    description: preset.description,
  }));
}

// Load custom user presets
export async function loadCustomPresets(): Promise<Record<string, Preset>> {
  // Future: load from ~/.skill-generator/presets.json or similar
  return {};
}
