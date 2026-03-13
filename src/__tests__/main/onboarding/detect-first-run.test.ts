// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => ({
  readdir: vi.fn(),
  access: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readdir: mockFs.readdir,
  access: mockFs.access,
}));

import { detectFirstRun } from '../../../main/onboarding/detect-first-run';

describe('First run detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect first run when no projects exist', async () => {
    mockFs.readdir.mockResolvedValue([]);
    mockFs.access.mockRejectedValue(new Error('ENOENT'));

    const result = await detectFirstRun('/app/data');

    expect(result).toBe(true);
  });

  it('should detect first run when no config exists', async () => {
    mockFs.readdir.mockResolvedValue([]);
    mockFs.access.mockRejectedValue(new Error('ENOENT'));

    const result = await detectFirstRun('/app/data');

    expect(result).toBe(true);
  });

  it('should not trigger when projects already exist', async () => {
    mockFs.readdir.mockResolvedValue([
      { name: 'my-project', isDirectory: () => true },
    ]);
    mockFs.access.mockResolvedValue(undefined);

    const result = await detectFirstRun('/app/data');

    expect(result).toBe(false);
  });
});
