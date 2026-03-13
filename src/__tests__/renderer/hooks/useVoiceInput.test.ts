import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceInput } from '../../../renderer/hooks/useVoiceInput';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

describe('useVoiceInput hook', () => {
  let originalSpeechRecognition: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalSpeechRecognition = (globalThis as any).webkitSpeechRecognition;
    (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    (globalThis as any).webkitSpeechRecognition = originalSpeechRecognition;
  });

  it('should initialize Web Speech API', () => {
    const { result } = renderHook(() => useVoiceInput());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe('');
  });

  it('should handle browser not supporting Speech API', () => {
    delete (globalThis as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useVoiceInput());

    expect(result.current.isSupported).toBe(false);
  });

  it('should return transcription text', () => {
    const { result } = renderHook(() => useVoiceInput());

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // Simulate speech result
    act(() => {
      const recognition = result.current._recognition as any;
      recognition?.onresult?.({
        results: [[{ transcript: 'hello world' }]],
        resultIndex: 0,
      });
    });

    expect(result.current.transcript).toBe('hello world');
  });

  it('should handle recording errors gracefully', () => {
    const { result } = renderHook(() => useVoiceInput());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      const recognition = result.current._recognition as any;
      recognition?.onerror?.({ error: 'network' });
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('network');
  });

  it('should stop recording when stopRecording is called', () => {
    const { result } = renderHook(() => useVoiceInput());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    act(() => {
      const recognition = result.current._recognition as any;
      recognition?.onend?.();
    });

    expect(result.current.isRecording).toBe(false);
  });
});
