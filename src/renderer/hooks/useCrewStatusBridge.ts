import { useEffect } from 'react';
import type { CrewStatus } from '../../shared/types/crew';

export function useCrewStatusBridge(
  activeIds: string[],
  updateStatus: (id: string, status: CrewStatus) => void,
): void {
  useEffect(() => {
    if (activeIds.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    for (const id of activeIds) {
      const unsub = window.crewdev.crew.onStatus(id, (status: string) => {
        updateStatus(id, status as CrewStatus);
      });
      unsubscribers.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [activeIds, updateStatus]);
}
