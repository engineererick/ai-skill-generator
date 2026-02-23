export interface DetectionResult {
  /** Detected template type */
  type: string;
  /** Confidence level (0-1) for the template type selection */
  confidence: number;
  /** Detected answers for template questions, keyed by question name */
  answers: Record<string, unknown>;
  /** Evidence trail: what files/dependencies triggered each detection */
  evidence: DetectionEvidence[];
  /** Warnings about ambiguous or conflicting signals */
  warnings: string[];
}

export interface DetectionEvidence {
  /** What was detected (e.g., "next" dependency, "prisma/schema.prisma" file) */
  source: string;
  /** What it implies (e.g., type=fullstack, framework=nextjs) */
  implies: string;
  /** Category of the evidence source */
  category: 'dependency' | 'config-file' | 'folder-structure';
}

export interface PackageJsonData {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}
