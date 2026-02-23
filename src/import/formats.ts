import fs from 'fs/promises';
import path from 'path';
import type { ImportableFile } from './types.js';

/**
 * Known AI instruction file formats, in scan priority order.
 */
export const KNOWN_FORMATS: {
  id: string;
  name: string;
  paths: string[];
}[] = [
  { id: 'cursorrules', name: 'Cursor Rules', paths: ['.cursorrules'] },
  { id: 'claude-md', name: 'Claude Code', paths: ['CLAUDE.md'] },
  { id: 'copilot', name: 'GitHub Copilot', paths: ['.github/copilot-instructions.md'] },
  { id: 'windsurfrules', name: 'Windsurf Rules', paths: ['.windsurfrules'] },
  { id: 'goose', name: 'Goose', paths: ['.goose/instructions.md'] },
  { id: 'gemini', name: 'Gemini CLI', paths: ['.gemini/instructions.md'] },
  { id: 'codex', name: 'Codex', paths: ['codex.md'] },
  { id: 'amp', name: 'Amp', paths: ['.amp/instructions.md'] },
];

/**
 * Scan cwd for known AI instruction files.
 * Returns all found files.
 */
export async function scanForImportableFiles(cwd: string): Promise<ImportableFile[]> {
  const found: ImportableFile[] = [];

  for (const format of KNOWN_FORMATS) {
    for (const relPath of format.paths) {
      const fullPath = path.join(cwd, relPath);
      try {
        await fs.access(fullPath);
        found.push({
          formatId: format.id,
          formatName: format.name,
          filePath: fullPath,
          relativePath: relPath,
        });
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  return found;
}

/**
 * Identify the format of a file based on its name/path.
 * Returns the format id, or 'generic' if not recognized.
 */
export function identifyFormat(filePath: string): string {
  const basename = path.basename(filePath);
  const relativish = filePath.replace(/\\/g, '/');

  for (const format of KNOWN_FORMATS) {
    for (const knownPath of format.paths) {
      if (basename === path.basename(knownPath)) {
        return format.id;
      }
      if (relativish.endsWith(knownPath)) {
        return format.id;
      }
    }
  }

  return 'generic';
}
