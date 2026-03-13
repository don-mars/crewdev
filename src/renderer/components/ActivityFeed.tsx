import { useRef, useEffect, useState, type ReactNode } from 'react';
import type { ActivityEntry } from '../../shared/types/activity';

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

const SCROLL_THRESHOLD = 50;

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ActivityFeed({ entries }: ActivityFeedProps): ReactNode {
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  function handleScroll(): void {
    const el = feedRef.current;
    if (!el) {
      return;
    }

    const isAtBottom = el.scrollHeight - el.clientHeight - el.scrollTop <= SCROLL_THRESHOLD;
    setAutoScroll(isAtBottom);
  }

  if (entries.length === 0) {
    return (
      <div
        data-testid="activity-feed"
        className="flex h-full items-center justify-center text-gray-500"
      >
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      data-testid="activity-feed"
      onScroll={handleScroll}
      className="h-full overflow-y-auto"
    >
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-gray-800 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-semibold text-blue-400">{entry.crewName}</span>
              <span>{formatTime(entry.timestamp)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-200">{entry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
