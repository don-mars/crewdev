import type { ReactNode } from 'react';
import type { CrewStatus } from '../../shared/types/crew';

const EMOTES: Record<CrewStatus, string> = {
  idle: '\u{1F634}',      // 😴
  running: '\u{1F3C3}',   // 🏃
  thinking: '\u{1F914}',  // 🤔
  working: '\u{26A1}',    // ⚡
  waiting: '\u{23F3}',    // ⏳
  error: '\u{274C}',      // ❌
  finished: '\u{2705}',   // ✅
};

interface CrewEmoteProps {
  status: CrewStatus;
}

export function CrewEmote({ status }: CrewEmoteProps): ReactNode {
  return (
    <span data-testid="emote" className="text-2xl">
      {EMOTES[status]}
    </span>
  );
}
