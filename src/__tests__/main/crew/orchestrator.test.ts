// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../../../main/crew/orchestrator';
import type { Plan, TaskGroup } from '../../../shared/types/task-group';
import type { SharedMemory } from '../../../shared/types/project';

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Orchestrator', () => {
  let mockMemoryRead: ReturnType<typeof vi.fn>;
  let mockMemoryWrite: ReturnType<typeof vi.fn>;
  let mockCreateTicket: ReturnType<typeof vi.fn>;
  let orchestrator: Orchestrator;

  const defaultMemory: SharedMemory = {
    projectId: 'proj-1',
    projectState: {
      phase: 'foundation',
      techStack: [],
      completedFeatures: [],
      activeConventions: [],
    },
    decisionLog: [],
    errorHistory: [],
    userPreferences: {
      communicationStyle: 'concise',
      knowledgeLevel: 'intermediate',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMemoryRead = vi.fn().mockResolvedValue({ success: true, data: defaultMemory });
    mockMemoryWrite = vi.fn().mockResolvedValue({ success: true });
    mockCreateTicket = vi.fn().mockResolvedValue({ success: true, data: { id: 'ticket-1', title: 'Task', status: 'Backlog' } });
    orchestrator = new Orchestrator({
      readMemory: mockMemoryRead as never,
      writeMemory: mockMemoryWrite as never,
      createTicket: mockCreateTicket as never,
    });
  });

  describe('Plan generation', () => {
    it('should produce at least one TaskGroup for simple request', () => {
      const plan = orchestrator.decompose('Add a login button');

      expect(plan.taskGroups.length).toBeGreaterThanOrEqual(1);
    });

    it('should produce multiple TaskGroups for complex request', () => {
      const plan = orchestrator.decompose(
        'Build a full authentication system with login page, OAuth integration, and session management',
      );

      expect(plan.taskGroups.length).toBeGreaterThan(1);
    });

    it('should include description and acceptance criteria per TaskGroup', () => {
      const plan = orchestrator.decompose('Add a login button');

      for (const group of plan.taskGroups) {
        expect(group.description).toBeTruthy();
        expect(group.acceptanceCriteria.length).toBeGreaterThan(0);
      }
    });

    it('should assign frontend tasks to Builder or Stylist', () => {
      const plan = orchestrator.decompose('Build a login page UI');

      const frontendTasks = plan.taskGroups.filter(
        (g) => g.description.toLowerCase().includes('ui') || g.description.toLowerCase().includes('page'),
      );
      for (const task of frontendTasks) {
        expect(['builder', 'stylist']).toContain(task.assignedTo);
      }
    });

    it('should assign backend tasks to Engineer', () => {
      const plan = orchestrator.decompose('Set up API routes and database schema');

      const backendTasks = plan.taskGroups.filter(
        (g) => g.description.toLowerCase().includes('api') || g.description.toLowerCase().includes('database'),
      );
      for (const task of backendTasks) {
        expect(task.assignedTo).toBe('engineer');
      }
    });

    it('should set correct dependencies between TaskGroups', () => {
      const plan = orchestrator.decompose(
        'Build authentication: first create the API, then build the login UI that uses it',
      );

      // At least one task should have dependencies
      const withDeps = plan.taskGroups.filter((g) => g.dependencies.length > 0);
      if (plan.taskGroups.length > 1) {
        expect(withDeps.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Plan execution', () => {
    it('should display plan before execution begins', () => {
      const plan = orchestrator.decompose('Add a button');

      expect(plan.summary).toBeTruthy();
      expect(plan.taskGroups.length).toBeGreaterThan(0);
      // Plan exists for display before execute is called
    });

    it('should wait for user confirmation before proceeding', async () => {
      const plan = orchestrator.decompose('Add a button');

      // execute not called yet — no tickets created
      expect(mockCreateTicket).not.toHaveBeenCalled();
    });

    it('should create Linear tickets for each TaskGroup', async () => {
      const plan = orchestrator.decompose('Add a login button');

      await orchestrator.execute(plan);

      expect(mockCreateTicket).toHaveBeenCalledTimes(plan.taskGroups.length);
    });

    it('should route completed tasks to Reviewer', async () => {
      const plan = orchestrator.decompose('Add a button');

      await orchestrator.execute(plan);

      // After execution, completed tasks should be routed to reviewer
      for (const group of plan.taskGroups) {
        if (group.dependencies.length === 0) {
          expect(group.status).toBe('complete');
        }
      }
    });

    it('should keep blocked tasks Queued until dependency is Approved', () => {
      const plan = orchestrator.decompose(
        'Build auth API first, then login page that depends on it',
      );

      const blockedTasks = plan.taskGroups.filter((g) => g.dependencies.length > 0);
      for (const task of blockedTasks) {
        expect(task.status).toBe('queued');
      }
    });
  });

  describe('Memory updates', () => {
    it('should write decisions to decisionLog in memory.json', async () => {
      const plan = orchestrator.decompose('Add a feature');

      await orchestrator.execute(plan);

      expect(mockMemoryWrite).toHaveBeenCalled();
      const writeCall = mockMemoryWrite.mock.calls[0][0];
      expect(writeCall.decisionLog).toBeDefined();
      expect(writeCall.decisionLog.length).toBeGreaterThan(0);
    });

    it('should update memory after significant decisions', async () => {
      const plan = orchestrator.decompose('Refactor the auth module');

      await orchestrator.execute(plan);

      expect(mockMemoryWrite).toHaveBeenCalledTimes(1);
    });
  });
});
