import { contextBridge, ipcRenderer } from 'electron';
import {
  CREW_SPAWN,
  CREW_KILL,
  CREW_KILL_ALL,
  CREW_SEND_INPUT,
  CREW_OUTPUT,
  CREW_STATUS,
  PROJECT_CREATE,
  PROJECT_LIST,
  PROJECT_SELECT,
  PROJECT_GIT_CONNECT,
  MEMORY_READ,
  MEMORY_WRITE,
} from '../shared/constants/ipc';

const crewdevApi = {
  crew: {
    spawn: (config: unknown): Promise<unknown> =>
      ipcRenderer.invoke(CREW_SPAWN, config),
    kill: (id: string): Promise<unknown> =>
      ipcRenderer.invoke(CREW_KILL, id),
    killAll: (): Promise<unknown> =>
      ipcRenderer.invoke(CREW_KILL_ALL),
    sendInput: (id: string, message: string): Promise<unknown> =>
      ipcRenderer.invoke(CREW_SEND_INPUT, id, message),
    onOutput: (id: string, callback: (line: string) => void): (() => void) => {
      const channel = `${CREW_OUTPUT}:${id}`;
      const handler = (_event: unknown, line: string): void => {
        callback(line);
      };
      ipcRenderer.on(channel, handler);
      return () => {
        ipcRenderer.removeListener(channel, handler);
      };
    },
    onStatus: (id: string, callback: (status: string) => void): (() => void) => {
      const channel = `${CREW_STATUS}:${id}`;
      const handler = (_event: unknown, status: string): void => {
        callback(status);
      };
      ipcRenderer.on(channel, handler);
      return () => {
        ipcRenderer.removeListener(channel, handler);
      };
    },
  },
  project: {
    create: (data: unknown): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_CREATE, data),
    list: (): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_LIST),
    select: (id: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_SELECT, id),
    gitConnect: (dirPath: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_GIT_CONNECT, dirPath),
  },
  memory: {
    read: (): Promise<unknown> =>
      ipcRenderer.invoke(MEMORY_READ),
    write: (patch: unknown): Promise<unknown> =>
      ipcRenderer.invoke(MEMORY_WRITE, patch),
  },
};

contextBridge.exposeInMainWorld('crewdev', crewdevApi);
