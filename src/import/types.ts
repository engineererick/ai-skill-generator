export interface ImportableFile {
  /** Known config format identifier */
  formatId: string;
  /** Display name of the format */
  formatName: string;
  /** The file path (absolute) */
  filePath: string;
  /** The file path relative to cwd */
  relativePath: string;
}

export interface ImportResult {
  /** Parsed skill name (derived from filename or content) */
  name: string;
  /** Parsed description (from first paragraph) */
  description: string;
  /** Raw markdown content (the body for SKILL.md) */
  content: string;
  /** The source format that was imported */
  sourceFormat: string;
}
