import type { TemplateConfig } from './frontend-config.js';

export const microserviceConfig: TemplateConfig = {
  name: 'NestJS Microservice',
  description: 'NestJS microservice with configurable architecture',
  questions: [
    {
      name: 'database',
      message: 'Primary database?',
      type: 'select',
      choices: [
        { name: 'SQL Server (TypeORM)', value: 'typeorm-sqlserver', description: 'Relational database' },
        { name: 'PostgreSQL (TypeORM)', value: 'typeorm-postgres', description: 'Open source relational' },
        { name: 'MongoDB (Mongoose)', value: 'mongoose', description: 'NoSQL document store' },
        { name: 'MySQL (TypeORM)', value: 'typeorm-mysql', description: 'Popular for web' },
      ],
      default: 'typeorm-sqlserver',
    },
    {
      name: 'architecture',
      message: 'Architecture pattern?',
      type: 'select',
      choices: [
        { name: 'Clean Architecture (DDD)', value: 'clean', description: 'Domain/Application/Infrastructure/Presentation' },
        { name: 'Modular Standard', value: 'modular', description: 'Traditional NestJS modules' },
        { name: 'Hexagonal', value: 'hexagonal', description: 'Ports and Adapters' },
      ],
      default: 'clean',
    },
    {
      name: 'communication',
      message: 'Inter-service communication?',
      type: 'multiselect',
      choices: [
        { name: 'REST API', value: 'rest', description: 'Traditional HTTP/REST' },
        { name: 'gRPC', value: 'grpc', description: 'High performance, strong contracts' },
        { name: 'Message Queue (RabbitMQ)', value: 'rabbitmq', description: 'Async messaging' },
        { name: 'Redis Pub/Sub', value: 'redis', description: 'Real-time events' },
      ],
      default: ['rest'],
    },
    {
      name: 'authentication',
      message: 'Authentication?',
      type: 'select',
      choices: [
        { name: 'Internal JWT', value: 'jwt-internal', description: 'Self-contained implementation' },
        { name: 'Auth Service Integration', value: 'auth-service', description: 'External auth service' },
        { name: 'API Keys', value: 'api-keys', description: 'Simple API key auth' },
        { name: 'None', value: 'none', description: 'Public or external auth' },
      ],
      default: 'jwt-internal',
    },
    {
      name: 'documentation',
      message: 'API documentation?',
      type: 'select',
      choices: [
        { name: 'Swagger (OpenAPI)', value: 'swagger', description: 'Interactive documentation' },
        { name: 'Compodoc', value: 'compodoc', description: 'Code documentation' },
        { name: 'Both', value: 'both', description: 'Swagger + Compodoc' },
        { name: 'None', value: 'none', description: 'No auto-generated docs' },
      ],
      default: 'swagger',
    },
    {
      name: 'testing',
      message: 'Testing?',
      type: 'select',
      choices: [
        { name: 'Jest (full)', value: 'jest', description: 'Unit + E2E with Jest' },
        { name: 'Vitest', value: 'vitest', description: 'Fast alternative to Jest' },
        { name: 'Basic', value: 'basic', description: 'Basic unit tests only' },
        { name: 'Skip', value: 'none', description: 'Configure later' },
      ],
      default: 'jest',
    },
    {
      name: 'includeDocker',
      message: 'Include Dockerfile?',
      type: 'confirm',
      default: true,
    },
  ],
  variables: {
    dbConnection: (answers) => {
      const db = answers.database as string;
      switch (db) {
        case 'typeorm-sqlserver':
          return 'sqlserver://username:password@host:1433/database';
        case 'typeorm-postgres':
          return 'postgresql://username:password@host:5432/database';
        case 'typeorm-mysql':
          return 'mysql://username:password@host:3306/database';
        case 'mongoose':
          return 'mongodb://username:password@host:27017/database';
        default:
          return '';
      }
    },
    architectureDescription: (answers) => {
      const arch = answers.architecture as string;
      const descriptions: Record<string, string> = {
        clean: 'Clean Architecture with Domain, Application, Infrastructure, and Presentation separation',
        modular: 'Standard NestJS modular architecture',
        hexagonal: 'Hexagonal Architecture with Ports and Adapters',
      };
      return descriptions[arch] || '';
    },
  },
};
