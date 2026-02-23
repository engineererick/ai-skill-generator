# AI Skill Generator

Create, validate, and package skills for AI coding assistants (Claude, Cursor, Copilot, Codex, and more). 7 configurable templates, custom templates, auto-detection, import from existing files, and skill update support.

## Features

- **7 Built-in templates**: REST API, Full-Stack, Frontend, Microservice, DevOps, Library, Basic
- **Custom templates**: Create your own YAML templates with questions and variables
- **Interactive preview**: Syntax-highlighted SKILL.md preview before writing to disk
- **Auto-detect**: Scan your project and auto-fill template options (`skill-gen init --auto`)
- **Import**: Convert existing AI instruction files into skills (`skill-gen import`)
- **Skill updates**: Modify existing skills without recreating from scratch (`skill-gen update`)
- **Built-in presets**: Ready-to-use technology stacks
- **Dry run mode**: Preview generated files without writing to disk
- **Automated mode**: Flags for CI/CD pipelines
- **External context**: Include .md, .txt files as references
- **Validation**: Automatically verify SKILL.md structure
- **Packaging**: Generate .skill files (zip) for distribution
- **Multi-agent install**: Install skills to 9 AI agents at once

## Installation

### Global

```bash
npm install -g ai-skill-generator
```

### Local

```bash
git clone https://github.com/engineererick/ai-skill-generator.git
cd ai-skill-generator
npm install
npm run build
```

## Quick Start

### Interactive Mode (Recommended)

```bash
skill-gen init
# or
sg init
```

### With Preset

```bash
# List available presets
skill-gen list-presets

# Use a preset
skill-gen init --preset modern-react --name my-skill --desc "My skill"
```

### Auto-detect Project

```bash
# Detect stack from current directory (interactive)
cd my-nextjs-project
skill-gen init --auto

# Non-interactive: auto-detect + flags
skill-gen init --auto --name my-skill --desc "My project skill" --non-interactive
```

Detects 35+ npm packages, config files, and folder patterns. Supports Next.js, NestJS, Express, Prisma, Tailwind, and many more.

### Import Existing AI Instructions

```bash
# Import a .cursorrules or CLAUDE.md file
skill-gen import .cursorrules --name my-rules

# Scan for all known AI instruction files in current directory
skill-gen import --scan
```

Supported formats: `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurfrules`, `.goose/instructions.md`, `.gemini/instructions.md`, `codex.md`, `.amp/instructions.md`.

### With Flags (Automation)

```bash
skill-gen init \
  --name my-api \
  --type api \
  --desc "Payments API" \
  --with-references \
  --non-interactive
```

### Update an Existing Skill

```bash
# Interactive: choose what to update
skill-gen update ./skills/my-api

# Change description only
skill-gen update ./skills/my-api --desc "New description" --non-interactive

# Preview changes without writing
skill-gen update ./skills/my-api --dry-run
```

### Preview Before Creating (Dry Run)

```bash
skill-gen init \
  --name my-api \
  --type api \
  --desc "Payments API" \
  --with-references \
  --non-interactive \
  --dry-run
```

### With External Context

```bash
skill-gen init \
  --name my-docs \
  --type frontend \
  --desc "With external documentation" \
  --context ./docs/specs.md \
  --context ./docs/requirements/
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `init` | | Create a new skill |
| `import [file]` | `i` | Import an AI instruction file as a skill |
| `update <path>` | `u` | Update an existing skill |
| `validate <path>` | | Validate SKILL.md structure |
| `package <path>` | | Create a .skill file (zip) |
| `install <path>` | | Install skill to AI agents |
| `list-templates` | `templates` | Show available templates |
| `list-presets` | `presets` | Show built-in presets |
| `list-agents` | `agents` | Show detected AI agents |
| `template create` | `t create` | Scaffold a custom template |
| `template list` | `t list` | List all templates (built-in + custom) |
| `template validate` | `t validate` | Validate a custom template YAML |

## Templates

### REST API

Available options:
- **Framework**: Express, Fastify, Hono, Koa
- **Database**: PostgreSQL, MongoDB, SQLite, None
- **ORM**: Prisma, Drizzle, Mongoose, None
- **Auth**: JWT, Session, OAuth, None
- **Validation**: Zod, Joi, Yup, None
- **Documentation**: Swagger, None
- **Testing**: Vitest, Jest, None

### Full-Stack App

Available options:
- **Framework**: Next.js, Nuxt, Remix, SvelteKit
- **Database**: PostgreSQL, MongoDB, SQLite
- **ORM**: Prisma, Drizzle, Mongoose, TypeORM
- **Auth**: Auth.js, Clerk, Lucia, None
- **Styling**: Tailwind, CSS Modules, Styled Components
- **State**: Zustand, Pinia, Jotai, None
- **Testing**: Vitest+Playwright, Jest+Cypress, Vitest, None

### Frontend (Next.js)

Available options:
- **UI Library**: shadcn/ui, MUI, Chakra UI, Headless UI
- **State**: Zustand, Redux Toolkit, Jotai, Context API
- **Forms**: React Hook Form + Zod, TanStack Form, Formik
- **Data Fetching**: TanStack Query, SWR, RTK Query
- **Styling**: Tailwind CSS, CSS Modules, Styled Components
- **Extras**: Storybook, Testing (Vitest/Jest)

### Microservice (NestJS)

Available options:
- **Database**: SQL Server, PostgreSQL, MongoDB, MySQL
- **Architecture**: Clean Architecture, Hexagonal, Modular
- **Communication**: REST, gRPC, RabbitMQ, Redis
- **Auth**: JWT, API Keys, OAuth2, None
- **Docs**: Swagger, Compodoc
- **Extras**: Docker, Testing (Jest/Vitest)

### DevOps / Infrastructure

Available options:
- **Containerization**: Docker, Podman, None
- **Orchestration**: Kubernetes, Docker Compose, None
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins, None
- **Cloud**: AWS, GCP, Azure, None
- **IaC**: Terraform, Pulumi, CloudFormation, None
- **Monitoring**: Prometheus+Grafana, Datadog, Cloud Native, None

### Library

Template for shared utility libraries without framework dependencies.

### Basic

Minimal template for simple use cases.

## Custom Templates

Create your own reusable templates with YAML:

```bash
# Scaffold a new custom template
skill-gen template create

# List all templates (built-in + custom)
skill-gen template list

# Validate a custom template
skill-gen template validate ./my-template.yaml
```

Templates can be saved globally (`~/.skill-generator/templates/`) or per-project (`.skill-generator/templates/`).

## Update Command

Update an existing skill's configuration without recreating from scratch:

```bash
skill-gen update <path> [options]
```

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Change skill name |
| `-d, --desc <desc>` | Change description |
| `-t, --type <type>` | Change template type (full regeneration) |
| `-c, --context <paths...>` | Replace context files |
| `--with-references` / `--without-references` | Toggle references/ |
| `--with-scripts` / `--without-scripts` | Toggle scripts/ |
| `--with-assets` / `--without-assets` | Toggle assets/ |
| `--reinstall` | Re-install to agents after update |
| `--non-interactive` | Only apply changes from flags |
| `--dry-run` | Preview without writing |
| `--no-backup` | Skip backup creation |

The update command reads `.skillgen.json` metadata saved during `init` to know the original template and options. For skills created before metadata tracking, an adoption flow guides you through establishing a baseline.

## Presets

| Preset | Description | Stack |
|--------|-------------|-------|
| `modern-react` | Modern 2025 stack | Next.js + shadcn + Zustand + RHF |
| `enterprise-api` | Enterprise API | NestJS + Clean Arch + TypeORM + Swagger |
| `minimal-api` | Lightweight API | NestJS + Modular + Postgres |
| `fullstack-next` | Full stack | Next.js + tRPC + Prisma |

## Init Options

```
Options:
  -n, --name <name>           Skill name (kebab-case)
  -t, --type <type>           Type: api, fullstack, frontend, microservice, devops, library, basic
  -a, --auto                  Auto-detect project type and technologies
  -o, --output <path>         Output directory (default: ./skills)
  -d, --desc <description>    Short description
  -p, --preset <preset>       Use a built-in preset
  -c, --context <paths...>    Context files/directories
  --with-references           Include references/ directory
  --with-scripts              Include scripts/ directory
  --with-assets               Include assets/ directory
  --install                   Install to AI agents after creation
  --install-agent <agents>    Install to specific agents only
  --non-interactive           Automated mode (requires flags)
  --dry-run                   Preview files without writing to disk
```

## Import Options

```
Options:
  --scan                      Scan current directory for known AI instruction files
  -n, --name <name>           Override skill name
  -d, --desc <desc>           Override description
  -o, --output <path>         Output directory (default: ./skills)
  --install                   Install to AI agents after import
  --non-interactive           Automated mode
  --dry-run                   Preview without writing
```

## External Context

You can include external files that will be merged into `references/CONTEXT.md`:

```bash
# Single file
skill-gen init --context ./docs/specifications.md

# Entire directory
skill-gen init --context ./docs/requirements/

# Multiple sources
skill-gen init --context ./docs/api.md --context ./docs/architecture/
```

**Supported formats**: `.md`, `.txt`, `.mdx`, `.yml`, `.yaml`, `.json`

## Generated Skill Structure

```
my-skill/
├── SKILL.md              # Main file with YAML frontmatter
├── .skillgen.json        # Generation metadata (for updates)
├── references/           # Extended documentation (optional)
│   ├── ENDPOINTS.md
│   ├── MIDDLEWARE.md
│   └── CONTEXT.md        # Included if external context was provided
├── scripts/              # Utilities (optional)
│   ├── seed.ts
│   └── deploy.sh
└── assets/               # Resources (optional)
```

## Supported AI Agents

Skills can be installed to these AI coding assistants:

- Claude Code
- Cursor
- VS Code / Copilot
- Codex
- Goose
- OpenCode
- Gemini CLI
- Letta
- Amp

## Development

```bash
npm run watch    # Recompile on changes
npm run clean    # Clean build
npm run build    # Rebuild
npm test         # Run all tests (14 functional + 12 renderer)
```

## License

MIT
