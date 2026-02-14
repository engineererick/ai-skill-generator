import type { CustomTemplateValidationResult } from './types.js';

const VALID_QUESTION_TYPES = ['select', 'input', 'confirm', 'multiselect'];
const WHEN_PATTERN = /^(\w+)(\s*(===|!==)\s*(['"].+['"]|true|false)\s*)?$/;

export function validateCustomTemplate(
  raw: unknown,
  filePath: string
): CustomTemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Template must be a YAML object'], warnings };
  }

  const obj = raw as Record<string, unknown>;

  // Derive template id from filename
  const filename = filePath.replace(/\\/g, '/').split('/').pop() ?? '';
  const templateId = filename.replace(/\.(ya?ml)$/i, '');

  // Required fields
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('Missing or invalid "name" field (must be a string)');
  }

  if (!obj.description || typeof obj.description !== 'string') {
    errors.push('Missing or invalid "description" field (must be a string)');
  }

  if (obj.version !== undefined && typeof obj.version !== 'string') {
    errors.push('"version" must be a string if provided');
  }

  if (obj.author !== undefined && typeof obj.author !== 'string') {
    errors.push('"author" must be a string if provided');
  }

  // Content validation
  if (!obj.content || typeof obj.content !== 'object') {
    errors.push('Missing or invalid "content" field (must be an object)');
  } else {
    const content = obj.content as Record<string, unknown>;
    if (!content['SKILL.md'] || typeof content['SKILL.md'] !== 'string') {
      errors.push('Missing or invalid "content.SKILL.md" (must be a non-empty string)');
    }

    // Validate optional sub-directories
    for (const dir of ['references/', 'scripts/', 'assets/']) {
      if (content[dir] !== undefined) {
        if (typeof content[dir] !== 'object' || content[dir] === null) {
          errors.push(`"content.${dir}" must be an object mapping filenames to template strings`);
        } else {
          const dirContent = content[dir] as Record<string, unknown>;
          for (const [fname, val] of Object.entries(dirContent)) {
            if (typeof val !== 'string') {
              errors.push(`"content.${dir}${fname}" must be a string`);
            }
          }
        }
      }
    }
  }

  // Questions validation
  const definedQuestionNames = new Set<string>();
  if (obj.questions !== undefined) {
    if (!Array.isArray(obj.questions)) {
      errors.push('"questions" must be an array');
    } else {
      for (let i = 0; i < obj.questions.length; i++) {
        const q = obj.questions[i];
        const prefix = `questions[${i}]`;

        if (!q || typeof q !== 'object') {
          errors.push(`${prefix}: must be an object`);
          continue;
        }

        if (!q.name || typeof q.name !== 'string') {
          errors.push(`${prefix}: missing or invalid "name"`);
        } else {
          if (definedQuestionNames.has(q.name)) {
            warnings.push(`${prefix}: duplicate question name "${q.name}"`);
          }
          definedQuestionNames.add(q.name);
        }

        if (!q.message || typeof q.message !== 'string') {
          errors.push(`${prefix}: missing or invalid "message"`);
        }

        if (!q.type || !VALID_QUESTION_TYPES.includes(q.type)) {
          errors.push(`${prefix}: invalid "type" (must be one of: ${VALID_QUESTION_TYPES.join(', ')})`);
        }

        // Choices required for select/multiselect
        if ((q.type === 'select' || q.type === 'multiselect')) {
          if (!q.choices || !Array.isArray(q.choices) || q.choices.length === 0) {
            errors.push(`${prefix}: "choices" required and must be non-empty for ${q.type}`);
          } else {
            for (let j = 0; j < q.choices.length; j++) {
              const c = q.choices[j];
              if (!c || typeof c !== 'object' || !c.name || !c.value) {
                errors.push(`${prefix}.choices[${j}]: must have "name" and "value"`);
              }
            }
          }
        }

        // Validate when expression syntax
        if (q.when !== undefined) {
          if (typeof q.when !== 'string') {
            errors.push(`${prefix}: "when" must be a string expression`);
          } else if (!WHEN_PATTERN.test(q.when.trim())) {
            warnings.push(`${prefix}: "when" expression "${q.when}" may not be parseable (expected: "varName", "var === 'val'", or "var !== 'val'")`);
          }
        }
      }
    }
  }

  // Variables validation
  if (obj.variables !== undefined) {
    if (typeof obj.variables !== 'object' || obj.variables === null || Array.isArray(obj.variables)) {
      errors.push('"variables" must be an object mapping names to template strings');
    } else {
      for (const [key, val] of Object.entries(obj.variables as Record<string, unknown>)) {
        if (typeof val !== 'string') {
          errors.push(`variables.${key}: must be a string`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    templateId: errors.length === 0 ? templateId : undefined,
  };
}
