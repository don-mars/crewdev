import { create } from 'zustand';
import type { GitCommitInfo } from '../../shared/types/git';

interface GitState {
  branch: string | null;
  isClean: boolean;
  commits: GitCommitInfo[];
  connected: boolean;
  loading: boolean;
  connect: (dirPath: string) => Promise<void>;
}

export const useGitStore = create<GitState>((set) => ({
  branch: null,
  isClean: true,
  commits: [],
  connected: false,
  loading: false,

  connect: async (dirPath: string) => {
    set({ loading: true });
    const result = await window.crewdev.project.gitConnect(dirPath);
    const response = result as {
      success: boolean;
      data: { branch: string; isClean: boolean; commits: GitCommitInfo[] };
    };
    if (response.success) {
      set({
        branch: response.data.branch,
        isClean: response.data.isClean,
        commits: response.data.commits,
        connected: true,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },
}));
