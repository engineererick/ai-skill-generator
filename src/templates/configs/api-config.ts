import type { TemplateConfig } from './frontend-config.js';

export const apiConfig: TemplateConfig = {
  name: 'REST API',
  description: 'REST API with configurable framework, database, and auth',
  questions: [
    {
      name: 'framework',
      message: 'API framework?',
      type: 'select',
      choices: [
        { name: 'Express', value: 'express', description: 'Minimalist, widely adopted' },
        { name: 'Fastify', value: 'fastify', description: 'High performance, schema-based' },
        { name: 'Hono', value: 'hono', description: 'Ultrafast, edge-ready' },
        { name: 'Koa', value: 'koa', description: 'Lightweight, middleware-based' },
      ],
      default: 'express',
    },
    {
      name: 'database',
      message: 'Database?',
      type: 'select',
      choices: [
        { name: 'PostgreSQL', value: 'postgres', description: 'Relational, open source' },
        { name: 'MongoDB', value: 'mongodb', description: 'NoSQL document store' },
        { name: 'SQLite', value: 'sqlite', description: 'File-based, zero config' },
        { name: 'None', value: 'none', description: 'No database integration' },
      ],
      default: 'postgres',
    },
    {
      name: 'orm',
      message: 'ORM / query builder?',
      type: 'select',
      choices: [
        { name: 'Prisma', value: 'prisma', description: 'Type-safe ORM' },
        { name: 'Drizzle', value: 'drizzle', description: 'Lightweight, SQL-like' },
        { name: 'Mongoose', value: 'mongoose', description: 'MongoDB ODM' },
        { name: 'None', value: 'none', description: 'Raw queries' },
      ],
      default: 'prisma',
      when: (answers) => answers.database !== 'none',
    },
    {
      name: 'auth',
      message: 'Authentication?',
      type: 'select',
      choices: [
        { name: 'JWT', value: 'jwt', description: 'Stateless token-based' },
        { name: 'Session', value: 'session', description: 'Server-side sessions' },
        { name: 'OAuth 2.0', value: 'oauth', description: 'Third-party providers' },
        { name: 'None', value: 'none', description: 'No authentication' },
      ],
      default: 'jwt',
    },
    {
      name: 'validation',
      message: 'Validation library?',
      type: 'select',
      choices: [
        { name: 'Zod', value: 'zod', description: 'TypeScript-first schema validation' },
        { name: 'Joi', value: 'joi', description: 'Powerful object validation' },
        { name: 'Yup', value: 'yup', description: 'Simple schema validation' },
        { name: 'None', value: 'none', description: 'Manual validation' },
      ],
      default: 'zod',
    },
    {
      name: 'documentation',
      message: 'API documentation?',
      type: 'select',
      choices: [
        { name: 'Swagger (OpenAPI)', value: 'swagger', description: 'Interactive API docs' },
        { name: 'None', value: 'none', description: 'No auto-generated docs' },
      ],
      default: 'swagger',
    },
    {
      name: 'testing',
      message: 'Testing?',
      type: 'select',
      choices: [
        { name: 'Vitest', value: 'vitest', description: 'Fast, modern' },
        { name: 'Jest', value: 'jest', description: 'Industry standard' },
        { name: 'None', value: 'none', description: 'Configure later' },
      ],
      default: 'vitest',
    },
  ],
  variables: {
    installCommand: (answers) => {
      const deps: string[] = [];
      const framework = (answers.framework as string) || 'express';
      const database = (answers.database as string) || 'postgres';
      const orm = (answers.orm as string) || 'prisma';
      const auth = (answers.auth as string) || 'jwt';
      const validation = (answers.validation as string) || 'zod';
      const testing = (answers.testing as string) || 'vitest';

      if (framework === 'express') deps.push('npm install express cors helmet morgan');
      if (framework === 'fastify') deps.push('npm install fastify @fastify/cors @fastify/helmet');
      if (framework === 'hono') deps.push('npm install hono');
      if (framework === 'koa') deps.push('npm install koa @koa/router koa-body');

      if (database !== 'none') {
        if (orm === 'prisma') deps.push('npm install prisma @prisma/client');
        else if (orm === 'drizzle') deps.push('npm install drizzle-orm drizzle-kit');
        else if (orm === 'mongoose') deps.push('npm install mongoose');
        else if (database === 'postgres') deps.push('npm install pg');
        else if (database === 'sqlite') deps.push('npm install better-sqlite3');
        else if (database === 'mongodb') deps.push('npm install mongodb');
      }

      if (auth === 'jwt') deps.push('npm install jsonwebtoken bcryptjs');
      if (auth === 'session') deps.push('npm install express-session connect-redis');
      if (auth === 'oauth') deps.push('npm install passport passport-google-oauth20');

      if (validation === 'zod') deps.push('npm install zod');
      if (validation === 'joi') deps.push('npm install joi');
      if (validation === 'yup') deps.push('npm install yup');

      if (testing === 'vitest') deps.push('npm install -D vitest supertest');
      if (testing === 'jest') deps.push('npm install -D jest ts-jest supertest @types/jest');

      return deps.join('\n');
    },
    dbConnection: (answers) => {
      const db = answers.database as string;
      switch (db) {
        case 'postgres': return 'postgresql://user:password@localhost:5432/mydb';
        case 'mongodb': return 'mongodb://localhost:27017/mydb';
        case 'sqlite': return './data/database.sqlite';
        default: return '';
      }
    },
    authMiddleware: (answers) => {
      const auth = answers.auth as string;
      switch (auth) {
        case 'jwt': return 'JWT Bearer token in Authorization header';
        case 'session': return 'Session cookie with server-side store';
        case 'oauth': return 'OAuth 2.0 via Passport.js strategies';
        default: return 'None';
      }
    },
  },
};
