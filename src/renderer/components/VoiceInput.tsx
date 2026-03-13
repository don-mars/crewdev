import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  transcript?: string;
}

const SILENCE_TIMEOUT_MS = 60_000;

export function VoiceInput({ onTranscript, transcript: externalTranscript }: VoiceInputProps): ReactNode {
  const { isSupported, isRecording, transcript: hookTranscript, startRecording, stopRecording } = useVoiceInput();
  const [localTranscript, setLocalTranscript] = useState(externalTranscript ?? '');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recording, setRecording] = useState(false);

  // Sync external transcript prop
  useEffect(() => {
    if (externalTranscript !== undefined) {
      setLocalTranscript(externalTranscript);
    }
  }, [externalTranscript]);

  // Sync hook transcript
  useEffect(() => {
    if (hookTranscript) {
      setLocalTranscript(hookTranscript);
      onTranscript(hookTranscript);
    }
  }, [hookTranscript, onTranscript]);

  const handleMicClick = useCallback(() => {
    if (recording) {
      stopRecording();
      setRecording(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      startRecording();
      setRecording(true);
      silenceTimerRef.current = setTimeout(() => {
        stopRecording();
        setRecording(false);
      }, SILENCE_TIMEOUT_MS);
    }
  }, [recording, startRecording, stopRecording]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalTranscript(e.target.value);
      onTranscript(e.target.value);
    },
    [onTranscript],
  );

  const handleSend = useCallback(() => {
    if (localTranscript.trim()) {
      onTranscript(localTranscript.trim());
    }
  }, [localTranscript, onTranscript]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleMicClick}
          aria-label="Microphone"
          disabled={!isSupported}
          className={`px-3 py-2 rounded ${recording ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'} hover:opacity-80`}
        >
          {recording ? '⏹' : '🎤'}
        </button>
        {recording && <span className="text-red-400 text-sm">Recording...</span>}
      </div>

      <textarea
        role="textbox"
        value={localTranscript}
        onChange={handleTextChange}
        placeholder="Transcription will appear here..."
        className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded resize-none"
        rows={3}
      />

      <button
        onClick={handleSend}
        aria-label="Send"
        disabled={!localTranscript.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}
