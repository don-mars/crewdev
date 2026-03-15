// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type {
  SharedMemory,
  DecisionEntry,
  ErrorHistoryEntry,
  ProjectState,
  UserPreferences,
} from '../../../shared/types/project';
import { createDefaultMemory } from '../../../shared/types/project';

describe('SharedMemory schema (overview spec)', () => {
  it('should have projectState with phase, techStack, completedFeatures, activeConventions', () => {
    const mem = createDefaultMemory('test-1');
    expect(mem.projectState).toBeDefined();
    expect(mem.projectState.phase).toBe('foundation');
    expect(Array.isArray(mem.projectState.techStack)).toBe(true);
    expect(Array.isArray(mem.projectState.completedFeatures)).toBe(true);
    expect(Array.isArray(mem.projectState.activeConventions)).toBe(true);
  });

  it('should have decisionLog as array of { date, decision, rationale }', () => {
    const mem = createDefaultMemory('test-1');
    expect(Array.isArray(mem.decisionLog)).toBe(true);

    // Verify shape by creating a sample entry
    const entry: DecisionEntry = {
      date: '2026-03-12',
      decision: 'Use React',
      rationale: 'Team knows it',
    };
    expect(entry.date).toBeDefined();
    expect(entry.decision).toBeDefined();
    expect(entry.rationale).toBeDefined();
  });

  it('should have errorHistory as array of { date, error, resolution }', () => {
    const mem = createDefaultMemory('test-1');
    expect(Array.isArray(mem.errorHistory)).toBe(true);

    const entry: ErrorHistoryEntry = {
      date: '2026-03-12',
      error: 'Build failed',
      resolution: 'Fixed import path',
    };
    expect(entry.date).toBeDefined();
    expect(entry.error).toBeDefined();
    expect(entry.resolution).toBeDefined();
  });

  it('should have userPreferences with communicationStyle, knowledgeLevel', () => {
    const mem = createDefaultMemory('test-1');
    expect(mem.userPreferences).toBeDefined();
    expect(typeof mem.userPreferences.communicationStyle).toBe('string');
    expect(typeof mem.userPreferences.knowledgeLevel).toBe('string');
  });

  it('should still have projectId', () => {
    const mem = createDefaultMemory('abc-123');
    expect(mem.projectId).toBe('abc-123');
  });

  it('createDefaultMemory should return valid empty state', () => {
    const mem = createDefaultMemory('test-1');
    expect(mem.projectId).toBe('test-1');
    expect(mem.decisionLog).toEqual([]);
    expect(mem.errorHistory).toEqual([]);
    expect(mem.projectState.phase).toBe('foundation');
    expect(mem.userPreferences.communicationStyle).toBe('concise');
    expect(mem.userPreferences.knowledgeLevel).toBe('intermediate');
  });
});
