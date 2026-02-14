/**
 * Lightweight template rendering engine.
 * Supports: {{variable}}, {{#if condition}}...{{/if}}, {{#if var === 'val'}}...{{/if}}
 */

const IF_BLOCK = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
const VAR_TOKEN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
const TRIPLE_BLANK = /\n{3,}/g;

export function renderTemplate(
  template: string,
  context: Record<string, string>
): string {
  let result = template;

  // Step 1: Process {{#if}}...{{/if}} blocks (iterative, up to 5 passes for nesting)
  for (let pass = 0; pass < 5; pass++) {
    const before = result;
    result = result.replace(IF_BLOCK, (_, condition: string, body: string) => {
      return evaluateCondition(condition.trim(), context) ? body : '';
    });
    if (result === before) break;
  }

  // Step 2: Replace {{variable}} tokens
  result = result.replace(VAR_TOKEN, (_, key: string) => context[key] ?? '');

  // Step 3: Collapse 3+ consecutive blank lines to 2
  result = result.replace(TRIPLE_BLANK, '\n\n');

  return result;
}

/**
 * Interpolates simple {{token}} references in a string using a context map.
 * Used for YAML variable values that reference answer keys.
 */
export function interpolateSimple(
  expr: string,
  context: Record<string, string>
): string {
  return expr.replace(VAR_TOKEN, (_, key: string) => context[key] ?? '');
}

/**
 * Evaluates a "when" string expression for conditional questions.
 * Supports: "varName" (truthy), "var === 'val'", "var !== 'val'"
 */
export function evaluateWhenExpression(
  expr: string,
  answers: Record<string, unknown>
): boolean {
  return evaluateCondition(expr, answers as Record<string, string>);
}

function evaluateCondition(
  expr: string,
  context: Record<string, string | unknown>
): boolean {
  // Strict equality: variable === 'value'
  const eqMatch = expr.match(/^(\w+)\s*===\s*['"](.+)['"]\s*$/);
  if (eqMatch) {
    return String(context[eqMatch[1]] ?? '') === eqMatch[2];
  }

  // Strict inequality: variable !== 'value'
  const neqMatch = expr.match(/^(\w+)\s*!==\s*['"](.+)['"]\s*$/);
  if (neqMatch) {
    return String(context[neqMatch[1]] ?? '') !== neqMatch[2];
  }

  // Boolean comparison: variable === true / variable === false
  const boolMatch = expr.match(/^(\w+)\s*===\s*(true|false)\s*$/);
  if (boolMatch) {
    const val = context[boolMatch[1]];
    const expected = boolMatch[2] === 'true';
    if (typeof val === 'boolean') return val === expected;
    return (String(val) === 'true') === expected;
  }

  // Truthiness check: just a variable name
  const trimmed = expr.trim();
  const val = context[trimmed];
  if (val === undefined || val === null || val === false || val === '' || val === 'false') {
    return false;
  }
  return true;
}
