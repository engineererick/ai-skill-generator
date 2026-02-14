// Detection and installation of skills to AI agents
// Compatible with the AI Agent Skills standard

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

export interface Agent {
  name: string;
  id: string;
  detect: () => Promise<boolean>;
  getInstallPath: () => string;
}

// Detection checks home directory (is the agent installed on this system?)
// Install paths are project-level (where the agent reads skills from)
export const agents: Agent[] = [
  {
    name: 'Claude Code',
    id: 'claude',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.claude'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.claude', 'skills'),
  },
  {
    name: 'Cursor',
    id: 'cursor',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.cursor'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.cursor', 'skills'),
  },
  {
    name: 'VS Code / Copilot',
    id: 'vscode',
    detect: async () => {
      try {
        // Check VS Code config directory
        const vscodeDir = process.platform === 'win32'
          ? path.join(os.homedir(), 'AppData', 'Roaming', 'Code')
          : process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library', 'Application Support', 'Code')
            : path.join(os.homedir(), '.config', 'Code');
        await fs.access(vscodeDir);
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.github', 'skills'),
  },
  {
    name: 'Codex',
    id: 'codex',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.codex'));
        return true;
      } catch {
        try {
          await fs.access(path.join(os.homedir(), '.agents'));
          return true;
        } catch {
          return false;
        }
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.agents', 'skills'),
  },
  {
    name: 'Goose',
    id: 'goose',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.config', 'goose'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.goose', 'skills'),
  },
  {
    name: 'OpenCode',
    id: 'opencode',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.config', 'opencode'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.opencode', 'skills'),
  },
  {
    name: 'Gemini CLI',
    id: 'gemini',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.gemini'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.gemini', 'skills'),
  },
  {
    name: 'Letta',
    id: 'letta',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.letta'));
        return true;
      } catch {
        return false;
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.skills'),
  },
  {
    name: 'Amp',
    id: 'amp',
    detect: async () => {
      try {
        await fs.access(path.join(os.homedir(), '.config', 'amp'));
        return true;
      } catch {
        try {
          await fs.access(path.join(os.homedir(), '.config', 'agents'));
          return true;
        } catch {
          return false;
        }
      }
    },
    getInstallPath: () => path.join(process.cwd(), '.agents', 'skills'),
  },
];

export interface DetectedAgent extends Agent {
  installed: boolean;
}

export async function detectAgents(): Promise<DetectedAgent[]> {
  const detected: DetectedAgent[] = [];

  for (const agent of agents) {
    const installed = await agent.detect();
    detected.push({ ...agent, installed });
  }

  return detected;
}

export async function installToAgent(
  skillPath: string,
  agentId: string,
  options?: { force?: boolean }
): Promise<{ success: boolean; message: string }> {
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    return { success: false, message: `Unsupported agent: ${agentId}` };
  }

  const isInstalled = await agent.detect();
  if (!isInstalled) {
    return { success: false, message: `${agent.name} is not installed` };
  }

  try {
    const installPath = agent.getInstallPath();
    const skillName = path.basename(skillPath);
    const targetPath = path.join(installPath, skillName);

    await fs.mkdir(installPath, { recursive: true });

    try {
      await fs.access(targetPath);
      if (!options?.force) {
        return {
          success: false,
          message: `Skill already exists at ${targetPath}. Use --force to overwrite.`
        };
      }
      // Force: remove existing before copying
      await fs.rm(targetPath, { recursive: true, force: true });
    } catch {
      // Does not exist, we can continue
    }

    await copyDir(skillPath, targetPath);

    return {
      success: true,
      message: `Installed to ${targetPath}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : error}`
    };
  }
}

export async function installToAllAgents(
  skillPath: string,
  specificAgents?: string[],
  options?: { force?: boolean }
): Promise<{ agent: string; success: boolean; message: string }[]> {
  const detected = await detectAgents();
  const results: { agent: string; success: boolean; message: string }[] = [];

  const agentsToInstall = specificAgents
    ? detected.filter(a => specificAgents.includes(a.id) && a.installed)
    : detected.filter(a => a.installed);

  for (const agent of agentsToInstall) {
    const result = await installToAgent(skillPath, agent.id, options);
    results.push({
      agent: agent.name,
      success: result.success,
      message: result.message,
    });
  }

  return results;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export function formatInstallResults(
  results: { agent: string; success: boolean; message: string }[]
): string {
  const lines: string[] = [];

  for (const result of results) {
    const icon = result.success ? chalk.green('✅') : chalk.red('❌');
    lines.push(`${icon} ${result.agent}`);
    if (!result.success) {
      lines.push(chalk.gray(`   ${result.message}`));
    }
  }

  return lines.join('\n');
}
