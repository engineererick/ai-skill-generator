#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync } from 'node:fs';
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
