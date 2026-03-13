import { useState, type ReactNode } from 'react';

interface SpeechBubbleProps {
  lastOutput: string | null;
  filesChanged: string[];
  isActive: boolean;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

export function SpeechBubble({ lastOutput, filesChanged, isActive }: SpeechBubbleProps): ReactNode {
  const [showDetail, setShowDetail] = useState(false);

  if (!isActive || lastOutput === null) {
    return null;
  }

  if (showDetail) {
    return (
      <div data-testid="detail-view" className="rounded border border-gray-600 bg-gray-800 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Details</span>
          <button
            data-testid="close-detail"
            onClick={() => setShowDetail(false)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
        <p className="mb-2 text-sm text-gray-200">{lastOutput}</p>
        {filesChanged.length > 0 && (
          <div>
            <span className="text-xs text-gray-400">Files changed:</span>
            <ul className="mt-1 space-y-0.5">
              {filesChanged.map((file) => (
                <li key={file} className="text-xs text-gray-300">
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="speech-bubble"
      onClick={() => setShowDetail(true)}
      className="cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5"
    >
      <span data-testid="bubble-text" className="text-xs text-gray-300">
        {truncate(lastOutput, 80)}
      </span>
    </div>
  );
}
