import type { DetectionResult, DetectionEvidence } from './types.js';

/**
 * Given all collected evidence, determine the most likely template type
 * and assemble the detected answers.
 */
export function resolveDetection(
  evidence: DetectionEvidence[],
  hasPackageJson: boolean
): DetectionResult {
  const answers: Record<string, unknown> = {};
  const warnings: string[] = [];
  const seenFields = new Set<string>();

  // --- Step 1: Extract answers from evidence ---
  for (const ev of evidence) {
    const pairs = parseImplies(ev.implies);
    for (const { field, value } of pairs) {
      // Skip meta fields handled in type resolution
      if (['type', 'type-hint', 'database-driver'].includes(field)) continue;

      if (seenFields.has(field)) {
        // First match wins, but warn about conflicts
        if (answers[field] !== value) {
          warnings.push(`Conflicto en "${field}": se usa "${String(answers[field])}" (de antes), se ignora "${value}" (de ${ev.source})`);
        }
        continue;
      }

      seenFields.add(field);
      // Convert "true"/"false" strings to booleans
      if (value === 'true') answers[field] = true;
      else if (value === 'false') answers[field] = false;
      else answers[field] = value;
    }
  }

  // --- Step 2: Determine template type ---
  const hasFramework = (name: string) =>
    evidence.some(e => e.category === 'dependency' && e.implies.includes(`type=${name}`));
  const hasDep = (keyword: string) =>
    evidence.some(e => e.category === 'dependency' && e.source.includes(keyword));
  const hasConfigType = (keyword: string) =>
    evidence.some(e => e.category === 'config-file' && e.implies.includes(keyword));
  const hasFolderHint = (keyword: string) =>
    evidence.some(e => e.category === 'folder-structure' && e.implies.includes(keyword));
  const hasORM = answers.orm !== undefined;
  const hasSrcDir = evidence.some(e =>
    e.category === 'folder-structure' && (
      e.source.startsWith('src/') || e.implies.includes('frontend-hint')
    )
  );

  let type = 'basic';
  let confidence = 0.3;

  // Priority 1: NestJS → microservice
  if (hasFramework('microservice') || hasConfigType('type=microservice')) {
    type = 'microservice';
    confidence = 0.95;

    // Resolve microservice database from ORM + driver
    resolveDbForMicroservice(evidence, answers);
  }
  // Priority 2: Fullstack frameworks + ORM → fullstack
  else if (hasFramework('fullstack-or-frontend') && hasORM) {
    type = 'fullstack';
    confidence = 0.9;

    resolveDbForFullstack(evidence, answers);
  }
  // Priority 3: Fullstack frameworks without ORM → frontend
  else if (hasFramework('fullstack-or-frontend')) {
    type = 'frontend';
    confidence = 0.85;
  }
  // Priority 4: API frameworks → api
  else if (hasFramework('api')) {
    type = 'api';
    confidence = 0.85;

    resolveDbForApi(evidence, answers);
  }
  // Priority 5: DevOps indicators
  else if (hasFolderHint('type-hint=devops') || (
    hasConfigType('containerization=docker') && !hasPackageJson
  )) {
    type = 'devops';
    confidence = 0.8;
  }
  // Priority 6: Generic library
  else if (hasPackageJson && hasSrcDir) {
    type = 'library';
    confidence = 0.6;

    // Detect language
    if (hasConfigType('language=typescript') || hasDep('typescript')) {
      answers.language = 'typescript';
    }
  }

  // --- Step 3: Resolve combined testing values ---
  // Override single testing values when combined frameworks are detected
  resolveTestingCombinations(evidence, answers, warnings);

  // --- Step 4: Handle includeTesting for frontend ---
  if (type === 'frontend' && answers.testing !== undefined) {
    answers.includeTesting = answers.testing;
    delete answers.testing;
  }

  return { type, confidence, answers, evidence, warnings };
}

// --- Helper functions ---

function parseImplies(implies: string): { field: string; value: string }[] {
  return implies.split(',').map(part => {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return { field: trimmed, value: 'true' };
    return {
      field: trimmed.slice(0, eqIdx).trim(),
      value: trimmed.slice(eqIdx + 1).trim(),
    };
  });
}

function getDbDrivers(evidence: DetectionEvidence[]): string[] {
  return evidence
    .filter(e => e.implies.startsWith('database-driver='))
    .map(e => e.implies.split('=')[1]);
}

function resolveDbForMicroservice(evidence: DetectionEvidence[], answers: Record<string, unknown>) {
  const drivers = getDbDrivers(evidence);
  const orm = answers.orm as string | undefined;

  if (orm === 'mongoose' || drivers.includes('mongodb')) {
    answers.database = 'mongoose';
  } else if (orm === 'typeorm' || drivers.length > 0) {
    if (drivers.includes('sqlserver')) answers.database = 'typeorm-sqlserver';
    else if (drivers.includes('postgres')) answers.database = 'typeorm-postgres';
    else if (drivers.includes('mysql')) answers.database = 'typeorm-mysql';
    else answers.database = 'typeorm-postgres'; // default for typeorm
  }

  // Clean up orm field — microservice uses 'database' not 'orm'
  delete answers.orm;
}

function resolveDbForFullstack(evidence: DetectionEvidence[], answers: Record<string, unknown>) {
  const drivers = getDbDrivers(evidence);
  const orm = answers.orm as string | undefined;

  if (orm === 'mongoose' || drivers.includes('mongodb')) {
    answers.database = 'mongodb';
  } else if (drivers.includes('sqlite')) {
    answers.database = 'sqlite';
  } else {
    answers.database = 'postgres'; // default
  }
}

function resolveDbForApi(evidence: DetectionEvidence[], answers: Record<string, unknown>) {
  const drivers = getDbDrivers(evidence);
  const orm = answers.orm as string | undefined;

  if (orm === 'mongoose' || drivers.includes('mongodb')) {
    answers.database = 'mongodb';
  } else if (drivers.includes('sqlite')) {
    answers.database = 'sqlite';
  } else if (orm || drivers.length > 0) {
    answers.database = 'postgres';
  }
}

function resolveTestingCombinations(
  evidence: DetectionEvidence[],
  answers: Record<string, unknown>,
  warnings: string[]
) {
  const hasVitest = evidence.some(e => e.source === 'vitest dependency');
  const hasJest = evidence.some(e => e.source === 'jest dependency');
  const hasPlaywright = evidence.some(e => e.source === '@playwright/test dependency');
  const hasCypress = evidence.some(e => e.source === 'cypress dependency');

  let resolved: string | undefined;
  if (hasVitest && hasPlaywright) resolved = 'vitest-playwright';
  else if (hasJest && hasCypress) resolved = 'jest-cypress';

  if (resolved && answers.testing !== resolved) {
    // Remove the misleading conflict warning about testing
    const conflictIdx = warnings.findIndex(w => w.includes('"testing"'));
    if (conflictIdx !== -1) warnings.splice(conflictIdx, 1);
    answers.testing = resolved;
  }
}
