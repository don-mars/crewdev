import { join } from 'node:path';
import type { ProjectMetadata } from '../../shared/types/project';
import { createCrewDevError } from '../../shared/types/errors';

export class ProjectContext {
  private project: ProjectMetadata | null = null;
  private readonly _dataDir: string;

  constructor(dataDir: string) {
    this._dataDir = dataDir;
  }

  get dataDir(): string {
    return this._dataDir;
  }

  setProject(meta: ProjectMetadata): void {
    this.project = meta;
  }

  getProject(): ProjectMetadata | null {
    return this.project;
  }

  requireProject(): ProjectMetadata {
    if (!this.project) {
      throw createCrewDevError('NO_ACTIVE_PROJECT', 'No active project');
    }
    return this.project;
  }

  get featuresDir(): string {
    return join(this.requireProject().dirPath, '.crewdev', 'features');
  }

  get planningDir(): string {
    return join(this.requireProject().dirPath, '.crewdev', 'planning');
  }

  get memoryPath(): string {
    return join(this.requireProject().dirPath, '.crewdev', 'memory.json');
  }

  get crewDir(): string {
    return join(this.requireProject().dirPath, '.crewdev', 'crew');
  }

  get knowledgePath(): string {
    return join(this.requireProject().dirPath, '.crewdev', 'knowledge.json');
  }
}
