import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceInput } from '../../../renderer/components/VoiceInput';

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

describe('VoiceInput', () => {
  let originalSpeechRecognition: any;
  let mockOnTranscript: (text: string) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    originalSpeechRecognition = (globalThis as any).webkitSpeechRecognition;
    (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
    mockOnTranscript = vi.fn() as unknown as (text: string) => void;
  });

  afterEach(() => {
    (globalThis as any).webkitSpeechRecognition = originalSpeechRecognition;
  });

  it('should render microphone button', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} />);

    expect(screen.getByRole('button', { name: /microphone/i })).toBeTruthy();
  });

  it('should start recording on first click', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} />);

    fireEvent.click(screen.getByRole('button', { name: /microphone/i }));

    expect(screen.getByText(/recording/i)).toBeTruthy();
  });

  it('should stop recording on second click', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} />);

    const micBtn = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micBtn); // start
    fireEvent.click(micBtn); // stop

    expect(screen.queryByText(/recording/i)).toBeNull();
  });

  it('should display transcription in editable text field', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} transcript="hello world" />);

    const textField = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textField.value).toBe('hello world');
  });

  it('should auto-stop after 60 seconds of silence', () => {
    vi.useFakeTimers();
    render(<VoiceInput onTranscript={mockOnTranscript} />);

    fireEvent.click(screen.getByRole('button', { name: /microphone/i }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.queryByText(/recording/i)).toBeNull();
    vi.useRealTimers();
  });

  it('should not enable send for empty transcription', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} transcript="" />);

    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });
});
