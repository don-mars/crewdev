// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectContext } from '../../../main/project/project-context';
import type { ProjectMetadata } from '../../../shared/types/project';

const TEST_DATA_DIR = '/mock/userData';

describe('ProjectContext', () => {
  let ctx: ProjectContext;

  beforeEach(() => {
    ctx = new ProjectContext(TEST_DATA_DIR);
  });

  describe('before any project is set', () => {
    it('getProject returns null', () => {
      expect(ctx.getProject()).toBeNull();
    });

    it('requireProject throws with NO_ACTIVE_PROJECT', () => {
      expect(() => ctx.requireProject()).toThrowError('No active project');
    });

    it('derived getters throw when no project is set', () => {
      expect(() => ctx.featuresDir).toThrowError('No active project');
      expect(() => ctx.planningDir).toThrowError('No active project');
      expect(() => ctx.memoryPath).toThrowError('No active project');
      expect(() => ctx.crewDir).toThrowError('No active project');
      expect(() => ctx.knowledgePath).toThrowError('No active project');
    });
  });

  describe('after setting a project', () => {
    const project: ProjectMetadata = {
      id: 'test-id',
      name: 'Test Project',
      dirPath: '/projects/test',
      createdAt: '2026-03-13',
    };

    beforeEach(() => {
      ctx.setProject(project);
    });

    it('getProject returns the set project', () => {
      expect(ctx.getProject()).toEqual(project);
    });

    it('requireProject returns the set project', () => {
      expect(ctx.requireProject()).toEqual(project);
    });

    it('featuresDir resolves to .crewdev/features inside project dir', () => {
      expect(ctx.featuresDir).toBe('/projects/test/.crewdev/features');
    });

    it('planningDir resolves to .crewdev/planning inside project dir', () => {
      expect(ctx.planningDir).toBe('/projects/test/.crewdev/planning');
    });

    it('memoryPath resolves to .crewdev/memory.json inside project dir', () => {
      expect(ctx.memoryPath).toBe('/projects/test/.crewdev/memory.json');
    });

    it('crewDir resolves to .crewdev/crew inside project dir', () => {
      expect(ctx.crewDir).toBe('/projects/test/.crewdev/crew');
    });

    it('knowledgePath resolves to .crewdev/knowledge.json inside project dir', () => {
      expect(ctx.knowledgePath).toBe('/projects/test/.crewdev/knowledge.json');
    });
  });

  describe('dataDir getter', () => {
    it('returns the global data directory passed to constructor', () => {
      expect(ctx.dataDir).toBe(TEST_DATA_DIR);
    });
  });

  describe('setProject replaces previous project', () => {
    it('updates all paths when project changes', () => {
      const project1: ProjectMetadata = {
        id: 'p1',
        name: 'Project 1',
        dirPath: '/projects/one',
        createdAt: '2026-03-13',
      };
      const project2: ProjectMetadata = {
        id: 'p2',
        name: 'Project 2',
        dirPath: '/projects/two',
        createdAt: '2026-03-13',
      };

      ctx.setProject(project1);
      expect(ctx.featuresDir).toBe('/projects/one/.crewdev/features');

      ctx.setProject(project2);
      expect(ctx.featuresDir).toBe('/projects/two/.crewdev/features');
    });
  });
});
