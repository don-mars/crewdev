import { useState, useEffect } from 'react';

export function useCrewOutput(crewId: string): string[] {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const cleanup = window.crewdev.crew.onOutput(crewId, (line: string) => {
      setLines((prev) => [...prev, line]);
    });

    return cleanup;
  }, [crewId]);

  return lines;
}
