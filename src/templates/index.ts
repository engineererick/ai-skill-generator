import type { TemplateConfig } from './configs/frontend-config.js';
import { getTemplateConfig } from './configs/index.js';
import type { ContextFile } from '../context-loaders/index.js';

export interface SkillData {
  name: string;
  type: 'microservice' | 'frontend' | 'library' | 'basic';
  description: string;
  includeReferences: boolean;
  includeScripts: boolean;
  includeAssets: boolean;
  // Dynamic fields per template
  [key: string]: unknown;
}

export interface GeneratedSkill {
  'SKILL.md': string;
  'references/'?: Record<string, string>;
  'scripts/'?: Record<string, string>;
  'assets/'?: Record<string, string>;
}

export function generateSkillContent(
  data: SkillData,
  config: TemplateConfig,
  contextFiles?: ContextFile[]
): GeneratedSkill {
  // Process dynamic variables
  const variables: Record<string, string> = {};
  for (const [key, fn] of Object.entries(config.variables)) {
    try {
      const value = fn(data);
      variables[key] = value !== undefined && value !== null ? value : '';
    } catch {
      variables[key] = '';
    }
  }

  // Generate SKILL.md by type
  let skillMd: string;
  switch (data.type) {
    case 'frontend':
      skillMd = generateFrontendSkillMd(data, variables, contextFiles);
      break;
    case 'microservice':
      skillMd = generateMicroserviceSkillMd(data, variables, contextFiles);
      break;
    case 'library':
      skillMd = generateLibrarySkillMd(data, variables, contextFiles);
      break;
    default:
      skillMd = generateBasicSkillMd(data, variables, contextFiles);
  }

  const result: GeneratedSkill = {
    'SKILL.md': skillMd,
  };

  // Generate additional files if requested
  if (data.includeReferences) {
    result['references/'] = generateReferences(data, variables, contextFiles);
  }

  if (data.includeScripts) {
    result['scripts/'] = generateScripts(data, variables);
  }

  if (data.includeAssets) {
    result['assets/'] = generateAssets(data);
  }

  return result;
}

function generateFrontendSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const {
    uiLibrary = 'shadcn',
    stateManagement = 'zustand',
    forms = 'react-hook-form',
    dataFetching = 'tanstack-query',
    styling = 'tailwind',
    includeStorybook = false,
    includeTesting = 'vitest',
  } = data;

  const installCommands = variables.installCommand || '';

  const fullDescription = `${data.description} Stack: ${variables.stackSummary || 'Next.js + React'}. Use when developing frontend functionality.`;

  return `---
name: ${data.name}
description: |
  ${fullDescription}
---

# ${toTitleCase(data.name)}

${data.description}

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| UI Library | ${uiLibrary} |
| State | ${stateManagement} |
| Forms | ${forms} |
| Data Fetching | ${dataFetching} |
| Styling | ${styling} |
${includeStorybook ? '| Storybook | Component documentation |' : ''}
${includeTesting !== 'none' ? `| Testing | ${includeTesting} |` : ''}

## Installation

\`\`\`bash
# Install dependencies
${installCommands}
\`\`\`

## Structure

\`\`\`
src/
  app/               # App Router (Next.js 15)
  components/        # React components
  hooks/             # Custom hooks
  lib/               # Utilities and configuration
  services/          # API clients
  stores/            # ${stateManagement} stores
  types/             # TypeScript types
\`\`\`

## Conventions

### Components

\`\`\`typescript
'use client'  // Only if using state or effects

interface Props {
  // Define props explicitly
}

export function ComponentName({ ...props }: Props) {
  return (/* JSX */);
}
\`\`\`

### Data Fetching

\`\`\`typescript
// Server Component (default)
const data = await fetchData();

// Client Component
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData
});
\`\`\`

## Resources

${data.includeReferences ? '- See [references/](references/) for extended documentation' : ''}
${data.includeScripts ? '- See [scripts/](scripts/) for utilities' : ''}
${data.includeAssets ? '- See [assets/](assets/) for resources' : ''}

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**See in:** \`${data.name}/src/\`
`;
}

function generateMicroserviceSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const {
    database = 'typeorm-sqlserver',
    architecture = 'clean',
    communication = ['rest'],
    authentication = 'auth-ms',
    documentation = 'swagger',
    testing = 'jest',
    includeDocker = true,
  } = data;

  const dbConnection = variables.dbConnection || '';
  const archDescription = variables.architectureDescription || '';

  const comms = Array.isArray(communication) ? communication : [communication];

  return `---
name: ${data.name}
description: |
  ${data.description} ${archDescription} Use when developing functionality for this microservice.
---

# ${toTitleCase(data.name)}

${data.description}

## Architecture

${archDescription}

## Technologies

- **NestJS 11**
- **Database**: ${database}
- **Communication**: ${comms.join(', ')}
- **Authentication**: ${authentication}
${documentation !== 'none' ? `- **Documentation**: ${documentation}` : ''}
${testing !== 'none' ? `- **Testing**: ${testing}` : ''}

## Structure

\`\`\`
src/
${architecture === 'clean' ? `  presentation/      # Controllers, DTOs, Guards
  application/       # Use Cases, Services
  domain/            # Entities, Repository interfaces
  infrastructure/    # Repositories, External services` : architecture === 'hexagonal' ? `  domain/            # Entities, Ports
  application/       # Use Cases
  infrastructure/    # Adapters, Repositories
  interface/         # Controllers, DTOs` : `  modules/           # Feature modules
  common/            # Shared utilities`}
\`\`\`

## Environment Configuration

\`\`\`bash
# Database
DATABASE_URL=${dbConnection}

${authentication === 'auth-ms' ? `# Auth MS
AUTH_MS_URL=http://fincea-auth-ms:3000` : ''}
${comms.includes('redis') ? `# Redis
REDIS_URL=redis://localhost:6379` : ''}
\`\`\`

## Main Endpoints

\`\`\`
GET    /health              # Health check
${comms.includes('rest') ? `POST   /${data.name.replace(/-/g, '/')}/         # Create
GET    /${data.name.replace(/-/g, '/')}/         # List
GET    /${data.name.replace(/-/g, '/')}/:id      # Get
PUT    /${data.name.replace(/-/g, '/')}/:id      # Update
DELETE /${data.name.replace(/-/g, '/')}/:id      # Delete` : ''}
\`\`\`

${documentation === 'swagger' ? `## API Documentation

Swagger available at: \`http://localhost:3000/api\`` : ''}

${includeDocker ? `## Docker

\`\`\`bash
docker build -t ${data.name} .
docker run -p 3000:3000 ${data.name}
\`\`\`` : ''}

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**See in:** \`${data.name}/src/\`
`;
}

function generateLibrarySkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const packageName = data.name.replace('fincea-', '');

  const fullDescription = `${data.description} Shared library without framework dependencies.`;

  return `---
name: ${data.name}
description: |
  ${fullDescription}
---

# ${toTitleCase(data.name)}

${data.description}

## Installation

\`\`\`bash
npm install @fincea/${packageName}
# or
yarn add @fincea/${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { exampleFunction } from '@fincea/${packageName}';

const result = exampleFunction();
\`\`\`

## API

| Function | Description | Parameters |
|----------|-------------|------------|
| exampleFunction | Example function | - |

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**See in:** \`${data.name}/src/\`
`;
}

function generateBasicSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  return `---
name: ${data.name}
description: |
  ${data.description}
---

# ${toTitleCase(data.name)}

## Overview

${data.description}

## Usage

[Add usage instructions here]

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**Generated with:** Skill Generator v1.0.0
`;
}

function generateReferences(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): Record<string, string> {
  const refs: Record<string, string> = {};

  if (data.type === 'frontend') {
    refs['COMPONENTS.md'] = generateComponentsReference(data);
    refs['STYLING.md'] = generateStylingReference(data);
  }

  if (data.type === 'microservice') {
    refs['API.md'] = generateApiReference(data);
    refs['ARCHITECTURE.md'] = generateArchitectureReference(data, variables);
  }

  // Add loaded context as file
  if (contextFiles && contextFiles.length > 0) {
    refs['CONTEXT.md'] = contextFiles
      .map(f => `# ${f.filename}\n\n${f.content}`)
      .join('\n\n---\n\n');
  }

  return refs;
}

function generateScripts(
  data: SkillData,
  variables: Record<string, string>
): Record<string, string> {
  const scripts: Record<string, string> = {};

  if (data.type === 'microservice') {
    scripts['seed.ts'] = `#!/usr/bin/env tsx
/**
 * Script to seed test data
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function seed() {
  const app = await NestFactory.create(AppModule);
  // Add seed logic
  await app.close();
}

seed();
`;
  }

  scripts['example.ts'] = `#!/usr/bin/env tsx
/**
 * Example script for ${data.name}
 */

function main() {
  console.log('Hello from ${data.name}!');
}

main();
`;

  return scripts;
}

function generateAssets(data: SkillData): Record<string, string> {
  return {
    '.gitkeep': '',
  };
}

// Reference generators
function generateComponentsReference(data: SkillData): string {
  const { uiLibrary = 'shadcn' } = data;

  const uiGuides: Record<string, string> = {
    shadcn: `# Components - shadcn/ui

## Installation
\`\`\`bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
\`\`\`

## Usage
\`\`\`tsx
import { Button } from "@/components/ui/button"

export function Example() {
  return <Button>Click me</Button>
}
\`\`\``,
    mui: `# Components - Material UI

## Installation
\`\`\`bash
npm install @mui/material @emotion/react @emotion/styled
\`\`\`

## Usage
\`\`\`tsx
import Button from '@mui/material/Button';

export function Example() {
  return <Button variant="contained">Click me</Button>;
}
\`\`\``,
    chakra: `# Components - Chakra UI

## Installation
\`\`\`bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
\`\`\`

## Usage
\`\`\`tsx
import { Button } from '@chakra-ui/react'

export function Example() {
  return <Button colorScheme="blue">Click me</Button>
}
\`\`\``,
    headless: `# Components - Headless UI

## Installation
\`\`\`bash
npm install @headlessui/react
\`\`\`

## Usage
\`\`\`tsx
import { Button } from '@headlessui/react'

export function Example() {
  return <Button className="bg-blue-500">Click me</Button>
}
\`\`\``,
  };

  return uiGuides[uiLibrary as string] || uiGuides.shadcn;
}

function generateStylingReference(data: SkillData): string {
  const { styling = 'tailwind' } = data;

  if (styling === 'tailwind') {
    return `# Styling - Tailwind CSS

## Project Colors

\`\`\`javascript
// tailwind.config.js
colors: {
  primary: '#FFDE59',
  secondary: '#0F0F0F',
  background: '#FFFEFC',
}
\`\`\`

## Common Classes

- Layout: \`flex\`, \`grid\`, \`container\`, \`mx-auto\`
- Spacing: \`p-4\`, \`m-2\`, \`gap-4\`
- Typography: \`text-lg\`, \`font-bold\`, \`text-gray-700\`
`;
  }

  return `# Styling - ${styling}

[Add specific styling guide]
`;
}

function generateApiReference(data: SkillData): string {
  return `# API Reference

## Endpoints

### GET /${data.name.replace(/-/g, '/')}

List resources.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Current page |
| limit | number | Items per page |

**Response:**
\`\`\`json
{
  "data": [],
  "meta": {
    "page": 1,
    "total": 100
  }
}
\`\`\`

---

*Auto-generated by FSG*
`;
}

function generateArchitectureReference(
  data: SkillData,
  variables: Record<string, string>
): string {
  const { architecture = 'clean' } = data;

  const guides: Record<string, string> = {
    clean: `# Clean Architecture

## Layers

1. **Domain**: Pure entities and business rules
2. **Application**: Use cases and application logic
3. **Infrastructure**: Concrete implementations (DB, APIs)
4. **Presentation**: Controllers and DTOs

## Dependency Flow

Domain ← Application ← Infrastructure
Domain ← Application ← Presentation
`,
    hexagonal: `# Hexagonal Architecture

## Ports (Interfaces)
- Define contracts for interacting with the domain

## Adapters (Implementations)
- Adapt external technologies to ports

## Flow
Input Adapter → Port → Domain → Port → Output Adapter
`,
    modular: `# Modular Architecture

## Modules
Each feature is an independent NestJS module.

## Shared Module
Shared utilities across modules.
`,
  };

  return guides[architecture as string] || guides.clean;
}

function generateContextSection(contextFiles: ContextFile[]): string {
  return `## Additional Context

The following context resources have been included:

${contextFiles.map(f => `- \`${f.filename}\``).join('\n')}

See [references/CONTEXT.md](references/CONTEXT.md) for the full content.
`;
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getTemplateChoices(): { name: string; value: string; description: string }[] {
  return [
    { name: 'Basic', value: 'basic', description: 'Minimal skill with only SKILL.md' },
    { name: 'NestJS Microservice', value: 'microservice', description: 'Microservice with configurable architecture' },
    { name: 'Frontend Next.js', value: 'frontend', description: 'Application with configurable UI and state' },
    { name: 'Shared Library', value: 'library', description: 'Utility library without framework dependencies' },
  ];
}

export { getTemplateConfig };
export type { TemplateConfig };
