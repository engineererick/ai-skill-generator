import fs from 'fs/promises';
import path from 'path';
import type { PackageJsonData, DetectionEvidence } from './types.js';

// --- Dependency → template answer mappings ---

interface DepMapping {
  field: string;
  value: string | boolean;
  typeHint?: string;
}

const FRAMEWORK_DEPS: Record<string, { typeHint: string; field?: string; value?: string }> = {
  'next': { typeHint: 'fullstack-or-frontend', field: 'framework', value: 'nextjs' },
  'nuxt': { typeHint: 'fullstack-or-frontend', field: 'framework', value: 'nuxt' },
  '@remix-run/react': { typeHint: 'fullstack-or-frontend', field: 'framework', value: 'remix' },
  '@sveltejs/kit': { typeHint: 'fullstack-or-frontend', field: 'framework', value: 'sveltekit' },
  '@nestjs/core': { typeHint: 'microservice' },
  'express': { typeHint: 'api', field: 'framework', value: 'express' },
  'fastify': { typeHint: 'api', field: 'framework', value: 'fastify' },
  'hono': { typeHint: 'api', field: 'framework', value: 'hono' },
  'koa': { typeHint: 'api', field: 'framework', value: 'koa' },
};

const TECH_DEPS: Record<string, DepMapping> = {
  // UI Libraries
  '@shadcn/ui': { field: 'uiLibrary', value: 'shadcn' },
  '@mui/material': { field: 'uiLibrary', value: 'mui' },
  '@chakra-ui/react': { field: 'uiLibrary', value: 'chakra' },
  '@headlessui/react': { field: 'uiLibrary', value: 'headless' },
  // State Management
  'zustand': { field: 'stateManagement', value: 'zustand' },
  '@reduxjs/toolkit': { field: 'stateManagement', value: 'redux' },
  'jotai': { field: 'stateManagement', value: 'jotai' },
  'pinia': { field: 'stateManagement', value: 'pinia' },
  // Forms
  'react-hook-form': { field: 'forms', value: 'react-hook-form' },
  '@tanstack/react-form': { field: 'forms', value: 'tanstack-form' },
  'formik': { field: 'forms', value: 'formik' },
  // Data Fetching
  '@tanstack/react-query': { field: 'dataFetching', value: 'tanstack-query' },
  'swr': { field: 'dataFetching', value: 'swr' },
  // Styling
  'tailwindcss': { field: 'styling', value: 'tailwind' },
  'styled-components': { field: 'styling', value: 'styled-components' },
  // ORM / Database
  'prisma': { field: 'orm', value: 'prisma' },
  '@prisma/client': { field: 'orm', value: 'prisma' },
  'drizzle-orm': { field: 'orm', value: 'drizzle' },
  'mongoose': { field: 'orm', value: 'mongoose' },
  'typeorm': { field: 'orm', value: 'typeorm' },
  // Auth
  'next-auth': { field: 'auth', value: 'authjs' },
  '@clerk/nextjs': { field: 'auth', value: 'clerk' },
  'lucia': { field: 'auth', value: 'lucia' },
  'jsonwebtoken': { field: 'auth', value: 'jwt' },
  'passport': { field: 'auth', value: 'oauth' },
  // Validation
  'zod': { field: 'validation', value: 'zod' },
  'joi': { field: 'validation', value: 'joi' },
  'yup': { field: 'validation', value: 'yup' },
  // Testing
  'vitest': { field: 'testing', value: 'vitest' },
  'jest': { field: 'testing', value: 'jest' },
  '@playwright/test': { field: 'testing', value: 'vitest-playwright', typeHint: 'fullstack' },
  'cypress': { field: 'testing', value: 'jest-cypress', typeHint: 'fullstack' },
  // Misc
  '@storybook/react': { field: 'includeStorybook', value: true },
};

// Database driver → database field mapping (for microservice template)
const DB_DRIVER_DEPS: Record<string, string> = {
  'pg': 'postgres',
  'mssql': 'sqlserver',
  'mysql2': 'mysql',
  'mongodb': 'mongodb',
  'better-sqlite3': 'sqlite',
};

// --- Scanner functions ---

export async function readPackageJson(cwd: string): Promise<PackageJsonData | null> {
  try {
    const content = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8');
    return JSON.parse(content) as PackageJsonData;
  } catch {
    return null;
  }
}

export function scanDependencies(pkg: PackageJsonData): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Framework detection
  for (const [dep, mapping] of Object.entries(FRAMEWORK_DEPS)) {
    if (dep in allDeps) {
      const implies = mapping.field
        ? `type=${mapping.typeHint}, ${mapping.field}=${mapping.value}`
        : `type=${mapping.typeHint}`;
      evidence.push({
        source: `${dep} dependency`,
        implies,
        category: 'dependency',
      });
    }
  }

  // Technology detection
  for (const [dep, mapping] of Object.entries(TECH_DEPS)) {
    if (dep in allDeps) {
      evidence.push({
        source: `${dep} dependency`,
        implies: `${mapping.field}=${String(mapping.value)}`,
        category: 'dependency',
      });
    }
  }

  // Database driver detection
  for (const [dep, dbType] of Object.entries(DB_DRIVER_DEPS)) {
    if (dep in allDeps) {
      evidence.push({
        source: `${dep} dependency`,
        implies: `database-driver=${dbType}`,
        category: 'dependency',
      });
    }
  }

  return evidence;
}

async function exists(fullPath: string): Promise<boolean> {
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function scanConfigFiles(cwd: string): Promise<DetectionEvidence[]> {
  const evidence: DetectionEvidence[] = [];

  const checks: { patterns: string[]; implies: string }[] = [
    { patterns: ['next.config.js', 'next.config.mjs', 'next.config.ts'], implies: 'framework=nextjs' },
    { patterns: ['nuxt.config.js', 'nuxt.config.ts'], implies: 'framework=nuxt' },
    { patterns: ['svelte.config.js', 'svelte.config.ts'], implies: 'framework=sveltekit' },
    { patterns: ['nest-cli.json'], implies: 'type=microservice' },
    { patterns: ['Dockerfile'], implies: 'containerization=docker, includeDocker=true' },
    { patterns: ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'], implies: 'orchestration=docker-compose' },
    { patterns: ['.gitlab-ci.yml'], implies: 'cicd=gitlab-ci' },
    { patterns: ['Jenkinsfile'], implies: 'cicd=jenkins' },
    { patterns: ['tsconfig.json'], implies: 'language=typescript' },
  ];

  for (const check of checks) {
    for (const pattern of check.patterns) {
      if (await exists(path.join(cwd, pattern))) {
        evidence.push({
          source: pattern,
          implies: check.implies,
          category: 'config-file',
        });
        break; // Only one match per check group
      }
    }
  }

  // Directory-based config checks
  if (await exists(path.join(cwd, '.github', 'workflows'))) {
    evidence.push({ source: '.github/workflows/', implies: 'cicd=github-actions', category: 'config-file' });
  }
  if (await exists(path.join(cwd, 'prisma', 'schema.prisma'))) {
    evidence.push({ source: 'prisma/schema.prisma', implies: 'orm=prisma', category: 'config-file' });
  }
  if (await exists(path.join(cwd, 'drizzle.config.ts')) || await exists(path.join(cwd, 'drizzle.config.js'))) {
    evidence.push({ source: 'drizzle.config.*', implies: 'orm=drizzle', category: 'config-file' });
  }

  return evidence;
}

export async function scanFolderStructure(cwd: string): Promise<DetectionEvidence[]> {
  const evidence: DetectionEvidence[] = [];

  const checks: { dir: string; implies: string }[] = [
    { dir: 'src/app', implies: 'Next.js App Router' },
    { dir: 'src/modules', implies: 'NestJS modular structure' },
    { dir: 'src/components', implies: 'frontend-hint' },
    { dir: 'terraform', implies: 'iac=terraform, type-hint=devops' },
    { dir: 'k8s', implies: 'orchestration=kubernetes' },
    { dir: 'kubernetes', implies: 'orchestration=kubernetes' },
    { dir: 'infrastructure', implies: 'type-hint=devops' },
  ];

  for (const check of checks) {
    if (await exists(path.join(cwd, check.dir))) {
      evidence.push({
        source: `${check.dir}/`,
        implies: check.implies,
        category: 'folder-structure',
      });
    }
  }

  // Check for clean architecture pattern
  const cleanArchDirs = ['src/domain', 'src/application', 'src/infrastructure'];
  const cleanArchCount = (await Promise.all(
    cleanArchDirs.map(d => exists(path.join(cwd, d)))
  )).filter(Boolean).length;

  if (cleanArchCount >= 2) {
    evidence.push({
      source: 'src/domain/ + src/application/ + src/infrastructure/',
      implies: 'architecture=clean',
      category: 'folder-structure',
    });
  }

  // Check for .tf files in root (Terraform)
  try {
    const rootFiles = await fs.readdir(cwd);
    if (rootFiles.some(f => f.endsWith('.tf'))) {
      evidence.push({
        source: '*.tf files',
        implies: 'iac=terraform, type-hint=devops',
        category: 'folder-structure',
      });
    }
  } catch {
    // Ignore readdir errors
  }

  return evidence;
}
