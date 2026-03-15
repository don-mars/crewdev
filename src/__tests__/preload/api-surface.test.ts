import { describe, it, expect, vi, beforeEach } from 'vitest';

let exposedApi: Record<string, unknown> = {};

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((_key: string, api: Record<string, unknown>) => {
      exposedApi = api;
    }),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe('Preload API surface', () => {
  beforeEach(async () => {
    exposedApi = {};
    vi.resetModules();
    await import('../../preload/index');
  });

  it('should expose crew namespace with spawn, kill, killAll, sendInput, onOutput, onStatus', () => {
    const crew = exposedApi.crew as Record<string, unknown>;
    expect(typeof crew.spawn).toBe('function');
    expect(typeof crew.kill).toBe('function');
    expect(typeof crew.killAll).toBe('function');
    expect(typeof crew.sendInput).toBe('function');
    expect(typeof crew.onOutput).toBe('function');
    expect(typeof crew.onStatus).toBe('function');
  });

  it('should expose project namespace with create, list, select, gitConnect', () => {
    const project = exposedApi.project as Record<string, unknown>;
    expect(typeof project.create).toBe('function');
    expect(typeof project.list).toBe('function');
    expect(typeof project.select).toBe('function');
    expect(typeof project.gitConnect).toBe('function');
  });

  it('should expose memory namespace with read, write', () => {
    const memory = exposedApi.memory as Record<string, unknown>;
    expect(typeof memory.read).toBe('function');
    expect(typeof memory.write).toBe('function');
  });

  it('should expose feature namespace with create, read, update, delete, loadTree', () => {
    const feature = exposedApi.feature as Record<string, unknown>;
    expect(typeof feature.create).toBe('function');
    expect(typeof feature.read).toBe('function');
    expect(typeof feature.update).toBe('function');
    expect(typeof feature.delete).toBe('function');
    expect(typeof feature.loadTree).toBe('function');
  });

  it('should expose planning namespace with upload, create, list, delete', () => {
    const planning = exposedApi.planning as Record<string, unknown>;
    expect(typeof planning.upload).toBe('function');
    expect(typeof planning.create).toBe('function');
    expect(typeof planning.list).toBe('function');
    expect(typeof planning.delete).toBe('function');
  });

  it('should expose gamification namespace with getState, recordCompletion, rollBuildQuality', () => {
    const gamification = exposedApi.gamification as Record<string, unknown>;
    expect(typeof gamification.getState).toBe('function');
    expect(typeof gamification.recordCompletion).toBe('function');
    expect(typeof gamification.rollBuildQuality).toBe('function');
  });

  it('should expose onboarding namespace with getProgress, stepComplete, skip, detectFirstRun', () => {
    const onboarding = exposedApi.onboarding as Record<string, unknown>;
    expect(typeof onboarding.getProgress).toBe('function');
    expect(typeof onboarding.stepComplete).toBe('function');
    expect(typeof onboarding.skip).toBe('function');
    expect(typeof onboarding.detectFirstRun).toBe('function');
  });

  it('should expose nerveMap namespace with scan', () => {
    const nerveMap = exposedApi.nerveMap as Record<string, unknown>;
    expect(typeof nerveMap.scan).toBe('function');
  });

  it('should expose knowledge namespace with getProfile, updateLevel, adaptText', () => {
    const knowledge = exposedApi.knowledge as Record<string, unknown>;
    expect(typeof knowledge.getProfile).toBe('function');
    expect(typeof knowledge.updateLevel).toBe('function');
    expect(typeof knowledge.adaptText).toBe('function');
  });

  it('should expose linear namespace with sync, createIssue, listIssues', () => {
    const linear = exposedApi.linear as Record<string, unknown>;
    expect(typeof linear.sync).toBe('function');
    expect(typeof linear.createIssue).toBe('function');
    expect(typeof linear.listIssues).toBe('function');
  });
});
