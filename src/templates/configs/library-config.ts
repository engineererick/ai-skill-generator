import type { TemplateConfig } from './frontend-config.js';

export const libraryConfig: TemplateConfig = {
  name: 'Shared Library',
  description: 'Utility library without framework dependencies',
  questions: [
    {
      name: 'language',
      message: 'Primary language?',
      type: 'select',
      choices: [
        { name: 'TypeScript', value: 'typescript', description: 'Typed JavaScript' },
        { name: 'JavaScript', value: 'javascript', description: 'Vanilla JS' },
        { name: 'Python', value: 'python', description: 'Python 3.x' },
        { name: 'Go', value: 'go', description: 'Go (Golang)' },
        { name: 'Rust', value: 'rust', description: 'Rust' },
      ],
      default: 'typescript',
    },
    {
      name: 'testing',
      message: 'Testing framework?',
      type: 'select',
      choices: [
        { name: 'Vitest', value: 'vitest', description: 'Fast, modern' },
        { name: 'Jest', value: 'jest', description: 'Industry standard' },
        { name: 'Mocha', value: 'mocha', description: 'Flexible' },
        { name: 'Node Test Runner', value: 'node', description: 'Node.js built-in' },
        { name: 'None', value: 'none', description: 'No tests' },
      ],
      default: 'vitest',
    },
  ],
  variables: {
    languageLabel: (answers) => {
      const labels: Record<string, string> = {
        typescript: 'TypeScript',
        javascript: 'JavaScript',
        python: 'Python',
        go: 'Go',
        rust: 'Rust',
      };
      return labels[answers.language as string] || 'TypeScript';
    },
  },
};
