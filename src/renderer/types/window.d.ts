interface CrewDevApi {
  crew: {
    spawn: (config: unknown) => Promise<unknown>;
    kill: (id: string) => Promise<unknown>;
    killAll: () => Promise<unknown>;
    sendInput: (id: string, message: string) => Promise<unknown>;
    onOutput: (id: string, callback: (line: string) => void) => () => void;
    onStatus: (id: string, callback: (status: string) => void) => () => void;
  };
  project: {
    create: (name: string, dirPath: string) => Promise<unknown>;
    list: (dirPath: string) => Promise<unknown>;
    select: (dirPath: string) => Promise<unknown>;
    gitConnect: (dirPath: string) => Promise<unknown>;
  };
  memory: {
    read: () => Promise<unknown>;
    write: (patch: unknown) => Promise<unknown>;
  };
  feature: {
    create: (input: unknown) => Promise<unknown>;
    read: (id: string) => Promise<unknown>;
    update: (id: string, updates: unknown) => Promise<unknown>;
    delete: (id: string) => Promise<unknown>;
    loadTree: () => Promise<unknown>;
  };
  planning: {
    upload: (sourcePath: string, fileName: string) => Promise<unknown>;
    create: (name: string) => Promise<unknown>;
    list: () => Promise<unknown>;
    delete: (fileName: string) => Promise<unknown>;
  };
  gamification: {
    getState: () => Promise<unknown>;
    recordCompletion: () => Promise<unknown>;
    rollBuildQuality: () => Promise<unknown>;
  };
  onboarding: {
    getProgress: () => Promise<unknown>;
    stepComplete: (step: string) => Promise<unknown>;
    skip: (step: string) => Promise<unknown>;
    detectFirstRun: () => Promise<unknown>;
  };
  nerveMap: {
    scan: (rootDir: string) => Promise<unknown>;
  };
  knowledge: {
    getProfile: () => Promise<unknown>;
    updateLevel: (concept: string, level: number) => Promise<unknown>;
    adaptText: (text: string) => Promise<unknown>;
  };
  linear: {
    sync: (token: string) => Promise<unknown>;
    createIssue: (input: unknown) => Promise<unknown>;
    listIssues: (teamId: string) => Promise<unknown>;
    updateStatus: (ticketId: string, stateId: string) => Promise<unknown>;
    postComment: (ticketId: string, text: string) => Promise<unknown>;
  };
}

declare global {
  interface Window {
    crewdev: CrewDevApi;
  }
}

export {};
