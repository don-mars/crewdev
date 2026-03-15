import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCrewActivityBridge } from '../../../renderer/hooks/useCrewActivityBridge';
import type { CrewMember } from '../../../renderer/stores/crew-store';
import type { ActivityEntry } from '../../../shared/types/activity';

const mockOnOutput = vi.fn();

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: {
    crew: {
      onOutput: mockOnOutput,
    },
  },
});

describe('useCrewActivityBridge', () => {
  let mockAddEntry: ReturnType<typeof vi.fn<(entry: ActivityEntry) => void>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddEntry = vi.fn();
    mockOnOutput.mockReturnValue(vi.fn()); // return unsubscribe
  });

  const members: CrewMember[] = [
    { id: 'builder', name: 'Builder', role: 'builder', configContent: '', status: 'running' },
    { id: 'stylist', name: 'Stylist', role: 'stylist', configContent: '', status: 'idle' },
  ];

  it('should subscribe to onOutput for each active ID', () => {
    renderHook(() => useCrewActivityBridge(['builder'], members, mockAddEntry));

    expect(mockOnOutput).toHaveBeenCalledWith('builder', expect.any(Function));
    expect(mockOnOutput).toHaveBeenCalledTimes(1);
  });

  it('should call addEntry when output is received', () => {
    mockOnOutput.mockImplementation((_id: string, callback: (line: string) => void) => {
      callback('Hello from Claude');
      return vi.fn();
    });

    renderHook(() => useCrewActivityBridge(['builder'], members, mockAddEntry));

    expect(mockAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        crewName: 'Builder',
        message: 'Hello from Claude',
      }),
    );
  });

  it('should unsubscribe on cleanup', () => {
    const mockUnsubscribe = vi.fn();
    mockOnOutput.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useCrewActivityBridge(['builder'], members, mockAddEntry),
    );
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should not subscribe when activeIds is empty', () => {
    renderHook(() => useCrewActivityBridge([], members, mockAddEntry));

    expect(mockOnOutput).not.toHaveBeenCalled();
  });

  it('should resubscribe when activeIds change', () => {
    const mockUnsubscribe = vi.fn();
    mockOnOutput.mockReturnValue(mockUnsubscribe);

    const { rerender } = renderHook(
      ({ ids }) => useCrewActivityBridge(ids, members, mockAddEntry),
      { initialProps: { ids: ['builder'] } },
    );

    expect(mockOnOutput).toHaveBeenCalledTimes(1);

    rerender({ ids: ['builder', 'stylist'] });

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockOnOutput).toHaveBeenCalledTimes(3); // 1 initial + 2 resubscribe
  });
});
