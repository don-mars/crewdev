import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

function findTsFiles(dir: string): string[] {
  const { execSync } = require('node:child_process');
  const result = execSync(
    `find "${dir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) ! -path "*/node_modules/*" ! -path "*/__tests__/*" ! -path "*/dist/*" ! -path "*/.vite/*"`,
    { encoding: 'utf-8' },
  );
  return result.trim().split('\n').filter(Boolean);
}

describe('No console.log enforcement', () => {
  it('should have zero console.log calls outside of logger.ts and test files', () => {
    const srcDir = path.resolve(__dirname, '../../');
    const files = findTsFiles(srcDir);
    const violations: string[] = [];

    for (const filePath of files) {
      const basename = path.basename(filePath);
      if (basename === 'logger.ts') {
        continue;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/console\.log\s*\(/) && !line.trim().startsWith('//')) {
          violations.push(`${filePath}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
