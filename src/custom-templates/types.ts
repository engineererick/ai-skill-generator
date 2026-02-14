// Raw shape as parsed from YAML
export interface CustomTemplateYaml {
  name: string;
  description: string;
  version?: string;
  author?: string;
  questions?: CustomTemplateQuestionYaml[];
  variables?: Record<string, string>;
  content: {
    'SKILL.md': string;
    'references/'?: Record<string, string>;
    'scripts/'?: Record<string, string>;
    'assets/'?: Record<string, string>;
  };
}

// Question as stored in YAML (when clause is a string expression, not a function)
export interface CustomTemplateQuestionYaml {
  name: string;
  message: string;
  type: 'select' | 'input' | 'confirm' | 'multiselect';
  choices?: { name: string; value: string; description?: string }[];
  default?: unknown;
  when?: string;
}

// Resolved/usable form with discriminant
export interface CustomTemplateConfig {
  id: string;
  name: string;
  description: string;
  version?: string;
  author?: string;
  sourcePath: string;
  isCustom: true;
  questions: CustomTemplateQuestionYaml[];
  variables: Record<string, string>;
  content: CustomTemplateYaml['content'];
  jsVariables?: Record<string, (answers: Record<string, unknown>) => string>;
}

export interface CustomTemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  templateId?: string;
}
