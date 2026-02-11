# AI Skill Generator

Create, validate, and package skills for AI coding assistants (Claude, Cursor, Copilot, Codex, and more). Configurable templates with external context support.

## Features

- **4 Configurable templates**: Frontend, Microservice, Library, Basic
- **Built-in presets**: Ready-to-use stacks
- **Interactive mode**: Guided wizard with smart prompts
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

### With Flags (Automation)

```bash
skill-gen init \
  --name my-api \
  --type microservice \
  --desc "Payments API" \
  --with-references \
  --with-scripts \
  --non-interactive
```

### Preview Before Creating (Dry Run)

```bash
skill-gen init \
  --name my-api \
  --type microservice \
  --desc "Payments API" \
  --with-references \
  --with-scripts \
  --non-interactive \
  --dry-run
```

Output:
```
Preview (dry run):

  my-api/
  ├── SKILL.md (1.1 KB)
  ├── references/API.md (349 B)
  ├── references/ARCHITECTURE.md (337 B)
  ├── scripts/seed.ts (274 B)
  └── scripts/example.ts (123 B)

  5 file(s), 2.1 KB total

No files were written (dry-run mode)
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

| Command | Description |
|---------|-------------|
| `init` | Create a new skill |
| `validate <path>` | Validate SKILL.md structure |
| `package <path>` | Create a .skill file (zip) |
| `install <path>` | Install skill to AI agents |
| `list-templates` | Show available templates |
| `list-presets` | Show built-in presets |
| `list-agents` | Show detected AI agents |

## Templates

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

### Library

Template for shared utility libraries without framework dependencies.

### Basic

Minimal template for simple use cases.

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
  -t, --type <type>           Type: microservice, frontend, library, basic
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
├── references/           # Extended documentation (optional)
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── CONTEXT.md        # Included if external context was provided
├── scripts/              # Utilities (optional)
│   ├── seed.ts
│   └── example.ts
└── assets/               # Resources (optional)
```

## Development

```bash
npm run watch    # Recompile on changes
npm run clean    # Clean build
npm run build    # Rebuild
npm test         # Run all tests
```

## Examples

### Create a skill with a modern preset

```bash
skill-gen init --preset modern-react --name customer-portal --desc "Customer portal"
```

### Create a skill with full configuration

```bash
skill-gen init \
  --name reports-api \
  --type microservice \
  --desc "Report generation" \
  --with-references \
  --with-scripts \
  --non-interactive
```

### Create a skill with external documentation

```bash
skill-gen init \
  --name integration-service \
  --type microservice \
  --desc "Third-party integration" \
  --context ./docs/integration-spec.md \
  --context ./docs/api-contracts/ \
  --with-references
```

## Roadmap

- [ ] Custom presets (save user configurations)
- [ ] Template plugins (extensible system)
- [ ] Stricter SKILL.md validation
- [ ] Export to other formats (JSON, YAML)

## License

MIT
