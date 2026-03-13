import { useState, type KeyboardEvent, type ReactNode } from 'react';

interface ChatInputProps {
  activeCrewId: string | null;
  onMessageSent: (message: string) => void;
}

export function ChatInput({ activeCrewId, onMessageSent }: ChatInputProps): ReactNode {
  const [message, setMessage] = useState('');

  const isDisabled = !activeCrewId;
  const isSendDisabled = isDisabled || message.trim() === '';

  function handleSend(): void {
    if (isSendDisabled) {
      return;
    }

    const trimmed = message.trim();
    window.crewdev.crew.sendInput(activeCrewId, trimmed);
    onMessageSent(trimmed);
    setMessage('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && !isSendDisabled) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={isDisabled ? 'No active crew member' : 'Type a message...'}
        className="flex-1 rounded bg-gray-800 px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={isSendDisabled}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
