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
  FEATURE_CREATE,
  FEATURE_READ,
  FEATURE_UPDATE,
  FEATURE_DELETE,
  FEATURE_LOAD_TREE,
  PLANNING_UPLOAD,
  PLANNING_CREATE,
  PLANNING_LIST,
  PLANNING_DELETE,
  GAMIFICATION_GET_STATE,
  GAMIFICATION_RECORD_COMPLETION,
  GAMIFICATION_ROLL_BUILD_QUALITY,
  ONBOARDING_GET_PROGRESS,
  ONBOARDING_STEP_COMPLETE,
  ONBOARDING_SKIP,
  ONBOARDING_DETECT_FIRST_RUN,
  NERVE_MAP_SCAN,
  KNOWLEDGE_GET_PROFILE,
  KNOWLEDGE_UPDATE_LEVEL,
  KNOWLEDGE_ADAPT_TEXT,
  LINEAR_SYNC,
  LINEAR_CREATE_ISSUE,
  LINEAR_LIST_ISSUES,
  LINEAR_UPDATE_STATUS,
  LINEAR_POST_COMMENT,
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
    create: (name: string, dirPath: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_CREATE, name, dirPath),
    list: (dirPath: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_LIST, dirPath),
    select: (dirPath: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_SELECT, dirPath),
    gitConnect: (dirPath: string): Promise<unknown> =>
      ipcRenderer.invoke(PROJECT_GIT_CONNECT, dirPath),
  },
  memory: {
    read: (): Promise<unknown> =>
      ipcRenderer.invoke(MEMORY_READ),
    write: (patch: unknown): Promise<unknown> =>
      ipcRenderer.invoke(MEMORY_WRITE, patch),
  },
  feature: {
    create: (input: unknown): Promise<unknown> =>
      ipcRenderer.invoke(FEATURE_CREATE, input),
    read: (id: string): Promise<unknown> =>
      ipcRenderer.invoke(FEATURE_READ, id),
    update: (id: string, updates: unknown): Promise<unknown> =>
      ipcRenderer.invoke(FEATURE_UPDATE, id, updates),
    delete: (id: string): Promise<unknown> =>
      ipcRenderer.invoke(FEATURE_DELETE, id),
    loadTree: (): Promise<unknown> =>
      ipcRenderer.invoke(FEATURE_LOAD_TREE),
  },
  planning: {
    upload: (sourcePath: string, fileName: string): Promise<unknown> =>
      ipcRenderer.invoke(PLANNING_UPLOAD, sourcePath, fileName),
    create: (name: string): Promise<unknown> =>
      ipcRenderer.invoke(PLANNING_CREATE, name),
    list: (): Promise<unknown> =>
      ipcRenderer.invoke(PLANNING_LIST),
    delete: (fileName: string): Promise<unknown> =>
      ipcRenderer.invoke(PLANNING_DELETE, fileName),
  },
  gamification: {
    getState: (): Promise<unknown> =>
      ipcRenderer.invoke(GAMIFICATION_GET_STATE),
    recordCompletion: (): Promise<unknown> =>
      ipcRenderer.invoke(GAMIFICATION_RECORD_COMPLETION),
    rollBuildQuality: (): Promise<unknown> =>
      ipcRenderer.invoke(GAMIFICATION_ROLL_BUILD_QUALITY),
  },
  onboarding: {
    getProgress: (): Promise<unknown> =>
      ipcRenderer.invoke(ONBOARDING_GET_PROGRESS),
    stepComplete: (step: string): Promise<unknown> =>
      ipcRenderer.invoke(ONBOARDING_STEP_COMPLETE, step),
    skip: (step: string): Promise<unknown> =>
      ipcRenderer.invoke(ONBOARDING_SKIP, step),
    detectFirstRun: (): Promise<unknown> =>
      ipcRenderer.invoke(ONBOARDING_DETECT_FIRST_RUN),
  },
  nerveMap: {
    scan: (rootDir: string): Promise<unknown> =>
      ipcRenderer.invoke(NERVE_MAP_SCAN, rootDir),
  },
  knowledge: {
    getProfile: (): Promise<unknown> =>
      ipcRenderer.invoke(KNOWLEDGE_GET_PROFILE),
    updateLevel: (concept: string, level: number): Promise<unknown> =>
      ipcRenderer.invoke(KNOWLEDGE_UPDATE_LEVEL, concept, level),
    adaptText: (text: string): Promise<unknown> =>
      ipcRenderer.invoke(KNOWLEDGE_ADAPT_TEXT, text),
  },
  linear: {
    sync: (token: string): Promise<unknown> =>
      ipcRenderer.invoke(LINEAR_SYNC, token),
    createIssue: (input: unknown): Promise<unknown> =>
      ipcRenderer.invoke(LINEAR_CREATE_ISSUE, input),
    listIssues: (teamId: string): Promise<unknown> =>
      ipcRenderer.invoke(LINEAR_LIST_ISSUES, teamId),
    updateStatus: (ticketId: string, stateId: string): Promise<unknown> =>
      ipcRenderer.invoke(LINEAR_UPDATE_STATUS, ticketId, stateId),
    postComment: (ticketId: string, text: string): Promise<unknown> =>
      ipcRenderer.invoke(LINEAR_POST_COMMENT, ticketId, text),
  },
};

contextBridge.exposeInMainWorld('crewdev', crewdevApi);
