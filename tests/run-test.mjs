#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, '..', 'dist', 'cli.js');

const tests = {
  'test1-basic-frontend': {
    title: 'Test 1: Basic Frontend Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-frontend-skill --type frontend --desc "A test frontend skill for React applications" --output ./output --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-frontend-skill`);
    },
  },
  'test2-microservice': {
    title: 'Test 2: Microservice Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-api-service --type microservice --desc "A REST API microservice for user management" --output ./output --with-references --with-scripts --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-api-service`);
      assertDir(dir, 'output/test-api-service/references', 'References directory');
      assertDir(dir, 'output/test-api-service/scripts', 'Scripts directory');
    },
  },
  'test3-library': {
    title: 'Test 3: Library Skill Generation',
    run(dir) {
      clean(dir, 'output');
      clean(dir, 'packages');
      run(dir, `node ${cli} init --name test-utils-lib --type library --desc "A utility library for common functions" --output ./output --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-utils-lib`);
      run(dir, `node ${cli} package ./output/test-utils-lib --output ./packages`);
      assertFile(dir, 'packages/test-utils-lib.skill', 'Package file');
    },
  },
  'test4-with-context': {
    title: 'Test 4: Skill with External Context',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-context-skill --type microservice --desc "A microservice with external documentation" --context ./context/specifications.md --context ./context/api-notes.md --output ./output --with-references --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-context-skill`);
      assertFile(dir, 'output/test-context-skill/references/CONTEXT.md', 'CONTEXT.md file');
      assertContains(dir, 'output/test-context-skill/references/CONTEXT.md', 'Project Specifications', 'specifications.md content');
      assertContains(dir, 'output/test-context-skill/references/CONTEXT.md', 'API Development Notes', 'api-notes.md content');
    },
  },
  'test5-preset': {
    title: 'Test 5: Preset Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} list-presets`);
      run(dir, `node ${cli} init --name test-preset-skill --preset modern-react --desc "A skill using the modern-react preset" --output ./output --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-preset-skill`);
      assertContains(dir, 'output/test-preset-skill/SKILL.md', 'shadcn', 'shadcn/ui configuration');
      assertContains(dir, 'output/test-preset-skill/SKILL.md', 'zustand', 'Zustand configuration');
    },
  },
  'test6-custom-template': {
    title: 'Test 6: Custom Template Skill Generation',
    run(dir) {
      clean(dir, 'output');
      // Copy template to .skill-generator/templates/ (project-level)
      const templatesDir = resolve(dir, '.skill-generator', 'templates');
      mkdirSync(templatesDir, { recursive: true });
      copyFileSync(resolve(dir, 'templates', 'express-api.yaml'), resolve(templatesDir, 'express-api.yaml'));
      // Generate skill using custom template
      run(dir, `node ${cli} init --name my-express-api --type express-api --desc "My Express REST API" --output ./output --with-references --with-scripts --non-interactive`);
      // Validate generated skill
      run(dir, `node ${cli} validate ./output/my-express-api`);
      // Verify content was rendered correctly
      assertContains(dir, 'output/my-express-api/SKILL.md', 'Express', 'Express framework reference');
      assertContains(dir, 'output/my-express-api/SKILL.md', 'postgres', 'Default database value');
      assertContains(dir, 'output/my-express-api/SKILL.md', 'My Express Api', 'Title case name');
      // Verify references and scripts were generated
      assertFile(dir, 'output/my-express-api/references/API.md', 'Custom reference file');
      assertFile(dir, 'output/my-express-api/scripts/seed.js', 'Custom script file');
      assertContains(dir, 'output/my-express-api/references/API.md', 'postgres', 'Database in reference');
      assertContains(dir, 'output/my-express-api/scripts/seed.js', 'postgres', 'Database in script');
      // Cleanup project-level templates
      rmSync(resolve(dir, '.skill-generator'), { recursive: true, force: true });
    },
  },
  'test7-template-validate': {
    title: 'Test 7: Template Validation',
    run(dir) {
      // Valid template should pass
      run(dir, `node ${cli} template validate ./valid-template.yaml`);
      console.log('  Valid template accepted');
      // Invalid template should fail
      let failed = false;
      try {
        run(dir, `node ${cli} template validate ./invalid-template.yaml`);
      } catch {
        failed = true;
      }
      if (!failed) {
        throw new Error('Invalid template should have failed validation');
      }
      console.log('  Invalid template rejected');
    },
  },
  'test8-template-list': {
    title: 'Test 8: Template List with Custom Templates',
    run(dir) {
      // List templates (should show built-in ones)
      run(dir, `node ${cli} template list`);
      console.log('  Template list displayed');
    },
  },
  'test9-api': {
    title: 'Test 9: REST API Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-api-skill --type api --desc "A REST API for user management" --output ./output --with-references --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-api-skill`);
      assertContains(dir, 'output/test-api-skill/SKILL.md', 'express', 'Default framework');
      assertContains(dir, 'output/test-api-skill/SKILL.md', 'postgres', 'Default database');
      assertContains(dir, 'output/test-api-skill/SKILL.md', 'jwt', 'Default auth');
      assertDir(dir, 'output/test-api-skill/references', 'References directory');
      assertFile(dir, 'output/test-api-skill/references/ENDPOINTS.md', 'Endpoints reference');
      assertFile(dir, 'output/test-api-skill/references/MIDDLEWARE.md', 'Middleware reference');
    },
  },
  'test10-fullstack': {
    title: 'Test 10: Full-Stack Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-fullstack-skill --type fullstack --desc "A full-stack Next.js application" --output ./output --with-references --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-fullstack-skill`);
      assertContains(dir, 'output/test-fullstack-skill/SKILL.md', 'Next.js', 'Default framework');
      assertContains(dir, 'output/test-fullstack-skill/SKILL.md', 'prisma', 'Default ORM');
      assertDir(dir, 'output/test-fullstack-skill/references', 'References directory');
      assertFile(dir, 'output/test-fullstack-skill/references/DATABASE.md', 'Database reference');
      assertFile(dir, 'output/test-fullstack-skill/references/AUTH.md', 'Auth reference');
    },
  },
  'test11-devops': {
    title: 'Test 11: DevOps Skill Generation',
    run(dir) {
      clean(dir, 'output');
      run(dir, `node ${cli} init --name test-devops-skill --type devops --desc "Infrastructure and CI/CD for my project" --output ./output --with-references --with-scripts --non-interactive`);
      run(dir, `node ${cli} validate ./output/test-devops-skill`);
      assertContains(dir, 'output/test-devops-skill/SKILL.md', 'docker', 'Default containerization');
      assertContains(dir, 'output/test-devops-skill/SKILL.md', 'github-actions', 'Default CI/CD');
      assertDir(dir, 'output/test-devops-skill/references', 'References directory');
      assertDir(dir, 'output/test-devops-skill/scripts', 'Scripts directory');
      assertFile(dir, 'output/test-devops-skill/references/PIPELINE.md', 'Pipeline reference');
      assertFile(dir, 'output/test-devops-skill/references/INFRASTRUCTURE.md', 'Infrastructure reference');
      assertFile(dir, 'output/test-devops-skill/scripts/deploy.sh', 'Deploy script');
    },
  },
  'test12-update-basic': {
    title: 'Test 12: Update Skill (Basic)',
    run(dir) {
      clean(dir, 'output');
      // 1. Create initial skill
      run(dir, `node ${cli} init --name test-update-skill --type api --desc "Original description" --output ./output --with-references --non-interactive`);
      // Verify .skillgen.json was created
      assertFile(dir, 'output/test-update-skill/.skillgen.json', 'Metadata file');
      // Verify original content
      assertContains(dir, 'output/test-update-skill/SKILL.md', 'Original description', 'Original description');
      // Verify metadata contents
      const metaContent = readFileSync(resolve(dir, 'output/test-update-skill/.skillgen.json'), 'utf-8');
      const meta = JSON.parse(metaContent);
      if (meta.templateType !== 'api') throw new Error('Metadata templateType should be api');
      if (meta.version !== 1) throw new Error('Metadata version should be 1');
      console.log('  Metadata content valid');
      // 2. Update skill with new description
      run(dir, `node ${cli} update ./output/test-update-skill --desc "Updated description" --non-interactive --no-backup`);
      // Verify updated content
      assertContains(dir, 'output/test-update-skill/SKILL.md', 'Updated description', 'Updated description');
      // Verify metadata was updated
      const updatedMeta = JSON.parse(readFileSync(resolve(dir, 'output/test-update-skill/.skillgen.json'), 'utf-8'));
      if (updatedMeta.skillData.description !== 'Updated description') throw new Error('Metadata description not updated');
      if (updatedMeta.updatedAt === meta.createdAt) throw new Error('updatedAt should change');
      console.log('  Metadata updated correctly');
      // 3. Update with --dry-run (should not change files)
      run(dir, `node ${cli} update ./output/test-update-skill --desc "Dry run desc" --non-interactive --dry-run`);
      assertContains(dir, 'output/test-update-skill/SKILL.md', 'Updated description', 'Dry run did not modify');
      // 4. Update with backup
      run(dir, `node ${cli} update ./output/test-update-skill --desc "Final description" --non-interactive`);
      assertContains(dir, 'output/test-update-skill/SKILL.md', 'Final description', 'Final description');
      // Verify backup was created
      const entries = readdirSync(resolve(dir, 'output'));
      const backup = entries.find(e => e.startsWith('test-update-skill.backup-'));
      if (!backup) throw new Error('Backup directory not created');
      console.log('  Backup directory created');
      // Validate the final skill
      run(dir, `node ${cli} validate ./output/test-update-skill`);
    },
  },
  'test13-auto-detect': {
    title: 'Test 13: Auto-detect Project Type',
    run(dir) {
      clean(dir, 'output');
      const projectDir = resolve(dir, 'project');
      // Generate skill with --auto from the simulated project directory
      run(projectDir, `node ${cli} init --auto --name test-auto-skill --desc "Auto-detected skill" --output ${resolve(dir, 'output')} --non-interactive`);
      // Validate
      run(dir, `node ${cli} validate ./output/test-auto-skill`);
      // Verify fullstack type was detected (Next.js + Prisma)
      assertContains(dir, 'output/test-auto-skill/SKILL.md', 'Next.js', 'Detected Next.js framework');
      assertContains(dir, 'output/test-auto-skill/SKILL.md', 'prisma', 'Detected Prisma ORM');
      // Verify metadata
      const metaContent = readFileSync(resolve(dir, 'output/test-auto-skill/.skillgen.json'), 'utf-8');
      const meta = JSON.parse(metaContent);
      if (meta.templateType !== 'fullstack') throw new Error(`Expected templateType=fullstack, got ${meta.templateType}`);
      if (meta.autoDetected !== true) throw new Error('Expected autoDetected=true');
      console.log('  Metadata: fullstack + autoDetected');
    },
  },
  'test14-import': {
    title: 'Test 14: Import AI Instruction Files',
    run(dir) {
      clean(dir, 'output');
      clean(dir, 'output-scan');
      // 1. Import a specific .cursorrules file
      run(dir, `node ${cli} import ./fixtures/.cursorrules --name imported-cursor --desc "Imported from Cursor" --output ./output --non-interactive`);
      run(dir, `node ${cli} validate ./output/imported-cursor`);
      assertContains(dir, 'output/imported-cursor/SKILL.md', 'imported-cursor', 'Skill name in frontmatter');
      // Verify metadata
      const metaContent = readFileSync(resolve(dir, 'output/imported-cursor/.skillgen.json'), 'utf-8');
      const meta = JSON.parse(metaContent);
      if (meta.source !== 'imported') throw new Error('Metadata source should be imported');
      if (meta.importSourceFormat !== 'cursorrules') throw new Error('Metadata should have cursorrules format');
      console.log('  Import metadata valid');
      // Verify content was preserved
      assertContains(dir, 'output/imported-cursor/SKILL.md', 'functional components', 'Content preserved');
      // 2. Import with --scan from fixtures directory (which has .cursorrules and CLAUDE.md)
      run(resolve(dir, 'fixtures'), `node ${cli} import --scan --output ${resolve(dir, 'output-scan')} --non-interactive`);
      assertDir(dir, 'output-scan/cursor-rules', 'Cursor rules skill from scan');
      assertDir(dir, 'output-scan/claude-instructions', 'Claude instructions skill from scan');
      // Validate scan results
      run(dir, `node ${cli} validate ./output-scan/cursor-rules`);
      run(dir, `node ${cli} validate ./output-scan/claude-instructions`);
    },
  },
};

// --- helpers ---

function run(cwd, cmd) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function clean(dir, name) {
  const target = resolve(dir, name);
  if (existsSync(target)) {
    console.log(`Cleaning up ${name}...`);
    rmSync(target, { recursive: true, force: true });
  }
}

function assertDir(dir, rel, label) {
  if (existsSync(resolve(dir, rel))) {
    console.log(`  ${label} exists`);
  } else {
    throw new Error(`${label} missing`);
  }
}

function assertFile(dir, rel, label) {
  if (existsSync(resolve(dir, rel))) {
    console.log(`  ${label} created`);
  } else {
    throw new Error(`${label} missing`);
  }
}

function assertContains(dir, rel, search, label) {
  const content = readFileSync(resolve(dir, rel), 'utf-8');
  if (content.includes(search)) {
    console.log(`  ${label} found`);
  } else {
    throw new Error(`${label} missing in ${rel}`);
  }
}

// --- main ---

const testName = process.argv[2];

if (testName === '--all') {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const [name, test] of Object.entries(tests)) {
    console.log(`\n${'='.repeat(42)}`);
    console.log(test.title);
    console.log('='.repeat(42));
    try {
      test.run(resolve(__dirname, name));
      console.log(`\n  PASSED`);
      passed++;
    } catch (err) {
      console.error(`\n  FAILED: ${err.message}`);
      failed++;
      failures.push(name);
    }
  }

  console.log(`\n${'='.repeat(42)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log(`Failed: ${failures.join(', ')}`);
    process.exit(1);
  }
} else if (tests[testName]) {
  const test = tests[testName];
  console.log(`\n${'='.repeat(42)}`);
  console.log(test.title);
  console.log('='.repeat(42));
  try {
    test.run(resolve(__dirname, testName));
    console.log(`\n  PASSED`);
  } catch (err) {
    console.error(`\n  FAILED: ${err.message}`);
    process.exit(1);
  }
} else {
  console.error(`Unknown test: ${testName}`);
  console.error(`Available: ${Object.keys(tests).join(', ')}, --all`);
  process.exit(1);
}
