import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('TypeScript config', () => {
  it('should have strict: true enabled', () => {
    const tsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('should have jsx support configured', () => {
    const tsconfigPath = path.resolve(__dirname, '../../../tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  });
});
