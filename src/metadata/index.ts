import fs from 'fs/promises';
import path from 'path';
import type { SkillMetadata } from './types.js';

export type { SkillMetadata } from './types.js';

const METADATA_FILENAME = '.skillgen.json';

export async function saveMetadata(dir: string, metadata: SkillMetadata): Promise<void> {
  const filePath = path.join(dir, METADATA_FILENAME);
  await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf-8');
}

export async function loadMetadata(dir: string): Promise<SkillMetadata | null> {
  const filePath = path.join(dir, METADATA_FILENAME);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as SkillMetadata;
  } catch {
    return null;
  }
}

export async function getGeneratorVersion(): Promise<string> {
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as { version: string };
    return pkg.version;
  } catch {
    return 'unknown';
  }
}
