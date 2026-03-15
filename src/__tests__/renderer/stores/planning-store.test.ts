import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

const mockPlanning = vi.hoisted(() => ({
  upload: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  delete: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { planning: mockPlanning },
});

import { usePlanningStore } from '../../../renderer/stores/planning-store';

describe('usePlanningStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlanningStore.setState({ docs: [], loading: false });
  });

  it('should have correct initial state', () => {
    const state = usePlanningStore.getState();
    expect(state.docs).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('should load docs from IPC', async () => {
    mockPlanning.list.mockResolvedValue({
      success: true,
      data: [{ name: 'spec', fileName: 'spec.md', lastModified: '2026-03-12' }],
    });

    await act(async () => {
      await usePlanningStore.getState().loadDocs();
    });

    expect(usePlanningStore.getState().docs).toHaveLength(1);
    expect(usePlanningStore.getState().docs[0].name).toBe('spec');
  });

  it('should create doc via IPC and reload', async () => {
    mockPlanning.create.mockResolvedValue({
      success: true,
      data: { name: 'notes', fileName: 'notes.md', lastModified: '2026-03-12' },
    });
    mockPlanning.list.mockResolvedValue({ success: true, data: [] });

    await act(async () => {
      await usePlanningStore.getState().createDoc('notes');
    });

    expect(mockPlanning.create).toHaveBeenCalledWith('notes');
  });

  it('should delete doc via IPC and reload', async () => {
    mockPlanning.delete.mockResolvedValue({ success: true, data: undefined });
    mockPlanning.list.mockResolvedValue({ success: true, data: [] });

    await act(async () => {
      await usePlanningStore.getState().deleteDoc('spec.md');
    });

    expect(mockPlanning.delete).toHaveBeenCalledWith('spec.md');
  });
});
