import { CREW_OUTPUT } from '../../shared/constants/ipc';

type OutputHandler = (crewId: string, line: string) => void;

export function registerCrewOutputHandler(
  webContents: Electron.WebContents,
): OutputHandler {
  return (crewId: string, line: string): void => {
    webContents.send(`${CREW_OUTPUT}:${crewId}`, line);
  };
}
