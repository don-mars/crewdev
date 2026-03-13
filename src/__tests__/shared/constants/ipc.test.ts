import { describe, it, expect } from 'vitest';
import * as IPC from '../../../shared/constants/ipc';

describe('IPC constants', () => {
  it('should export all channel names as string constants', () => {
    const entries = Object.entries(IPC);
    expect(entries.length).toBeGreaterThan(0);

    for (const [key, value] of entries) {
      expect(typeof value).toBe('string');
      expect(value).not.toBe('');
    }
  });

  it('should have no duplicate channel names', () => {
    const values = Object.values(IPC);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('should use colon-separated namespaced format', () => {
    const values = Object.values(IPC) as string[];
    for (const value of values) {
      expect(value).toMatch(/^[a-z]+:[a-z][\w:-]*$/);
    }
  });
});
