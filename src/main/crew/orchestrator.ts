import type { Plan, TaskGroup } from '../../shared/types/task-group';
import type { SharedMemory, DecisionEntry } from '../../shared/types/project';
import { logger } from '../../shared/utils/logger';

interface OrchestratorDeps {
  readMemory: () => Promise<{ success: boolean; data?: SharedMemory }>;
  writeMemory: (patch: Partial<SharedMemory>) => Promise<{ success: boolean }>;
  createTicket: (input: {
    title: string;
    description?: string;
  }) => Promise<{ success: boolean; data?: { id: string; title: string; status: string } }>;
}

const FRONTEND_KEYWORDS = ['ui', 'page', 'button', 'form', 'layout', 'style', 'component', 'display', 'view'];
const BACKEND_KEYWORDS = ['api', 'database', 'schema', 'route', 'endpoint', 'server', 'migration'];
const STYLE_KEYWORDS = ['style', 'layout', 'css', 'theme', 'design'];

export class Orchestrator {
  private deps: OrchestratorDeps;
  private nextId = 0;

  constructor(deps: OrchestratorDeps) {
    this.deps = deps;
  }

  private generateId(): string {
    return `tg-${++this.nextId}`;
  }

  decompose(request: string): Plan {
    const { segments, sequential } = this.extractSegments(request);
    const taskGroups: TaskGroup[] = [];

    for (let i = 0; i < segments.length; i++) {
      const id = this.generateId();
      const dependencies: string[] = [];
      if (sequential && i > 0) {
        dependencies.push(taskGroups[i - 1].id);
      }

      taskGroups.push({
        id,
        description: segments[i],
        acceptanceCriteria: [`${segments[i]} is implemented and working`],
        assignedTo: this.determineAssignee(segments[i]),
        dependencies,
        status: 'queued',
      });
    }

    return {
      taskGroups,
      summary: `Plan for: ${request}`,
    };
  }

  async execute(plan: Plan): Promise<void> {
    for (const group of plan.taskGroups) {
      await this.deps.createTicket({
        title: group.description,
        description: group.acceptanceCriteria.join('\n'),
      });
    }

    for (const group of plan.taskGroups) {
      if (group.dependencies.length === 0) {
        group.status = 'complete';
      }
    }

    const decisionLog: DecisionEntry[] = [
      {
        date: new Date().toISOString(),
        decision: `Executed plan: ${plan.summary}`,
        rationale: `Decomposed into ${plan.taskGroups.length} task group(s)`,
      },
    ];

    await this.deps.writeMemory({ decisionLog });
    logger.info('Plan executed', { taskGroups: plan.taskGroups.length });
  }

  private extractSegments(request: string): { segments: string[]; sequential: boolean } {
    // Pattern 1: "X: first Y, then Z"
    const colonFirstThen = request.match(/^(.+?):\s*first\s+(.+?),?\s*then\s+(.+)$/i);
    if (colonFirstThen) {
      return {
        segments: [colonFirstThen[2].trim(), colonFirstThen[3].trim()],
        sequential: true,
      };
    }

    // Pattern 2: "X first, then Y"
    const firstThen = request.match(/^(.+?)\s+first[,\s]+then\s+(.+)$/i);
    if (firstThen) {
      return {
        segments: [firstThen[1].trim(), firstThen[2].trim()],
        sequential: true,
      };
    }

    // Pattern 3: "X with A, B, and C"
    const withMatch = request.match(/^(.+?)\s+with\s+(.+)$/i);
    if (withMatch) {
      const items = this.splitList(withMatch[2]);
      if (items.length > 1) {
        return { segments: items, sequential: false };
      }
    }

    // Pattern 4: comma/and separated list
    const items = this.splitList(request);
    if (items.length > 1) {
      return { segments: items, sequential: false };
    }

    return { segments: [request], sequential: false };
  }

  private splitList(text: string): string[] {
    return text
      .split(/,\s*(?:and\s+)?|\s+and\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private determineAssignee(description: string): string {
    const lower = description.toLowerCase();

    if (STYLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      return 'stylist';
    }

    if (FRONTEND_KEYWORDS.some((kw) => lower.includes(kw))) {
      return 'builder';
    }

    if (BACKEND_KEYWORDS.some((kw) => lower.includes(kw))) {
      return 'engineer';
    }

    return 'builder';
  }
}
