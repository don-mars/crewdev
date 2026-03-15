import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore } from '../../../renderer/stores/activity-store';
import type { ActivityEntry } from '../../../shared/types/activity';

const MOCK_ENTRY: ActivityEntry = {
  id: 'act-1',
  crewName: 'backend-crew',
  message: 'Started code review',
  timestamp: '2026-03-12T10:00:00Z',
};

const MOCK_ENTRY_2: ActivityEntry = {
  id: 'act-2',
  crewName: 'frontend-crew',
  message: 'Deployed component',
  timestamp: '2026-03-12T10:05:00Z',
};

describe('Activity Zustand store', () => {
  beforeEach(() => {
    useActivityStore.setState({ entries: [] });
  });

  it('should have empty entries as initial state', () => {
    expect(useActivityStore.getState().entries).toEqual([]);
  });

  it('should add an entry to the list', () => {
    useActivityStore.getState().addEntry(MOCK_ENTRY);

    expect(useActivityStore.getState().entries).toHaveLength(1);
    expect(useActivityStore.getState().entries[0]).toEqual(MOCK_ENTRY);
  });

  it('should clear all entries', () => {
    useActivityStore.getState().addEntry(MOCK_ENTRY);
    useActivityStore.getState().addEntry(MOCK_ENTRY_2);
    expect(useActivityStore.getState().entries).toHaveLength(2);

    useActivityStore.getState().clear();

    expect(useActivityStore.getState().entries).toEqual([]);
  });

  it('should store entries newest-last (push order)', () => {
    useActivityStore.getState().addEntry(MOCK_ENTRY);
    useActivityStore.getState().addEntry(MOCK_ENTRY_2);

    const entries = useActivityStore.getState().entries;
    expect(entries[0].id).toBe('act-1');
    expect(entries[1].id).toBe('act-2');
  });
});
