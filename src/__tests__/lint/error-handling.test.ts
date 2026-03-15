// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve(__dirname, '../../..');
const SOURCE_DIR = path.join(SRC_DIR, 'src');
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['__tests__', 'node_modules', 'dist', '.forge'];

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(full)));
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

describe('Error handling audit', () => {
  let sourceFiles: string[];
  let fileContents: Map<string, string>;

  beforeAll(async () => {
    sourceFiles = await collectSourceFiles(SOURCE_DIR);
    fileContents = new Map();
    for (const file of sourceFiles) {
      const content = await readFile(file, 'utf-8');
      fileContents.set(file, content);
    }
  });

  it('should have zero empty catch blocks in codebase', () => {
    const emptyCatchRe = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
    const violations: string[] = [];

    for (const [file, content] of fileContents) {
      const matches = content.match(emptyCatchRe);
      if (matches) {
        violations.push(`${path.relative(SOURCE_DIR, file)}: ${matches.length} empty catch block(s)`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('should have zero catch blocks that silently return null', () => {
    const silentReturnRe = /catch\s*(?:\([^)]*\))?\s*\{\s*return\s+null\s*;?\s*\}/g;
    const violations: string[] = [];

    for (const [file, content] of fileContents) {
      const matches = content.match(silentReturnRe);
      if (matches) {
        violations.push(`${path.relative(SOURCE_DIR, file)}: ${matches.length} silent return null`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('should have no catch blocks without logger calls or error returns', () => {
    // Match catch blocks and check they contain logger or error/return
    const catchBlockRe = /catch\s*(?:\(([^)]*)\))?\s*\{([^}]*)\}/g;
    const violations: string[] = [];

    for (const [file, content] of fileContents) {
      let match;
      catchBlockRe.lastIndex = 0;
      while ((match = catchBlockRe.exec(content)) !== null) {
        const body = match[2];
        const hasLogger = /logger\.\w+/.test(body) || /console\.\w+/.test(body);
        const hasReturn = /return\s*\{/.test(body) || /return\s+{/.test(body);
        const hasThrow = /throw/.test(body);
        const hasErrorHandling = hasLogger || hasReturn || hasThrow;

        if (!hasErrorHandling) {
          const line = content.slice(0, match.index).split('\n').length;
          violations.push(`${path.relative(SOURCE_DIR, file)}:${line}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
