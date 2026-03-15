import type { WebContents } from 'electron';
import type { CrewStatus } from '../../shared/types/crew';
import { CREW_OUTPUT, CREW_STATUS } from '../../shared/constants/ipc';
import { logger } from '../../shared/utils/logger';

export type OutputHandler = (id: string, line: string) => void;
export type StatusHandler = (id: string, status: CrewStatus) => void;

export function registerCrewOutputHandler(webContents: WebContents): OutputHandler {
  return (id: string, line: string): void => {
    const channel = `${CREW_OUTPUT}:${id}`;
    webContents.send(channel, line);
  };
}

export function registerCrewStatusHandler(webContents: WebContents): StatusHandler {
  return (id: string, status: CrewStatus): void => {
    const channel = `${CREW_STATUS}:${id}`;
    webContents.send(channel, status);
  };
}

export function parseStatusFromLine(line: string): CrewStatus | null {
  try {
    const parsed = JSON.parse(line) as { type?: string };
    if (parsed.type === 'assistant' || parsed.type === 'thinking') {
      return 'thinking';
    }
    if (parsed.type === 'tool_use' || parsed.type === 'tool_result') {
      return 'working';
    }
    if (parsed.type === 'result') {
      return 'finished';
    }
  } catch (err: unknown) {
    logger.debug('Non-JSON output line, skipping status parse', { error: String(err) });
  }
  return null;
}
