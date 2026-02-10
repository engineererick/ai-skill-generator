export interface TemplateQuestion {
  name: string;
  message: string;
  type: 'select' | 'input' | 'confirm' | 'multiselect';
  choices?: { name: string; value: string; description?: string }[];
  default?: unknown;
  when?: (answers: Record<string, unknown>) => boolean;
}

export interface TemplateConfig {
  name: string;
  description: string;
  questions: TemplateQuestion[];
  variables: Record<string, (answers: Record<string, unknown>) => string>;
}

export const frontendConfig: TemplateConfig = {
  name: 'Frontend Next.js',
  description: 'Next.js application with configurable UI and state options',
  questions: [
    {
      name: 'uiLibrary',
      message: 'UI component library?',
      type: 'select',
      choices: [
        { name: 'shadcn/ui', value: 'shadcn', description: 'Tailwind-based components (recommended)' },
        { name: 'Material UI (MUI)', value: 'mui', description: 'Full Material Design components' },
        { name: 'Chakra UI', value: 'chakra', description: 'Modular and accessible components' },
        { name: 'Headless UI', value: 'headless', description: 'Unstyled components, maximum flexibility' },
      ],
      default: 'shadcn',
    },
    {
      name: 'stateManagement',
      message: 'Global state management?',
      type: 'select',
      choices: [
        { name: 'Zustand', value: 'zustand', description: 'Simple, minimalist' },
        { name: 'Redux Toolkit', value: 'redux', description: 'Robust, for complex apps' },
        { name: 'Jotai', value: 'jotai', description: 'Atomic, similar to Recoil' },
        { name: 'Context API', value: 'context', description: 'React built-in' },
      ],
      default: 'zustand',
    },
    {
      name: 'forms',
      message: 'Forms library?',
      type: 'select',
      choices: [
        { name: 'React Hook Form + Zod', value: 'react-hook-form', description: 'Performance + typed validation' },
        { name: 'TanStack Form', value: 'tanstack-form', description: 'Headless, framework-agnostic' },
        { name: 'Formik', value: 'formik', description: 'Popular, with built-in validation' },
      ],
      default: 'react-hook-form',
    },
    {
      name: 'dataFetching',
      message: 'Data fetching?',
      type: 'select',
      choices: [
        { name: 'TanStack Query (React Query)', value: 'tanstack-query', description: 'Standard for server state' },
        { name: 'SWR', value: 'swr', description: 'Lightweight, by Vercel' },
        { name: 'RTK Query', value: 'rtk-query', description: 'Integrated with Redux' },
      ],
      default: 'tanstack-query',
    },
    {
      name: 'styling',
      message: 'Styling solution?',
      type: 'select',
      choices: [
        { name: 'Tailwind CSS v4', value: 'tailwind', description: 'Utility-first (recommended)' },
        { name: 'CSS Modules', value: 'css-modules', description: 'Scoped CSS' },
        { name: 'Styled Components', value: 'styled-components', description: 'CSS-in-JS' },
      ],
      default: 'tailwind',
    },
    {
      name: 'includeStorybook',
      message: 'Include Storybook?',
      type: 'confirm',
      default: false,
    },
    {
      name: 'includeTesting',
      message: 'Include testing setup?',
      type: 'select',
      choices: [
        { name: 'Vitest + React Testing Library', value: 'vitest', description: 'Fast, modern' },
        { name: 'Jest + React Testing Library', value: 'jest', description: 'Industry standard' },
        { name: 'Skip tests', value: 'none', description: 'Configure later' },
      ],
      default: 'vitest',
    },
  ],
  variables: {
    stackSummary: (answers) => {
      const uiLibrary = (answers.uiLibrary as string) || 'shadcn';
      const stateManagement = (answers.stateManagement as string) || 'zustand';
      const dataFetching = (answers.dataFetching as string) || 'tanstack-query';
      return `${uiLibrary} + ${stateManagement} + ${dataFetching}`;
    },
    installCommand: (answers) => {
      const deps: string[] = [];
      const uiLibrary = (answers.uiLibrary as string) || 'shadcn';
      const stateManagement = (answers.stateManagement as string) || 'zustand';
      const forms = (answers.forms as string) || 'react-hook-form';
      const dataFetching = (answers.dataFetching as string) || 'tanstack-query';
      const styling = (answers.styling as string) || 'tailwind';

      if (uiLibrary === 'shadcn') deps.push('npx shadcn@latest init');
      if (uiLibrary === 'mui') deps.push('npm install @mui/material @emotion/react @emotion/styled');
      if (uiLibrary === 'chakra') deps.push('npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion');
      if (uiLibrary === 'headless') deps.push('npm install @headlessui/react');

      if (stateManagement === 'zustand') deps.push('npm install zustand');
      if (stateManagement === 'redux') deps.push('npm install @reduxjs/toolkit react-redux');
      if (stateManagement === 'jotai') deps.push('npm install jotai');

      if (forms === 'react-hook-form') deps.push('npm install react-hook-form zod @hookform/resolvers');
      if (forms === 'tanstack-form') deps.push('npm install @tanstack/react-form');
      if (forms === 'formik') deps.push('npm install formik yup');

      if (dataFetching === 'tanstack-query') deps.push('npm install @tanstack/react-query');
      if (dataFetching === 'swr') deps.push('npm install swr');

      if (styling === 'tailwind') deps.push('npm install -D tailwindcss postcss autoprefixer');
      if (styling === 'styled-components') deps.push('npm install styled-components');

      return deps.join('\n');
    },
  },
};
