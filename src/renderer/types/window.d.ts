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
    create: (data: unknown) => Promise<unknown>;
    list: () => Promise<unknown>;
    select: (id: string) => Promise<unknown>;
    gitConnect: (dirPath: string) => Promise<unknown>;
  };
  memory: {
    read: () => Promise<unknown>;
    write: (patch: unknown) => Promise<unknown>;
  };
}

declare global {
  interface Window {
    crewdev: CrewDevApi;
  }
}

export {};
