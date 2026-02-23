import { readPackageJson, scanDependencies, scanConfigFiles, scanFolderStructure } from './scanners.js';
import { resolveDetection } from './resolver.js';
import type { DetectionResult } from './types.js';

export type { DetectionResult, DetectionEvidence, PackageJsonData } from './types.js';

/**
 * Scan the given directory and detect project type + technologies.
 * Returns a DetectionResult with type, answers, confidence, and evidence.
 */
export async function detectProject(cwd?: string): Promise<DetectionResult> {
  const dir = cwd || process.cwd();

  // Read package.json
  const pkg = await readPackageJson(dir);

  // Run all scanners in parallel
  const [depEvidence, configEvidence, folderEvidence] = await Promise.all([
    Promise.resolve(pkg ? scanDependencies(pkg) : []),
    scanConfigFiles(dir),
    scanFolderStructure(dir),
  ]);

  // Combine all evidence
  const allEvidence = [...depEvidence, ...configEvidence, ...folderEvidence];

  // Resolve into final result
  return resolveDetection(allEvidence, pkg !== null);
}
