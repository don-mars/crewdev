import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';

interface BoilItDownProps {
  text: string;
  onCleaned: (cleanedText: string) => void;
  cleanupFn: (text: string) => Promise<{ success: boolean; data?: string; error?: string }>;
}

export function BoilItDown({ text, onCleaned, cleanupFn }: BoilItDownProps): ReactNode {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCleanup = useCallback(async () => {
    if (!text.trim() || processing) return;

    setProcessing(true);
    setErrorMsg(null);

    const result = await cleanupFn(text);

    if (result.success && result.data) {
      onCleaned(result.data);
    } else {
      setErrorMsg('Could not clean up text. Please edit manually.');
    }

    setProcessing(false);
  }, [text, processing, cleanupFn, onCleaned]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCleanup}
        aria-label="Boil It Down"
        disabled={processing || !text.trim()}
        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Cleaning...' : 'Boil It Down'}
      </button>
      {errorMsg && <span className="text-red-400 text-xs">{errorMsg}</span>}
    </div>
  );
}
