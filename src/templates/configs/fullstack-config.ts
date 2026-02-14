import type { TemplateConfig } from './frontend-config.js';

export const fullstackConfig: TemplateConfig = {
  name: 'Full-Stack App',
  description: 'Full-stack application with frontend, API routes, and database',
  questions: [
    {
      name: 'framework',
      message: 'Full-stack framework?',
      type: 'select',
      choices: [
        { name: 'Next.js', value: 'nextjs', description: 'React meta-framework' },
        { name: 'Nuxt', value: 'nuxt', description: 'Vue meta-framework' },
        { name: 'Remix', value: 'remix', description: 'React with loaders/actions' },
        { name: 'SvelteKit', value: 'sveltekit', description: 'Svelte meta-framework' },
      ],
      default: 'nextjs',
    },
    {
      name: 'database',
      message: 'Database?',
      type: 'select',
      choices: [
        { name: 'PostgreSQL', value: 'postgres', description: 'Relational, open source' },
        { name: 'MongoDB', value: 'mongodb', description: 'NoSQL document store' },
        { name: 'SQLite', value: 'sqlite', description: 'File-based, simple' },
      ],
      default: 'postgres',
    },
    {
      name: 'orm',
      message: 'ORM?',
      type: 'select',
      choices: [
        { name: 'Prisma', value: 'prisma', description: 'Type-safe, auto-generated client' },
        { name: 'Drizzle', value: 'drizzle', description: 'Lightweight, SQL-like' },
        { name: 'Mongoose', value: 'mongoose', description: 'MongoDB ODM' },
        { name: 'TypeORM', value: 'typeorm', description: 'Decorator-based ORM' },
      ],
      default: 'prisma',
    },
    {
      name: 'auth',
      message: 'Authentication?',
      type: 'select',
      choices: [
        { name: 'NextAuth.js / Auth.js', value: 'authjs', description: 'Built-in auth for Next.js/SvelteKit' },
        { name: 'Clerk', value: 'clerk', description: 'Drop-in auth UI and management' },
        { name: 'Lucia', value: 'lucia', description: 'Session-based, framework-agnostic' },
        { name: 'None', value: 'none', description: 'No authentication' },
      ],
      default: 'authjs',
    },
    {
      name: 'styling',
      message: 'Styling?',
      type: 'select',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first' },
        { name: 'CSS Modules', value: 'css-modules', description: 'Scoped CSS' },
        { name: 'Styled Components', value: 'styled-components', description: 'CSS-in-JS' },
      ],
      default: 'tailwind',
    },
    {
      name: 'stateManagement',
      message: 'Client state management?',
      type: 'select',
      choices: [
        { name: 'Zustand', value: 'zustand', description: 'Simple, minimalist (React)' },
        { name: 'Pinia', value: 'pinia', description: 'Vue official store' },
        { name: 'Jotai', value: 'jotai', description: 'Atomic state (React)' },
        { name: 'None', value: 'none', description: 'Framework defaults only' },
      ],
      default: 'zustand',
    },
    {
      name: 'testing',
      message: 'Testing?',
      type: 'select',
      choices: [
        { name: 'Vitest + Playwright', value: 'vitest-playwright', description: 'Unit + E2E' },
        { name: 'Jest + Cypress', value: 'jest-cypress', description: 'Unit + E2E (legacy standard)' },
        { name: 'Vitest only', value: 'vitest', description: 'Unit tests only' },
        { name: 'None', value: 'none', description: 'Configure later' },
      ],
      default: 'vitest-playwright',
    },
  ],
  variables: {
    installCommand: (answers) => {
      const deps: string[] = [];
      const framework = (answers.framework as string) || 'nextjs';
      const orm = (answers.orm as string) || 'prisma';
      const auth = (answers.auth as string) || 'authjs';
      const styling = (answers.styling as string) || 'tailwind';
      const state = (answers.stateManagement as string) || 'zustand';
      const testing = (answers.testing as string) || 'vitest-playwright';

      if (framework === 'nextjs') deps.push('npx create-next-app@latest');
      if (framework === 'nuxt') deps.push('npx nuxi@latest init');
      if (framework === 'remix') deps.push('npx create-remix@latest');
      if (framework === 'sveltekit') deps.push('npx sv create');

      if (orm === 'prisma') deps.push('npm install prisma @prisma/client');
      if (orm === 'drizzle') deps.push('npm install drizzle-orm drizzle-kit');
      if (orm === 'mongoose') deps.push('npm install mongoose');
      if (orm === 'typeorm') deps.push('npm install typeorm reflect-metadata');

      if (auth === 'authjs') deps.push('npm install next-auth');
      if (auth === 'clerk') deps.push('npm install @clerk/nextjs');
      if (auth === 'lucia') deps.push('npm install lucia');

      if (styling === 'tailwind') deps.push('npm install -D tailwindcss postcss autoprefixer');
      if (styling === 'styled-components') deps.push('npm install styled-components');

      if (state === 'zustand') deps.push('npm install zustand');
      if (state === 'pinia') deps.push('npm install pinia');
      if (state === 'jotai') deps.push('npm install jotai');

      if (testing === 'vitest-playwright') deps.push('npm install -D vitest @playwright/test');
      if (testing === 'jest-cypress') deps.push('npm install -D jest cypress');
      if (testing === 'vitest') deps.push('npm install -D vitest');

      return deps.join('\n');
    },
    stackSummary: (answers) => {
      const framework = (answers.framework as string) || 'nextjs';
      const orm = (answers.orm as string) || 'prisma';
      const auth = (answers.auth as string) || 'authjs';
      return `${framework} + ${orm} + ${auth}`;
    },
    ormSetup: (answers) => {
      const orm = (answers.orm as string) || 'prisma';
      switch (orm) {
        case 'prisma': return 'npx prisma init && npx prisma generate';
        case 'drizzle': return 'npx drizzle-kit generate && npx drizzle-kit push';
        case 'mongoose': return 'Define schemas in src/models/';
        case 'typeorm': return 'Configure data-source.ts with entity paths';
        default: return '';
      }
    },
  },
};
