import fs from 'fs/promises';
import path from 'path';
import type { ImportResult } from './types.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * Parse a file and extract content suitable for a skill.
 */
export async function parseImportFile(
  filePath: string,
  formatId: string
): Promise<ImportResult> {
  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el limite de 1MB: ${filePath}`);
  }

  const rawContent = await fs.readFile(filePath, 'utf-8');
  const content = stripFrontmatter(rawContent);
  const filename = path.basename(filePath);

  return {
    name: deriveSkillName(filename, formatId),
    description: extractDescription(content),
    content,
    sourceFormat: formatId,
  };
}

/**
 * Build a complete SKILL.md string from import result.
 * Adds YAML frontmatter on top of the content body.
 */
export function buildSkillMd(
  name: string,
  description: string,
  content: string
): string {
  const frontmatter = [
    '---',
    `name: ${name}`,
    `description: "${escapeYamlString(description)}"`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${content.trim()}\n`;
}

/**
 * Derive a kebab-case skill name from a filename and format.
 */
export function deriveSkillName(filename: string, formatId: string): string {
  const nameMap: Record<string, string> = {
    'cursorrules': 'cursor-rules',
    'claude-md': 'claude-instructions',
    'copilot': 'copilot-instructions',
    'windsurfrules': 'windsurf-rules',
    'goose': 'goose-instructions',
    'gemini': 'gemini-instructions',
    'codex': 'codex-instructions',
    'amp': 'amp-instructions',
  };

  if (nameMap[formatId]) return nameMap[formatId];

  // Generic: strip extension, convert to kebab-case
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'imported-skill';
}

/**
 * Extract the first meaningful paragraph from markdown content as a description.
 * Skips headings, blank lines, and code blocks.
 */
export function extractDescription(content: string): string {
  const lines = content.split('\n');
  const paragraphLines: string[] = [];
  let foundContent = false;
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Toggle code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (!trimmed) {
      if (foundContent) break; // end of first paragraph
      continue;
    }
    if (trimmed.startsWith('#')) continue; // skip headings
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) continue; // skip lists
    if (trimmed.startsWith('|')) continue; // skip tables

    foundContent = true;
    paragraphLines.push(trimmed);
  }

  const desc = paragraphLines.join(' ');
  if (!desc) return 'Imported AI instructions';
  return desc.length > 200 ? desc.slice(0, 197) + '...' : desc;
}

// --- Helpers ---

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('---', 3);
  if (end === -1) return content;
  return content.slice(end + 3).trimStart();
}

function escapeYamlString(str: string): string {
  return str.replace(/"/g, '\\"');
}
