import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGitConnect } from '../../../main/ipc/git-connect';

vi.mock('simple-git', () => {
  const mockGit = {
    branch: vi.fn(),
    log: vi.fn(),
    status: vi.fn(),
    checkIsRepo: vi.fn(),
  };
  return {
    simpleGit: vi.fn(() => mockGit),
    __mockGit: mockGit,
  };
});

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

async function getMockGit() {
  const mod = await import('simple-git');
  return (mod as unknown as { __mockGit: Record<string, ReturnType<typeof vi.fn>> }).__mockGit;
}

describe('project:git-connect IPC handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current branch name for valid git repo', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockResolvedValue(true);
    mockGit.branch.mockResolvedValue({ current: 'main' });
    mockGit.log.mockResolvedValue({
      all: [{ message: 'init', date: '2026-03-13T10:00:00Z' }],
    });
    mockGit.status.mockResolvedValue({ isClean: () => true });

    const result = await handleGitConnect('/valid/repo');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.branch).toBe('main');
    }
  });

  it('should return last 5 commits with message and timestamp', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockResolvedValue(true);
    mockGit.branch.mockResolvedValue({ current: 'main' });
    mockGit.log.mockResolvedValue({
      all: Array.from({ length: 7 }, (_, i) => ({
        message: `commit ${i}`,
        date: `2026-03-${13 - i}T10:00:00Z`,
      })),
    });
    mockGit.status.mockResolvedValue({ isClean: () => true });

    const result = await handleGitConnect('/valid/repo');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commits).toHaveLength(5);
      expect(result.data.commits[0].message).toBe('commit 0');
    }
  });

  it('should return clean/dirty working tree status', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockResolvedValue(true);
    mockGit.branch.mockResolvedValue({ current: 'feature' });
    mockGit.log.mockResolvedValue({ all: [] });
    mockGit.status.mockResolvedValue({ isClean: () => false });

    const result = await handleGitConnect('/dirty/repo');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isClean).toBe(false);
    }
  });

  it('should return PATH_NOT_FOUND for non-existent directory', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockRejectedValue(new Error('ENOENT'));

    const result = await handleGitConnect('/nonexistent/path');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PATH_NOT_FOUND');
    }
  });

  it('should return NOT_A_REPO for directory without .git', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockResolvedValue(false);

    const result = await handleGitConnect('/not/a/repo');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_A_REPO');
    }
  });

  it('should not perform any remote operations', async () => {
    const mockGit = await getMockGit();
    mockGit.checkIsRepo.mockResolvedValue(true);
    mockGit.branch.mockResolvedValue({ current: 'main' });
    mockGit.log.mockResolvedValue({ all: [] });
    mockGit.status.mockResolvedValue({ isClean: () => true });

    await handleGitConnect('/valid/repo');

    // Ensure no remote methods were called
    expect(mockGit).not.toHaveProperty('fetch');
    expect(mockGit).not.toHaveProperty('pull');
    expect(mockGit).not.toHaveProperty('push');
  });
});
