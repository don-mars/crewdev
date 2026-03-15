import { useEffect } from 'react';
import type { ActivityEntry } from '../../shared/types/activity';
import type { CrewMember } from '../stores/crew-store';

export function useCrewActivityBridge(
  activeIds: string[],
  members: CrewMember[],
  addEntry: (entry: ActivityEntry) => void,
): void {
  useEffect(() => {
    if (activeIds.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    for (const id of activeIds) {
      const member = members.find((m) => m.id === id);
      const crewName = member?.name ?? id;

      const unsub = window.crewdev.crew.onOutput(id, (line: string) => {
        addEntry({
          id: `output-${id}-${Date.now()}`,
          crewName,
          message: line,
          timestamp: new Date().toISOString(),
        });
      });
      unsubscribers.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [activeIds, members, addEntry]);
}
