import { create } from 'zustand';
import type { ProjectMetadata } from '../../shared/types/project';

interface ProjectState {
  projects: ProjectMetadata[];
  activeProject: ProjectMetadata | null;
  addProject: (project: ProjectMetadata) => void;
  selectProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,

  addProject: (project) => {
    set((state) => ({ projects: [...state.projects, project] }));
  },

  selectProject: (id) => {
    if (id === null) {
      set({ activeProject: null });
      return;
    }
    const project = get().projects.find((p) => p.id === id) ?? null;
    set({ activeProject: project });
  },
}));
