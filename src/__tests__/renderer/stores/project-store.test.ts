import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../../renderer/stores/project-store';
import type { ProjectMetadata } from '../../../shared/types/project';

const MOCK_PROJECT: ProjectMetadata = {
  id: 'proj-1',
  name: 'Test Project',
  dirPath: '/test',
  createdAt: '2026-03-13T00:00:00Z',
};

describe('Project Zustand store', () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: [], activeProject: null });
  });

  it('should update projects list after creation', () => {
    useProjectStore.getState().addProject(MOCK_PROJECT);

    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().projects[0].name).toBe('Test Project');
  });

  it('should set active project on selection', () => {
    useProjectStore.getState().addProject(MOCK_PROJECT);
    useProjectStore.getState().selectProject('proj-1');

    expect(useProjectStore.getState().activeProject?.id).toBe('proj-1');
  });

  it('should clear active project on deselection', () => {
    useProjectStore.getState().addProject(MOCK_PROJECT);
    useProjectStore.getState().selectProject('proj-1');
    useProjectStore.getState().selectProject(null);

    expect(useProjectStore.getState().activeProject).toBeNull();
  });
});
