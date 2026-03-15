import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

const mockKnowledge = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateLevel: vi.fn(),
  adaptText: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { knowledge: mockKnowledge },
});

import { useKnowledgeStore } from '../../../renderer/stores/knowledge-store';

describe('useKnowledgeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useKnowledgeStore.setState({
      profile: {},
      loading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useKnowledgeStore.getState();
    expect(state.profile).toEqual({});
    expect(state.loading).toBe(false);
  });

  it('should load profile from IPC', async () => {
    mockKnowledge.getProfile.mockResolvedValue({
      success: true,
      data: { component: { level: 2, exposures: 5 } },
    });

    await act(async () => {
      await useKnowledgeStore.getState().loadProfile();
    });

    const state = useKnowledgeStore.getState();
    expect(state.profile).toEqual({ component: { level: 2, exposures: 5 } });
    expect(state.loading).toBe(false);
  });

  it('should update concept level via IPC and reload', async () => {
    mockKnowledge.updateLevel.mockResolvedValue({ success: true, data: undefined });
    mockKnowledge.getProfile.mockResolvedValue({
      success: true,
      data: { component: { level: 3, exposures: 6 } },
    });

    await act(async () => {
      await useKnowledgeStore.getState().updateLevel('component', 3);
    });

    expect(mockKnowledge.updateLevel).toHaveBeenCalledWith('component', 3);
  });

  it('should adapt text via IPC', async () => {
    mockKnowledge.adaptText.mockResolvedValue({
      success: true,
      data: 'Simplified explanation',
    });

    await act(async () => {
      const result = await useKnowledgeStore.getState().adaptText('Complex explanation');
      expect(result).toBe('Simplified explanation');
    });

    expect(mockKnowledge.adaptText).toHaveBeenCalledWith('Complex explanation');
  });
});
