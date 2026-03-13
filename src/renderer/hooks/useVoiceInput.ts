import { useState, useCallback, useRef } from 'react';

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface UseVoiceInputReturn {
  isSupported: boolean;
  isRecording: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  _recognition: SpeechRecognitionLike | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const g = globalThis as any;
  return g.webkitSpeechRecognition ?? g.SpeechRecognition ?? null;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const Ctor = getSpeechRecognitionCtor();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      if (result?.[0]?.transcript) {
        setTranscript(result[0].transcript);
      }
    };

    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError(null);
  }, [Ctor]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return {
    isSupported: Ctor !== null,
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    _recognition: recognitionRef.current,
  };
}
