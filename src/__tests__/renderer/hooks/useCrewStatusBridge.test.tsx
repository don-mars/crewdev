import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCrewStatusBridge } from '../../../renderer/hooks/useCrewStatusBridge';

const mockOnStatus = vi.fn();
const mockUpdateStatus = vi.fn();

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: {
    crew: {
      onStatus: mockOnStatus,
    },
  },
});

describe('useCrewStatusBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStatus.mockReturnValue(vi.fn());
  });

  it('should subscribe to onStatus for each active ID', () => {
    renderHook(() => useCrewStatusBridge(['builder', 'reviewer'], mockUpdateStatus));

    expect(mockOnStatus).toHaveBeenCalledWith('builder', expect.any(Function));
    expect(mockOnStatus).toHaveBeenCalledWith('reviewer', expect.any(Function));
    expect(mockOnStatus).toHaveBeenCalledTimes(2);
  });

  it('should call updateStatus when status is received', () => {
    mockOnStatus.mockImplementation((_id: string, callback: (status: string) => void) => {
      callback('thinking');
      return vi.fn();
    });

    renderHook(() => useCrewStatusBridge(['builder'], mockUpdateStatus));

    expect(mockUpdateStatus).toHaveBeenCalledWith('builder', 'thinking');
  });

  it('should unsubscribe on cleanup', () => {
    const mockUnsubscribe = vi.fn();
    mockOnStatus.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useCrewStatusBridge(['builder'], mockUpdateStatus),
    );
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should not subscribe when activeIds is empty', () => {
    renderHook(() => useCrewStatusBridge([], mockUpdateStatus));

    expect(mockOnStatus).not.toHaveBeenCalled();
  });
});
