import assert from 'node:assert';
import { renderTemplate, evaluateWhenExpression, interpolateSimple } from '../src/custom-templates/renderer.js';

// Test 1: Basic variable substitution
{
  const result = renderTemplate('Hello {{name}}, welcome to {{place}}!', {
    name: 'World',
    place: 'Earth',
  });
  assert.strictEqual(result, 'Hello World, welcome to Earth!');
  console.log('  Test 1: variable substitution - PASSED');
}

// Test 2: Unknown variables become empty string
{
  const result = renderTemplate('{{known}} and {{unknown}}', { known: 'yes' });
  assert.strictEqual(result, 'yes and ');
  console.log('  Test 2: unknown variables - PASSED');
}

// Test 3: {{#if truthy}} block preserved
{
  const result = renderTemplate('before {{#if show}}visible{{/if}} after', { show: 'true' });
  assert.strictEqual(result, 'before visible after');
  console.log('  Test 3: truthy if block - PASSED');
}

// Test 4: {{#if falsy}} block removed
{
  const result = renderTemplate('before {{#if hide}}hidden{{/if}} after', { hide: '' });
  assert.strictEqual(result, 'before  after');
  console.log('  Test 4: falsy if block - PASSED');
}

// Test 5: {{#if var === 'value'}} comparison
{
  const result = renderTemplate(
    "{{#if db === 'postgres'}}PG{{/if}}{{#if db === 'mongo'}}MG{{/if}}",
    { db: 'postgres' }
  );
  assert.strictEqual(result, 'PG');
  console.log('  Test 5: equality comparison - PASSED');
}

// Test 6: {{#if var !== 'value'}} comparison
{
  const result = renderTemplate(
    "{{#if db !== 'sqlite'}}not-sqlite{{/if}}",
    { db: 'postgres' }
  );
  assert.strictEqual(result, 'not-sqlite');
  console.log('  Test 6: inequality comparison - PASSED');
}

// Test 7: Nested blocks
{
  const result = renderTemplate(
    '{{#if a}}outer{{#if b}}inner{{/if}}end{{/if}}',
    { a: 'true', b: 'true' }
  );
  assert.strictEqual(result, 'outerinnerend');
  console.log('  Test 7: nested blocks - PASSED');
}

// Test 8: Triple blank lines collapsed
{
  const result = renderTemplate('line1\n\n\n\n\nline2', {});
  assert.strictEqual(result, 'line1\n\nline2');
  console.log('  Test 8: blank line collapse - PASSED');
}

// Test 9: evaluateWhenExpression - truthiness
{
  assert.strictEqual(evaluateWhenExpression('useAuth', { useAuth: true }), true);
  assert.strictEqual(evaluateWhenExpression('useAuth', { useAuth: false }), false);
  assert.strictEqual(evaluateWhenExpression('useAuth', { useAuth: 'yes' }), true);
  assert.strictEqual(evaluateWhenExpression('useAuth', {}), false);
  console.log('  Test 9: when expression truthiness - PASSED');
}

// Test 10: evaluateWhenExpression - equality
{
  assert.strictEqual(evaluateWhenExpression("db === 'postgres'", { db: 'postgres' }), true);
  assert.strictEqual(evaluateWhenExpression("db === 'postgres'", { db: 'mongo' }), false);
  assert.strictEqual(evaluateWhenExpression("db !== 'sqlite'", { db: 'postgres' }), true);
  assert.strictEqual(evaluateWhenExpression("db !== 'postgres'", { db: 'postgres' }), false);
  console.log('  Test 10: when expression equality - PASSED');
}

// Test 11: interpolateSimple
{
  const result = interpolateSimple('npm install {{db}} {{framework}}', {
    db: 'pg',
    framework: 'express',
  });
  assert.strictEqual(result, 'npm install pg express');
  console.log('  Test 11: interpolateSimple - PASSED');
}

// Test 12: Boolean comparison in if block
{
  const result = renderTemplate(
    '{{#if useAuth === true}}auth-on{{/if}}',
    { useAuth: 'true' }
  );
  assert.strictEqual(result, 'auth-on');
  console.log('  Test 12: boolean comparison - PASSED');
}

console.log('\n  All renderer tests passed!');
