# Changelog

All notable changes to the AI Skill Generator project.

## [1.0.2] - 2026-02-11

### Added
- **Dry run mode** (`--dry-run`): Preview generated files with sizes without writing to disk

### Fixed
- **Agent install paths**: Skills now install to project-level directories where agents actually read them (was incorrectly using home directory paths)
- **Prompt repetition bug**: Fixed interactive agent selection prompt duplicating output due to console.log re-rendering

### Changed
- Agent install paths are now project-level (e.g., `.claude/skills/` instead of `~/.claude/skills/`)
- Agent selection prompt now shows agent names inline instead of separate console output
- Updated USAGE_GUIDE with correct agent paths and test commands

## [1.0.0] - 2026-02-09

### Added

#### Core Features
- **Skill Generation**: Create skills from 4 configurable templates
  - `frontend`: Next.js with UI library options (shadcn, MUI, Chakra, Headless)
  - `microservice`: NestJS with architecture options (Clean, Hexagonal, Modular)
  - `library`: TypeScript/JavaScript shared library
  - `basic`: Minimal skill structure

- **Presets System**: Pre-configured stacks for quick generation
  - `modern-react`: Next.js + shadcn + Zustand + Vitest
  - `enterprise-api`: NestJS + Clean Arch + TypeORM + Swagger
  - `fullstack-next`: Next.js + tRPC + Prisma
  - `minimal-api`: NestJS + Modular + Postgres

- **Context Loading**: Import external documentation
  - Support for `.md`, `.txt`, `.mdx`, `.yml`, `.yaml`, `.json`
  - Single files or entire directories
  - Merged into `references/CONTEXT.md`

- **Multi-Agent Installation**: Install skills to AI agents
  - Claude Code
  - Cursor
  - VS Code / Copilot
  - Codex
  - Goose
  - OpenCode
  - Gemini CLI
  - Letta
  - Amp

- **Validation**: YAML frontmatter validation
  - Required fields check
  - Naming convention validation (kebab-case)
  - Description length limits

- **Packaging**: Create distributable `.skill` files
  - ZIP format for easy sharing
  - Maintains directory structure

### Commands

| Command | Description |
|---------|-------------|
| `init` | Create new skill with interactive or flag-based options |
| `install` | Install skill to AI agents |
| `validate` | Validate skill structure and frontmatter |
| `package` | Create .skill package |
| `list-agents` | Show detected AI agents |
| `list-templates` | Show available templates |
| `list-presets` | Show available presets |

### Flags

```bash
# Creation flags
--name <name>              # Skill name (kebab-case)
--type <type>              # Template type
--desc <description>       # Skill description
--preset <preset>          # Use preset configuration
--context <paths...>       # External context files
--output <path>            # Output directory
--with-references          # Include references/ directory
--with-scripts             # Include scripts/ directory
--with-assets              # Include assets/ directory
--install                  # Install after creation
--install-agent <agents>   # Specific agents to install
--non-interactive          # Run without prompts

# Install flags
--agent <agents>           # Target specific agents
--yes                      # Auto-confirm
--force                    # Overwrite existing

# Package flags
--output <path>            # Output directory for package
```

### Test Suite

Added 5 functional tests in `tests/`:

1. **test1-basic-frontend**: Basic frontend skill generation
2. **test2-microservice**: Microservice with references and scripts
3. **test3-library**: Library generation and packaging
4. **test4-with-context**: External context loading
5. **test5-preset**: Preset-based generation

### Documentation

- Complete README with installation and usage
- USAGE_GUIDE with all commands and examples
- Individual test READMEs
- Inline code comments

### Technical Implementation

- TypeScript with strict type checking
- Commander.js for CLI
- Inquirer.js for interactive prompts
- js-yaml for YAML parsing
- adm-zip for packaging
- Chalk for colored output

### Project Structure

```
skill-generator/
├── src/
│   ├── cli.ts                 # Entry point
│   ├── commands/              # CLI commands
│   ├── templates/             # Template configurations
│   ├── presets/               # Preset definitions
│   ├── agents/                # AI agent detection & install
│   ├── context-loaders/       # External file loading
│   └── validators/            # Skill validation
├── tests/                     # Functional tests
├── package.json
├── tsconfig.json
├── README.md
├── USAGE_GUIDE.md
└── CHANGELOG.md
```

### Compatibility

- Node.js >= 18.0.0
- Supports Windows, macOS, Linux
