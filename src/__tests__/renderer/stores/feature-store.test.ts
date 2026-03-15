import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { FeatureTree, FeatureNode } from '../../../shared/types/feature';

const mockFeature = vi.hoisted(() => ({
  create: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  loadTree: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { feature: mockFeature },
});

import { useFeatureStore } from '../../../renderer/stores/feature-store';

const MOCK_TREE: FeatureTree = [
  {
    id: 'feat-1',
    title: 'Auth',
    status: 'planned',
    parent: null,
    body: 'Authentication feature',
    children: [],
  },
];

const MOCK_FEATURE: FeatureNode = {
  id: 'feat-1',
  title: 'Auth',
  status: 'planned',
  parent: null,
  body: 'Authentication feature',
};

describe('useFeatureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureStore.setState({
      tree: [],
      selectedId: null,
      selectedFeature: null,
      loading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useFeatureStore.getState();
    expect(state.tree).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(state.selectedFeature).toBeNull();
  });

  it('should load tree from IPC', async () => {
    mockFeature.loadTree.mockResolvedValue({
      success: true,
      data: MOCK_TREE,
    });

    await act(async () => {
      await useFeatureStore.getState().loadTree();
    });

    expect(mockFeature.loadTree).toHaveBeenCalled();
    expect(useFeatureStore.getState().tree).toEqual(MOCK_TREE);
  });

  it('should select feature via IPC', async () => {
    mockFeature.read.mockResolvedValue({
      success: true,
      data: MOCK_FEATURE,
    });

    await act(async () => {
      await useFeatureStore.getState().selectFeature('feat-1');
    });

    expect(mockFeature.read).toHaveBeenCalledWith('feat-1');
    expect(useFeatureStore.getState().selectedFeature).toEqual(MOCK_FEATURE);
    expect(useFeatureStore.getState().selectedId).toBe('feat-1');
  });

  it('should create feature via IPC and reload tree', async () => {
    const input = { title: 'New Feature', status: 'planned', parent: null, body: '' };
    mockFeature.create.mockResolvedValue({
      success: true,
      data: { id: 'feat-2', ...input },
    });
    mockFeature.loadTree.mockResolvedValue({
      success: true,
      data: MOCK_TREE,
    });

    await act(async () => {
      await useFeatureStore.getState().createFeature(input);
    });

    expect(mockFeature.create).toHaveBeenCalledWith(input);
    expect(mockFeature.loadTree).toHaveBeenCalled();
  });
});
