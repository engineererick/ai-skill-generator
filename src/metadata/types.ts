import type { SkillData } from '../templates/index.js';

export interface SkillMetadata {
  /** Metadata schema version */
  version: 1;

  /** Generator version that created/last updated this skill */
  generatorVersion: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;

  /** Complete SkillData used to generate the skill */
  skillData: SkillData;

  /** Template type identifier */
  templateType: string;

  /** Whether a custom template was used */
  isCustomTemplate: boolean;

  /** Preset used, if any */
  preset?: string;

  /** Context file paths that were loaded */
  contextPaths?: string[];

  /** Agent IDs the skill was installed to */
  installedAgents?: string[];

  /** Whether auto-detect was used during creation */
  autoDetected?: boolean;

  /** Source of this skill: 'generated' or 'imported' */
  source?: 'generated' | 'imported';

  /** For imported skills: the source format id */
  importSourceFormat?: string;

  /** For imported skills: the original file path */
  importSourceFile?: string;
}
