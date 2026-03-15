import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

const mockProject = vi.hoisted(() => ({
  gitConnect: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { project: mockProject },
});

import { useGitStore } from '../../../renderer/stores/git-store';

describe('useGitStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitStore.setState({
      branch: null,
      isClean: true,
      commits: [],
      connected: false,
      loading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useGitStore.getState();
    expect(state.branch).toBeNull();
    expect(state.isClean).toBe(true);
    expect(state.commits).toEqual([]);
    expect(state.connected).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should connect to git repo via IPC', async () => {
    mockProject.gitConnect.mockResolvedValue({
      success: true,
      data: {
        branch: 'main',
        isClean: true,
        commits: [{ message: 'init', timestamp: '2026-03-12' }],
      },
    });

    await act(async () => {
      await useGitStore.getState().connect('/some/dir');
    });

    expect(mockProject.gitConnect).toHaveBeenCalledWith('/some/dir');
    const state = useGitStore.getState();
    expect(state.branch).toBe('main');
    expect(state.isClean).toBe(true);
    expect(state.commits).toHaveLength(1);
    expect(state.connected).toBe(true);
  });

  it('should not update state on failed connect', async () => {
    mockProject.gitConnect.mockResolvedValue({
      success: false,
      error: { code: 'NOT_A_REPO', message: 'Not a git repo' },
    });

    await act(async () => {
      await useGitStore.getState().connect('/bad/dir');
    });

    const state = useGitStore.getState();
    expect(state.connected).toBe(false);
    expect(state.branch).toBeNull();
  });
});
