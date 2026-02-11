# AI Skill Generator - Complete Usage Guide

A comprehensive guide for creating, validating, packaging, and installing AI skills.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Creating Skills](#creating-skills)
4. [Validating Skills](#validating-skills)
5. [Installing Skills](#installing-skills)
6. [Packaging Skills](#packaging-skills)
7. [Templates & Presets](#templates--presets)
8. [Advanced Usage](#advanced-usage)
9. [Troubleshooting](#troubleshooting)

---

## Installation

### Global Installation

```bash
npm install -g ai-skill-generator
```

### Local Development

```bash
git clone <repository-url>
cd ai-skill-generator
npm install
npm run build
```

### Verify Installation

```bash
skill-gen --version
# or
sg --version
```

---

## Quick Start

### Interactive Mode (Recommended)

```bash
skill-gen init
```

This will guide you through:
1. Selecting a template
2. Configuring options
3. Choosing output location
4. Optional: Installing to AI agents

### Quick Create with Preset

```bash
skill-gen init --preset modern-react --name my-skill --desc "My skill"
```

---

## Creating Skills

### Basic Commands

```bash
# Interactive mode
skill-gen init

# With flags (non-interactive)
skill-gen init \
  --name my-awesome-skill \
  --type frontend \
  --desc "A skill for React development" \
  --output ./skills \
  --non-interactive
```

### With Directories

```bash
# Include references directory
skill-gen init --name my-skill --with-references

# Include scripts directory
skill-gen init --name my-skill --with-scripts

# Include all optional directories
skill-gen init --name my-skill --with-references --with-scripts --with-assets
```

### With External Context

```bash
# Single file
skill-gen init \
  --name my-skill \
  --context ./docs/specifications.md

# Multiple files
skill-gen init \
  --name my-skill \
  --context ./docs/specs.md \
  --context ./docs/api-guide.md

# Entire directory
skill-gen init \
  --name my-skill \
  --context ./docs/
```

### With Presets

```bash
# List available presets
skill-gen list-presets

# Use a preset
skill-gen init \
  --name my-api \
  --preset enterprise-api \
  --desc "My enterprise API"
```

### Preview Before Creating (Dry Run)

```bash
# See what files would be generated without writing anything
skill-gen init \
  --name my-api \
  --type microservice \
  --desc "API service" \
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

Works with any combination of flags, presets, and templates. Remove `--dry-run` to create the files for real.

### Create and Install

```bash
# Create and install to all detected agents
skill-gen init --name my-skill --install

# Create and install to specific agents
skill-gen init \
  --name my-skill \
  --install \
  --install-agent claude \
  --install-agent cursor
```

---

## Validating Skills

### Basic Validation

```bash
skill-gen validate ./skills/my-skill
```

### Expected Output

```
🔍 Validating skill: /path/to/my-skill

✅ Skill is valid!
```

### Validation Errors

If validation fails, you'll see:

```
❌ Validation failed:
  • Missing required field: description
  • Invalid YAML in frontmatter
```

---

## Installing Skills

### Install to All Agents

```bash
skill-gen install ./skills/my-skill
```

### Install to Specific Agents

```bash
skill-gen install ./skills/my-skill --agent claude
skill-gen install ./skills/my-skill --agent cursor --agent vscode
```

### Non-Interactive Install

```bash
# Install to all without prompting
skill-gen install ./skills/my-skill --yes
```

### Check Installed Agents

```bash
skill-gen list-agents
```

Output:
```
🤖 Detected AI Agents:

✅ Claude Code
✅ Cursor
❌ VS Code / Copilot (not installed)
✅ Gemini CLI
```

### Supported Agents

| Agent | Install Location (project-level) |
|-------|-----------------------------------|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| VS Code / Copilot | `.github/skills/` |
| Codex | `.agents/skills/` |
| Goose | `.goose/skills/` |
| OpenCode | `.opencode/skills/` |
| Gemini CLI | `.gemini/skills/` |
| Letta | `.skills/` |
| Amp | `.agents/skills/` |

---

## Packaging Skills

### Create .skill Package

```bash
skill-gen package ./skills/my-skill
```

### Custom Output Directory

```bash
skill-gen package ./skills/my-skill --output ./packages
```

### Output

Creates `my-skill.skill` (a ZIP file) that can be:
- Shared with others
- Published to a repository
- Installed manually

---

## Templates & Presets

### Available Templates

```bash
skill-gen list-templates
```

| Template | Description |
|----------|-------------|
| `frontend` | Next.js with configurable UI library |
| `microservice` | NestJS with configurable architecture |
| `library` | TypeScript/JavaScript library |
| `basic` | Minimal skill structure |

### Available Presets

```bash
skill-gen list-presets
```

| Preset | Stack |
|--------|-------|
| `modern-react` | Next.js + shadcn + Zustand |
| `enterprise-api` | NestJS + Clean Arch + TypeORM |
| `fullstack-next` | Next.js + tRPC + Prisma |
| `minimal-api` | NestJS + Modular + Postgres |

### Frontend Template Options

When using `--type frontend`, you can configure:

- **UI Library**: shadcn/ui, MUI, Chakra UI, Headless UI
- **State Management**: Zustand, Redux Toolkit, Jotai, Context API
- **Forms**: React Hook Form + Zod, TanStack Form, Formik
- **Data Fetching**: TanStack Query, SWR, RTK Query
- **Styling**: Tailwind CSS, CSS Modules, Styled Components
- **Testing**: Vitest, Jest
- **Extras**: Storybook

### Microservice Template Options

When using `--type microservice`, you can configure:

- **Database**: PostgreSQL, MongoDB, MySQL, SQL Server
- **Architecture**: Clean Architecture, Hexagonal, Modular
- **Communication**: REST, gRPC, RabbitMQ, Redis
- **Authentication**: JWT, API Keys, Auth Service, None
- **Documentation**: Swagger, Compodoc
- **Testing**: Jest, Vitest
- **Extras**: Docker

---

## Advanced Usage

### Complete Workflow Example

```bash
# 1. Create a skill with context and presets
skill-gen init \
  --name payment-service \
  --preset enterprise-api \
  --desc "Payment processing microservice" \
  --context ./docs/payment-specs.md \
  --context ./docs/api-contracts/ \
  --with-references \
  --with-scripts \
  --output ./skills

# 2. Validate the skill
skill-gen validate ./skills/payment-service

# 3. Install to your agents
skill-gen install ./skills/payment-service --yes

# 4. Package for distribution
skill-gen package ./skills/payment-service --output ./packages
```

### Custom Presets

Create `~/.skill-generator/presets.json`:

```json
{
  "my-team-frontend": {
    "name": "My Team Frontend",
    "description": "Standard frontend stack for our team",
    "type": "frontend",
    "options": {
      "uiLibrary": "mui",
      "stateManagement": "zustand",
      "forms": "react-hook-form",
      "dataFetching": "tanstack-query",
      "styling": "tailwind",
      "includeTesting": "vitest"
    }
  }
}
```

Use it:

```bash
skill-gen init --preset my-team-frontend --name my-skill
```

---

## Troubleshooting

### Command Not Found

```bash
# If skill-gen is not found after global install
npm config get prefix
# Add the bin directory to your PATH
```

### Validation Errors

**Problem**: `YAML invalid: bad indentation`

**Solution**: Ensure your description doesn't contain unescaped quotes:
```bash
# Bad
--desc "Skill for "React" apps"

# Good
--desc "Skill for React apps"
```

### Agent Not Detected

**Problem**: Agent shows as "not installed"

**Solution**: The agent must have been run at least once to create its config directory:
```bash
# For Claude Code
claude --version

# For Cursor
# Just open Cursor once
```

### Permission Denied

```bash
# Make scripts executable
chmod +x ./tests/*/run-test.sh
```

---

## All Commands Reference

| Command | Description |
|---------|-------------|
| `skill-gen init` | Create a new skill |
| `skill-gen install <path>` | Install skill to AI agents |
| `skill-gen validate <path>` | Validate skill structure |
| `skill-gen package <path>` | Create .skill package |
| `skill-gen list-agents` | List detected AI agents |
| `skill-gen list-templates` | List available templates |
| `skill-gen list-presets` | List available presets |

---

## Examples

### Example 1: Frontend Team Skill

```bash
skill-gen init \
  --name frontend-standards \
  --preset modern-react \
  --desc "Coding standards and patterns for our frontend team" \
  --context ./docs/frontend-guidelines.md \
  --with-references \
  --install
```

### Example 2: API Documentation Skill

```bash
skill-gen init \
  --name api-docs \
  --type microservice \
  --desc "API documentation and testing patterns" \
  --with-references \
  --with-scripts \
  --output ./skills

skill-gen install ./skills/api-docs --agent claude
```

### Example 3: Library with Full Setup

```bash
skill-gen init \
  --name utils-lib \
  --type library \
  --desc "Shared utility functions" \
  --with-references \
  --with-scripts \
  --with-assets

skill-gen validate ./skills/utils-lib
skill-gen package ./skills/utils-lib --output ./dist
```

---

## Testing

Run all tests:

```bash
npm test
```

Run individual tests:

```bash
npm run test:frontend
npm run test:microservice
npm run test:library
npm run test:context
npm run test:preset
```

---

## Support

For issues and feature requests, please visit the repository.

**Happy skill generating!** 🚀
