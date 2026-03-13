import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrewOutput } from '../../../renderer/hooks/useCrewOutput';

// Mock window.crewdev
let mockCleanup: ReturnType<typeof vi.fn>;
let capturedCallback: ((line: string) => void) | null = null;

beforeEach(() => {
  mockCleanup = vi.fn();
  capturedCallback = null;

  window.crewdev = {
    crew: {
      spawn: vi.fn(),
      kill: vi.fn(),
      killAll: vi.fn(),
      sendInput: vi.fn(),
      onOutput: vi.fn((id: string, cb: (line: string) => void) => {
        capturedCallback = cb;
        return mockCleanup;
      }),
      onStatus: vi.fn(),
    },
    project: {
      create: vi.fn(),
      list: vi.fn(),
      select: vi.fn(),
      gitConnect: vi.fn(),
    },
    memory: {
      read: vi.fn(),
      write: vi.fn(),
    },
  } as unknown as typeof window.crewdev;
});

describe('useCrewOutput hook', () => {
  it('should subscribe to crew output on mount', () => {
    renderHook(() => useCrewOutput('crew-1'));

    expect(window.crewdev.crew.onOutput).toHaveBeenCalledWith(
      'crew-1',
      expect.any(Function),
    );
  });

  it('should call cleanup on unmount', () => {
    const { unmount } = renderHook(() => useCrewOutput('crew-1'));

    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('should accumulate output lines in order', () => {
    const { result } = renderHook(() => useCrewOutput('crew-1'));

    act(() => {
      capturedCallback?.('Line 1');
    });
    act(() => {
      capturedCallback?.('Line 2');
    });
    act(() => {
      capturedCallback?.('Line 3');
    });

    expect(result.current).toEqual(['Line 1', 'Line 2', 'Line 3']);
  });

  it('should handle two independent crew output streams', () => {
    let callback1: ((line: string) => void) | null = null;
    let callback2: ((line: string) => void) | null = null;

    vi.mocked(window.crewdev.crew.onOutput)
      .mockImplementationOnce((_id, cb) => {
        callback1 = cb;
        return vi.fn();
      })
      .mockImplementationOnce((_id, cb) => {
        callback2 = cb;
        return vi.fn();
      });

    const { result: result1 } = renderHook(() => useCrewOutput('crew-1'));
    const { result: result2 } = renderHook(() => useCrewOutput('crew-2'));

    act(() => {
      callback1?.('Output from crew-1');
    });
    act(() => {
      callback2?.('Output from crew-2');
    });

    expect(result1.current).toEqual(['Output from crew-1']);
    expect(result2.current).toEqual(['Output from crew-2']);
  });
});
