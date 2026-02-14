import type { TemplateConfig } from './configs/frontend-config.js';
import { getTemplateConfig } from './configs/index.js';
import type { ContextFile } from '../context-loaders/index.js';
import type { CustomTemplateConfig } from '../custom-templates/types.js';
import { renderTemplate, interpolateSimple } from '../custom-templates/renderer.js';
import { loadCustomTemplates } from '../custom-templates/loader.js';

export interface SkillData {
  name: string;
  type: string;
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
  config: TemplateConfig | CustomTemplateConfig,
  contextFiles?: ContextFile[]
): GeneratedSkill {
  // Custom template path
  if ('isCustom' in config && config.isCustom) {
    return generateCustomSkillContent(data, config as CustomTemplateConfig, contextFiles);
  }

  // Built-in template path
  const builtinConfig = config as TemplateConfig;

  // Process dynamic variables
  const variables: Record<string, string> = {};
  for (const [key, fn] of Object.entries(builtinConfig.variables)) {
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
    case 'api':
      skillMd = generateApiSkillMd(data, variables, contextFiles);
      break;
    case 'fullstack':
      skillMd = generateFullstackSkillMd(data, variables, contextFiles);
      break;
    case 'devops':
      skillMd = generateDevopsSkillMd(data, variables, contextFiles);
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

function generateCustomSkillContent(
  data: SkillData,
  config: CustomTemplateConfig,
  contextFiles?: ContextFile[]
): GeneratedSkill {
  // Build context from answers
  const context: Record<string, string> = {};

  // Auto-helpers
  context['titleCase'] = toTitleCase(data.name);
  context['kebabName'] = data.name;

  // All answers (coerce to string)
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'boolean') context[k] = String(v);
    else if (Array.isArray(v)) context[k] = v.join(', ');
    else if (v !== null && v !== undefined) context[k] = String(v);
  }

  // Simple variable interpolations from YAML
  for (const [k, expr] of Object.entries(config.variables)) {
    context[k] = interpolateSimple(expr, context);
  }

  // JS variable generators (override/extend)
  if (config.jsVariables) {
    for (const [k, fn] of Object.entries(config.jsVariables)) {
      try {
        context[k] = fn(data) ?? '';
      } catch {
        context[k] = '';
      }
    }
  }

  // Render SKILL.md
  let skillMd = renderTemplate(config.content['SKILL.md'], context);

  // Append context section if contextFiles present
  if (contextFiles && contextFiles.length > 0) {
    skillMd += '\n' + generateContextSection(contextFiles) + '\n';
  }

  const result: GeneratedSkill = {
    'SKILL.md': skillMd,
  };

  // Render custom references
  if (config.content['references/']) {
    const refs: Record<string, string> = {};
    for (const [filename, template] of Object.entries(config.content['references/'])) {
      refs[filename] = renderTemplate(template, context);
    }
    if (contextFiles && contextFiles.length > 0) {
      refs['CONTEXT.md'] = contextFiles
        .map(f => `# ${f.filename}\n\n${f.content}`)
        .join('\n\n---\n\n');
    }
    result['references/'] = refs;
  } else if (data.includeReferences) {
    const refs: Record<string, string> = {};
    if (contextFiles && contextFiles.length > 0) {
      refs['CONTEXT.md'] = contextFiles
        .map(f => `# ${f.filename}\n\n${f.content}`)
        .join('\n\n---\n\n');
    }
    if (Object.keys(refs).length > 0) {
      result['references/'] = refs;
    }
  }

  // Render custom scripts
  if (config.content['scripts/']) {
    const scripts: Record<string, string> = {};
    for (const [filename, template] of Object.entries(config.content['scripts/'])) {
      scripts[filename] = renderTemplate(template, context);
    }
    result['scripts/'] = scripts;
  }

  // Render custom assets
  if (config.content['assets/']) {
    const assets: Record<string, string> = {};
    for (const [filename, template] of Object.entries(config.content['assets/'])) {
      assets[filename] = renderTemplate(template, context);
    }
    result['assets/'] = assets;
  } else if (data.includeAssets) {
    result['assets/'] = { '.gitkeep': '' };
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

function generateApiSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const {
    framework = 'express',
    database = 'postgres',
    orm = 'prisma',
    auth = 'jwt',
    validation = 'zod',
    documentation = 'swagger',
    testing = 'vitest',
  } = data;

  const installCommands = variables.installCommand || '';
  const dbConnection = variables.dbConnection || '';

  return `---
name: ${data.name}
description: |
  ${data.description} REST API with ${framework}${database !== 'none' ? ` and ${database}` : ''}.
---

# ${toTitleCase(data.name)}

${data.description}

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | ${framework} |
${database !== 'none' ? `| Database | ${database} |` : ''}
${database !== 'none' && orm !== 'none' ? `| ORM | ${orm} |` : ''}
${auth !== 'none' ? `| Auth | ${auth} |` : ''}
${validation !== 'none' ? `| Validation | ${validation} |` : ''}
${documentation !== 'none' ? `| Docs | ${documentation} |` : ''}
${testing !== 'none' ? `| Testing | ${testing} |` : ''}

## Installation

\`\`\`bash
${installCommands}
\`\`\`

## Structure

\`\`\`
src/
  routes/            # Route definitions
  controllers/       # Request handlers
  middleware/         # Auth, validation, error handling
${database !== 'none' ? `  models/            # Database models / schemas` : ''}
${validation !== 'none' ? `  validators/        # Request validation schemas` : ''}
  services/          # Business logic
  config/            # App configuration
  utils/             # Shared utilities
\`\`\`

## Main Endpoints

\`\`\`
GET    /health                  # Health check
POST   /api/${data.name}/       # Create resource
GET    /api/${data.name}/       # List resources
GET    /api/${data.name}/:id    # Get resource
PUT    /api/${data.name}/:id    # Update resource
DELETE /api/${data.name}/:id    # Delete resource
\`\`\`

## Middleware Chain

1. **CORS** — Cross-origin resource sharing
2. **Helmet** — Security headers
${auth !== 'none' ? `3. **Auth** — ${variables.authMiddleware || auth}` : ''}
${validation !== 'none' ? `${auth !== 'none' ? '4' : '3'}. **Validation** — Request schema validation with ${validation}` : ''}
${auth !== 'none' && validation !== 'none' ? '5' : auth !== 'none' || validation !== 'none' ? '4' : '3'}. **Error Handler** — Centralized error responses

${database !== 'none' ? `## Environment Variables

\`\`\`bash
PORT=3000
NODE_ENV=development
DATABASE_URL=${dbConnection}
${auth === 'jwt' ? 'JWT_SECRET=your-secret-key\nJWT_EXPIRES_IN=7d' : ''}
\`\`\`` : ''}

${documentation === 'swagger' ? `## API Documentation

Swagger UI available at: \`http://localhost:3000/api-docs\`
` : ''}
## Error Response Format

\`\`\`json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
\`\`\`

${data.includeReferences ? '- See [references/](references/) for endpoint details' : ''}
${data.includeScripts ? '- See [scripts/](scripts/) for utilities' : ''}

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**See in:** \`${data.name}/src/\`
`;
}

function generateFullstackSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const {
    framework = 'nextjs',
    database = 'postgres',
    orm = 'prisma',
    auth = 'authjs',
    styling = 'tailwind',
    stateManagement = 'zustand',
    testing = 'vitest-playwright',
  } = data;

  const installCommands = variables.installCommand || '';
  const ormSetup = variables.ormSetup || '';

  const frameworkLabels: Record<string, string> = {
    nextjs: 'Next.js',
    nuxt: 'Nuxt',
    remix: 'Remix',
    sveltekit: 'SvelteKit',
  };

  return `---
name: ${data.name}
description: |
  ${data.description} Full-stack with ${frameworkLabels[framework as string] || framework}, ${orm}, and ${database}.
---

# ${toTitleCase(data.name)}

${data.description}

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | ${frameworkLabels[framework as string] || framework} |
| Database | ${database} |
| ORM | ${orm} |
${auth !== 'none' ? `| Auth | ${auth} |` : ''}
| Styling | ${styling} |
${stateManagement !== 'none' ? `| State | ${stateManagement} |` : ''}
${testing !== 'none' ? `| Testing | ${testing} |` : ''}

## Installation

\`\`\`bash
${installCommands}
\`\`\`

## Database Setup

\`\`\`bash
${ormSetup}
\`\`\`

## Structure

\`\`\`
${framework === 'nextjs' ? `app/
  (auth)/            # Auth pages (login, register)
  (dashboard)/       # Protected pages
  api/               # API routes
  layout.tsx         # Root layout
components/
  ui/                # Reusable UI components
  forms/             # Form components
hooks/               # Custom hooks
lib/
  db.ts              # Database client
  auth.ts            # Auth configuration
  utils.ts           # Shared utilities
${orm === 'prisma' ? `prisma/
  schema.prisma      # Database schema
  migrations/        # Database migrations` : `models/              # Database models`}
${stateManagement !== 'none' ? `stores/              # ${stateManagement} stores` : ''}` : framework === 'nuxt' ? `pages/               # Auto-routed pages
components/          # Vue components
composables/         # Composables (hooks)
server/
  api/               # API routes
  middleware/        # Server middleware
${orm === 'prisma' ? `prisma/
  schema.prisma      # Database schema` : `models/              # Database models`}
${stateManagement === 'pinia' ? `stores/              # Pinia stores` : ''}` : `app/
  routes/            # Route modules
  components/        # UI components
lib/
  db.ts              # Database client
${orm === 'prisma' ? `prisma/
  schema.prisma      # Database schema` : `models/              # Database models`}`}
\`\`\`

## API Routes

\`\`\`typescript
// ${framework === 'nextjs' ? 'app/api/example/route.ts' : framework === 'nuxt' ? 'server/api/example.ts' : 'app/routes/api.example.ts'}
${framework === 'nextjs' ? `export async function GET(request: Request) {
  const data = await db.example.findMany();
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await db.example.create({ data: body });
  return Response.json(created, { status: 201 });
}` : framework === 'nuxt' ? `export default defineEventHandler(async (event) => {
  const data = await db.example.findMany();
  return data;
});` : `export async function loader() {
  const data = await db.example.findMany();
  return json(data);
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  // Handle form submission
}`}
\`\`\`

${auth !== 'none' ? `## Authentication

Provider: **${auth}**

Protected routes use middleware/guards to verify user session.
Authentication state is available via server-side session checks and client-side hooks.
` : ''}

${data.includeReferences ? '- See [references/](references/) for database and auth details' : ''}
${data.includeScripts ? '- See [scripts/](scripts/) for utilities' : ''}

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**See in:** \`${data.name}/\`
`;
}

function generateDevopsSkillMd(
  data: SkillData,
  variables: Record<string, string>,
  contextFiles?: ContextFile[]
): string {
  const {
    containerization = 'docker',
    orchestration = 'docker-compose',
    cicd = 'github-actions',
    cloud = 'aws',
    iac = 'terraform',
    monitoring = 'prometheus-grafana',
  } = data;

  const installCommands = variables.installCommand || '';
  const cloudLabel = variables.cloudProvider || 'Not specified';
  const deployment = variables.deploymentStrategy || '';

  return `---
name: ${data.name}
description: |
  ${data.description} Infrastructure and deployment configuration.
---

# ${toTitleCase(data.name)}

${data.description}

## Infrastructure Overview

| Category | Technology |
|----------|------------|
${containerization !== 'none' ? `| Containers | ${containerization} |` : ''}
${orchestration !== 'none' ? `| Orchestration | ${orchestration} |` : ''}
${cicd !== 'none' ? `| CI/CD | ${cicd} |` : ''}
${cloud !== 'none' ? `| Cloud | ${cloudLabel} |` : ''}
${cloud !== 'none' && iac !== 'none' ? `| IaC | ${iac} |` : ''}
${monitoring !== 'none' ? `| Monitoring | ${monitoring} |` : ''}

## Prerequisites

\`\`\`bash
${installCommands}
\`\`\`

## Structure

\`\`\`
${containerization !== 'none' ? `${containerization === 'docker' ? 'Dockerfile' : 'Containerfile'}           # Container image definition
${orchestration === 'docker-compose' ? 'docker-compose.yml     # Multi-container setup' : ''}` : ''}
${orchestration === 'kubernetes' ? `k8s/
  deployment.yaml      # Kubernetes deployment
  service.yaml         # Kubernetes service
  configmap.yaml       # Configuration
  ingress.yaml         # Ingress rules` : ''}
${cicd === 'github-actions' ? `.github/
  workflows/
    ci.yml             # CI pipeline (lint, test, build)
    cd.yml             # CD pipeline (deploy)` : cicd === 'gitlab-ci' ? `.gitlab-ci.yml           # CI/CD pipeline` : cicd === 'jenkins' ? `Jenkinsfile              # CI/CD pipeline` : ''}
${cloud !== 'none' && iac === 'terraform' ? `terraform/
  main.tf              # Main infrastructure
  variables.tf         # Input variables
  outputs.tf           # Output values
  environments/
    dev.tfvars         # Dev environment
    prod.tfvars        # Prod environment` : cloud !== 'none' && iac === 'pulumi' ? `infra/
  index.ts             # Infrastructure definition
  Pulumi.yaml          # Project config
  Pulumi.dev.yaml      # Dev stack
  Pulumi.prod.yaml     # Prod stack` : ''}
${monitoring !== 'none' ? `monitoring/
  ${monitoring === 'prometheus-grafana' ? `prometheus.yml       # Prometheus config
  grafana/
    dashboards/        # Grafana dashboards` : monitoring === 'datadog' ? `datadog.yaml         # Datadog agent config` : `cloudwatch.json      # Monitoring config`}` : ''}
scripts/
  deploy.sh            # Deployment script
  setup.sh             # Environment setup
\`\`\`

${containerization !== 'none' ? `## Container Configuration

\`\`\`${containerization === 'docker' ? 'dockerfile' : 'dockerfile'}
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
\`\`\`
` : ''}
## Deployment Pipeline

${deployment}

${cicd === 'github-actions' ? `### Pipeline Stages

\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  lint:        # Code quality checks
  test:        # Run test suite
  build:       # Build application
  push:        # Push container image
  deploy:      # Deploy to ${cloud !== 'none' ? cloudLabel : 'server'}
\`\`\`` : cicd === 'gitlab-ci' ? `### Pipeline Stages

\`\`\`yaml
stages:
  - lint
  - test
  - build
  - deploy
\`\`\`` : cicd === 'jenkins' ? `### Pipeline Stages

\`\`\`groovy
pipeline {
  stages {
    stage('Lint')   { /* ... */ }
    stage('Test')   { /* ... */ }
    stage('Build')  { /* ... */ }
    stage('Deploy') { /* ... */ }
  }
}
\`\`\`` : ''}

## Environment Variables

\`\`\`bash
NODE_ENV=production
PORT=3000
${cloud === 'aws' ? `AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret` : cloud === 'gcp' ? `GCP_PROJECT_ID=your-project
GCP_REGION=us-central1` : cloud === 'azure' ? `AZURE_SUBSCRIPTION_ID=your-sub
AZURE_RESOURCE_GROUP=your-rg` : ''}
\`\`\`

${monitoring !== 'none' ? `## Monitoring

${monitoring === 'prometheus-grafana' ? `- **Metrics**: Prometheus scrapes \`/metrics\` endpoint
- **Dashboards**: Grafana at \`http://localhost:3001\`
- **Alerts**: Configured in \`monitoring/prometheus.yml\`` : monitoring === 'datadog' ? `- **Agent**: Datadog agent configured in \`monitoring/datadog.yaml\`
- **APM**: Application performance monitoring enabled
- **Logs**: Centralized log collection` : `- **Monitoring**: Cloud-native monitoring via ${cloudLabel}
- **Logs**: Cloud logging service
- **Alerts**: Cloud alerting configured`}
` : ''}

${data.includeReferences ? '- See [references/](references/) for pipeline and infrastructure details' : ''}
${data.includeScripts ? '- See [scripts/](scripts/) for deployment scripts' : ''}

${contextFiles && contextFiles.length > 0 ? generateContextSection(contextFiles) : ''}

---

**Generated with:** Skill Generator
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

  if (data.type === 'api') {
    refs['ENDPOINTS.md'] = generateEndpointsReference(data);
    refs['MIDDLEWARE.md'] = generateMiddlewareReference(data, variables);
  }

  if (data.type === 'fullstack') {
    refs['DATABASE.md'] = generateDatabaseReference(data, variables);
    refs['AUTH.md'] = generateAuthReference(data);
  }

  if (data.type === 'devops') {
    refs['PIPELINE.md'] = generatePipelineReference(data);
    refs['INFRASTRUCTURE.md'] = generateInfrastructureReference(data, variables);
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

  if (data.type === 'devops') {
    scripts['deploy.sh'] = `#!/bin/bash
# Deployment script for ${data.name}
set -e

echo "Deploying ${data.name}..."
# Add deployment commands here
`;
  }

  if (data.type === 'api') {
    scripts['seed.ts'] = `#!/usr/bin/env tsx
/**
 * Seed script for ${data.name}
 */

async function seed() {
  console.log('Seeding database...');
  // Add seed logic
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

// API reference generators
function generateEndpointsReference(data: SkillData): string {
  const { framework = 'express', validation = 'zod' } = data;
  return `# Endpoints Reference

## Resource: ${toTitleCase(data.name)}

### POST /api/${data.name}/
Create a new resource.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`

${validation !== 'none' ? `**Validation:** Schema validated with ${validation}` : ''}

### GET /api/${data.name}/
List all resources with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| sort | string | createdAt | Sort field |
| order | string | desc | Sort order (asc/desc) |

### GET /api/${data.name}/:id
Get a single resource by ID.

### PUT /api/${data.name}/:id
Update a resource.

### DELETE /api/${data.name}/:id
Delete a resource.

---

*Framework: ${framework}*
`;
}

function generateMiddlewareReference(data: SkillData, variables: Record<string, string>): string {
  const { auth = 'jwt', validation = 'zod', framework = 'express' } = data;
  return `# Middleware Reference

## Middleware Chain (${framework})

### 1. CORS
Cross-origin resource sharing configuration.

### 2. Helmet
Security headers (XSS protection, CSP, etc.).

### 3. Request Logger
HTTP request logging (morgan / pino).

${auth !== 'none' ? `### 4. Authentication
${variables.authMiddleware || auth}

\`\`\`typescript
// Apply to protected routes
app.use('/api', authMiddleware);
\`\`\`
` : ''}
${validation !== 'none' ? `### ${auth !== 'none' ? '5' : '4'}. Validation
Request body/query validation with ${validation}.

\`\`\`typescript
// Apply per-route
router.post('/', validate(createSchema), controller.create);
\`\`\`
` : ''}
### Error Handler
Centralized error handling middleware.

\`\`\`typescript
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message
  });
});
\`\`\`
`;
}

// Fullstack reference generators
function generateDatabaseReference(data: SkillData, variables: Record<string, string>): string {
  const { orm = 'prisma', database = 'postgres' } = data;
  const ormSetup = variables.ormSetup || '';

  return `# Database Reference

## Setup

Database: **${database}**
ORM: **${orm}**

\`\`\`bash
${ormSetup}
\`\`\`

${orm === 'prisma' ? `## Schema Example

\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}
\`\`\`

## Migrations

\`\`\`bash
npx prisma migrate dev --name init    # Create migration
npx prisma migrate deploy             # Apply in production
npx prisma studio                     # Visual editor
\`\`\`
` : orm === 'drizzle' ? `## Schema Example

\`\`\`typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`
` : `## Usage

Configure your ${orm} models in \`src/models/\` or \`models/\` directory.
`}
`;
}

function generateAuthReference(data: SkillData): string {
  const { auth = 'authjs', framework = 'nextjs' } = data;

  if (auth === 'none') {
    return `# Authentication\n\nNo authentication configured.\n`;
  }

  const guides: Record<string, string> = {
    authjs: `# Authentication - Auth.js

## Setup

\`\`\`typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
});
\`\`\`

## Protecting Routes

\`\`\`typescript
// middleware.ts
export { auth as middleware } from './lib/auth';

export const config = {
  matcher: ['/dashboard/:path*'],
};
\`\`\`
`,
    clerk: `# Authentication - Clerk

## Setup

\`\`\`typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
\`\`\`

## Usage

\`\`\`tsx
import { SignInButton, UserButton } from '@clerk/nextjs';

export function Header() {
  return <UserButton afterSignOutUrl="/" />;
}
\`\`\`
`,
    lucia: `# Authentication - Lucia

## Setup

Session-based authentication with Lucia.
Configure database adapter and session management in \`lib/auth.ts\`.

## Usage

\`\`\`typescript
import { lucia } from './lib/auth';

const session = await lucia.createSession(userId, {});
const cookie = lucia.createSessionCookie(session.id);
\`\`\`
`,
  };

  return guides[auth as string] || `# Authentication - ${auth}\n\nConfigure authentication in your project.\n`;
}

// DevOps reference generators
function generatePipelineReference(data: SkillData): string {
  const { cicd = 'github-actions', containerization = 'docker' } = data;

  if (cicd === 'none') {
    return `# CI/CD Pipeline\n\nNo CI/CD configured.\n`;
  }

  const guides: Record<string, string> = {
    'github-actions': `# CI/CD Pipeline - GitHub Actions

## Workflows

### CI (\`.github/workflows/ci.yml\`)

\`\`\`yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
${containerization !== 'none' ? `      - run: docker build -t app .` : ''}
\`\`\`
`,
    'gitlab-ci': `# CI/CD Pipeline - GitLab CI

## Configuration (\`.gitlab-ci.yml\`)

\`\`\`yaml
stages:
  - lint
  - test
  - build
  - deploy

lint:
  stage: lint
  script:
    - npm ci
    - npm run lint

test:
  stage: test
  script:
    - npm ci
    - npm test

build:
  stage: build
  script:
    - npm ci
    - npm run build
${containerization !== 'none' ? `    - docker build -t app .` : ''}
\`\`\`
`,
    jenkins: `# CI/CD Pipeline - Jenkins

## Jenkinsfile

\`\`\`groovy
pipeline {
  agent any
  stages {
    stage('Install') {
      steps { sh 'npm ci' }
    }
    stage('Lint') {
      steps { sh 'npm run lint' }
    }
    stage('Test') {
      steps { sh 'npm test' }
    }
    stage('Build') {
      steps { sh 'npm run build' }
    }
  }
}
\`\`\`
`,
  };

  return guides[cicd as string] || `# CI/CD Pipeline\n\nConfigure your pipeline.\n`;
}

function generateInfrastructureReference(data: SkillData, variables: Record<string, string>): string {
  const { cloud = 'aws', iac = 'terraform', orchestration = 'docker-compose' } = data;
  const cloudLabel = variables.cloudProvider || 'Not specified';

  return `# Infrastructure Reference

## Cloud Provider: ${cloudLabel}

${iac !== 'none' && cloud !== 'none' ? `## IaC: ${iac}

${iac === 'terraform' ? `### Commands

\`\`\`bash
terraform init          # Initialize providers
terraform plan          # Preview changes
terraform apply         # Apply changes
terraform destroy       # Tear down
\`\`\`

### Environment Separation

- \`terraform/environments/dev.tfvars\` — Development
- \`terraform/environments/prod.tfvars\` — Production

\`\`\`bash
terraform plan -var-file=environments/dev.tfvars
\`\`\`
` : iac === 'pulumi' ? `### Commands

\`\`\`bash
pulumi up               # Deploy changes
pulumi preview          # Preview changes
pulumi destroy          # Tear down
pulumi stack select dev # Switch environment
\`\`\`
` : `### Commands

\`\`\`bash
aws cloudformation deploy \\
  --template-file template.yaml \\
  --stack-name ${data.name}
\`\`\`
`}` : ''}

${orchestration === 'kubernetes' ? `## Kubernetes

### Commands

\`\`\`bash
kubectl apply -f k8s/           # Apply all manifests
kubectl get pods                # List pods
kubectl logs -f deployment/app  # Follow logs
kubectl rollout restart deployment/app  # Restart
\`\`\`
` : orchestration === 'docker-compose' ? `## Docker Compose

### Commands

\`\`\`bash
docker compose up -d            # Start services
docker compose down             # Stop services
docker compose logs -f          # Follow logs
docker compose ps               # List services
\`\`\`
` : ''}
`;
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

export async function getTemplateChoices(): Promise<{ name: string; value: string; description: string }[]> {
  const builtIns = [
    { name: 'Basic', value: 'basic', description: 'Minimal skill with only SKILL.md' },
    { name: 'REST API', value: 'api', description: 'REST API with configurable framework, database, and auth' },
    { name: 'Full-Stack App', value: 'fullstack', description: 'Full-stack application with frontend, API routes, and database' },
    { name: 'Frontend Next.js', value: 'frontend', description: 'Application with configurable UI and state' },
    { name: 'NestJS Microservice', value: 'microservice', description: 'Microservice with configurable architecture' },
    { name: 'DevOps / Infrastructure', value: 'devops', description: 'Infrastructure, CI/CD pipelines, and deployment' },
    { name: 'Shared Library', value: 'library', description: 'Utility library without framework dependencies' },
  ];

  try {
    const { templates } = await loadCustomTemplates();
    const custom = templates.map(t => ({
      name: `${t.name} (custom)`,
      value: t.id,
      description: t.description,
    }));
    return [...builtIns, ...custom];
  } catch {
    return builtIns;
  }
}

export { getTemplateConfig };
export type { TemplateConfig };
