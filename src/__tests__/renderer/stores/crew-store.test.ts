import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock window.crewdev.crew before importing store
const mockCrew = vi.hoisted(() => ({
  spawn: vi.fn(),
  kill: vi.fn(),
  killAll: vi.fn(),
  sendInput: vi.fn(),
  onOutput: vi.fn(),
  onStatus: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { crew: mockCrew },
});

import { useCrewStore } from '../../../renderer/stores/crew-store';

describe('useCrewStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCrewStore.setState({
      members: [],
      activeIds: [],
    });
  });

  it('should have correct initial state', () => {
    const state = useCrewStore.getState();
    expect(state.members).toEqual([]);
    expect(state.activeIds).toEqual([]);
  });

  it('should spawn a crew member via IPC and add to members', async () => {
    mockCrew.spawn.mockResolvedValue({
      success: true,
      data: { id: 'crew-1', pid: 1234, status: 'running' },
    });

    const config = {
      id: 'crew-1',
      name: 'Builder',
      role: 'builder',
      configContent: '# builder config',
    };

    await act(async () => {
      await useCrewStore.getState().spawn(config);
    });

    expect(mockCrew.spawn).toHaveBeenCalledWith(config);
    const state = useCrewStore.getState();
    expect(state.members).toHaveLength(1);
    expect(state.members[0]).toEqual({
      id: 'crew-1',
      name: 'Builder',
      role: 'builder',
      configContent: '# builder config',
      status: 'running',
    });
    expect(state.activeIds).toContain('crew-1');
  });

  it('should kill a crew member via IPC and remove from activeIds', async () => {
    // Seed a running member
    useCrewStore.setState({
      members: [{ id: 'crew-1', name: 'Builder', role: 'builder', configContent: '', status: 'running' }],
      activeIds: ['crew-1'],
    });

    mockCrew.kill.mockResolvedValue({ success: true });

    await act(async () => {
      await useCrewStore.getState().kill('crew-1');
    });

    expect(mockCrew.kill).toHaveBeenCalledWith('crew-1');
    const state = useCrewStore.getState();
    expect(state.activeIds).not.toContain('crew-1');
    expect(state.members[0].status).toBe('idle');
  });

  it('should killAll crew members via IPC and clear activeIds', async () => {
    // Seed multiple running members
    useCrewStore.setState({
      members: [
        { id: 'crew-1', name: 'Builder', role: 'builder', configContent: '', status: 'running' },
        { id: 'crew-2', name: 'Reviewer', role: 'reviewer', configContent: '', status: 'thinking' },
      ],
      activeIds: ['crew-1', 'crew-2'],
    });

    mockCrew.killAll.mockResolvedValue({ success: true });

    await act(async () => {
      await useCrewStore.getState().killAll();
    });

    expect(mockCrew.killAll).toHaveBeenCalled();
    const state = useCrewStore.getState();
    expect(state.activeIds).toEqual([]);
    expect(state.members.every((m) => m.status === 'idle')).toBe(true);
  });

  it('should update status for a specific member', () => {
    useCrewStore.setState({
      members: [{ id: 'crew-1', name: 'Builder', role: 'builder', configContent: '', status: 'idle' }],
      activeIds: ['crew-1'],
    });

    useCrewStore.getState().updateStatus('crew-1', 'error');

    expect(useCrewStore.getState().members[0].status).toBe('error');
  });
});
