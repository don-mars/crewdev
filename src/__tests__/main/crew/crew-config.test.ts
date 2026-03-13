// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadCrewConfig,
  saveCrewConfig,
  copyDefaultConfigs,
  getDefaultConfigPath,
} from '../../../main/crew/crew-config';
import { CREW_MEMBER_IDS } from '../../../shared/types/crew-defaults';

const { mockFs } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string>,
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return mockFs[path];
    }
    throw new Error('ENOENT');
  }),
  writeFile: vi.fn(async (path: string, content: string) => {
    mockFs[path] = content;
  }),
  copyFile: vi.fn(async (src: string, dest: string) => {
    if (mockFs[src] !== undefined) {
      mockFs[dest] = mockFs[src];
      return;
    }
    throw new Error('ENOENT');
  }),
  access: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return;
    }
    throw new Error('ENOENT');
  }),
  mkdir: vi.fn(),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Crew member configs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
  });

  it('should have default config for Builder', () => {
    const path = getDefaultConfigPath('builder');
    expect(path).toContain('builder.md');
  });

  it('should have default config for Stylist', () => {
    const path = getDefaultConfigPath('stylist');
    expect(path).toContain('stylist.md');
  });

  it('should have default config for Engineer', () => {
    const path = getDefaultConfigPath('engineer');
    expect(path).toContain('engineer.md');
  });

  it('should have default config for Reviewer', () => {
    const path = getDefaultConfigPath('reviewer');
    expect(path).toContain('reviewer.md');
  });

  it('should have default config for Fixer', () => {
    const path = getDefaultConfigPath('fixer');
    expect(path).toContain('fixer.md');
  });

  it('should have default config for Orchestrator', () => {
    const path = getDefaultConfigPath('orchestrator');
    expect(path).toContain('orchestrator.md');
  });

  it('should copy defaults to .crewdev/crew/ on project creation', async () => {
    // Set up mock default files
    for (const id of CREW_MEMBER_IDS) {
      mockFs[getDefaultConfigPath(id)] = `# ${id} default config`;
    }

    const result = await copyDefaultConfigs('/project/.crewdev/crew');

    expect(result.success).toBe(true);
    for (const id of CREW_MEMBER_IDS) {
      expect(mockFs[`/project/.crewdev/crew/${id}.md`]).toBeDefined();
    }
  });

  it('should load config content for spawn command', async () => {
    mockFs['/project/.crewdev/crew/builder.md'] = '# Builder custom config';

    const result = await loadCrewConfig('/project/.crewdev/crew', 'builder');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('# Builder custom config');
    }
  });

  it('should use modified config on re-spawn, not default', async () => {
    mockFs['/project/.crewdev/crew/builder.md'] = '# Modified config';

    const result = await loadCrewConfig('/project/.crewdev/crew', 'builder');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('# Modified config');
      expect(result.data).not.toContain('default');
    }
  });

  it('should return validation error for empty config', async () => {
    const result = await saveCrewConfig('/project/.crewdev/crew', 'builder', '');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('EMPTY_CONFIG');
    }
  });
});
