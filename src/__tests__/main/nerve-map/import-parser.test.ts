// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: mockFs.readFile,
  readdir: mockFs.readdir,
  stat: mockFs.stat,
}));

import { parseImports, buildDependencyGraph } from '../../../main/nerve-map/import-parser';

describe('Import parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseImports()', () => {
    it('should identify ES module import relationships', () => {
      const source = `
        import { foo } from './utils';
        import Bar from '../components/Bar';
        import type { Baz } from './types';
      `;

      const imports = parseImports(source);

      expect(imports).toContain('./utils');
      expect(imports).toContain('../components/Bar');
      expect(imports).toContain('./types');
    });

    it('should identify CommonJS require relationships', () => {
      const source = `
        const fs = require('fs');
        const { bar } = require('./helpers');
        const config = require('../config');
      `;

      const imports = parseImports(source);

      expect(imports).toContain('fs');
      expect(imports).toContain('./helpers');
      expect(imports).toContain('../config');
    });

    it('should identify dynamic imports', () => {
      const source = `
        const mod = await import('./lazy-module');
      `;

      const imports = parseImports(source);

      expect(imports).toContain('./lazy-module');
    });

    it('should handle re-exports', () => {
      const source = `
        export { default } from './component';
        export * from './utils';
      `;

      const imports = parseImports(source);

      expect(imports).toContain('./component');
      expect(imports).toContain('./utils');
    });

    it('should return empty array for files with no imports', () => {
      const source = `const x = 42;\nexport default x;`;

      const imports = parseImports(source);

      expect(imports).toEqual([]);
    });
  });

  describe('buildDependencyGraph()', () => {
    it('should resolve relative import paths to absolute', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'index.ts', isDirectory: () => false, isFile: () => true },
        { name: 'utils.ts', isDirectory: () => false, isFile: () => true },
      ]);
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });
      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.endsWith('index.ts')) {
          return "import { foo } from './utils';";
        }
        return 'export const foo = 1;';
      });

      const graph = await buildDependencyGraph('/project/src');

      const indexNode = graph.nodes.find((n) => n.id.endsWith('index.ts'));
      expect(indexNode).toBeDefined();

      const edge = graph.edges.find((e) => e.source.endsWith('index.ts'));
      expect(edge).toBeDefined();
      expect(edge!.target).toContain('utils.ts');
    });

    it('should handle circular imports without infinite loop', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'a.ts', isDirectory: () => false, isFile: () => true },
        { name: 'b.ts', isDirectory: () => false, isFile: () => true },
      ]);
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });
      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.endsWith('a.ts')) return "import { b } from './b';";
        if (filePath.endsWith('b.ts')) return "import { a } from './a';";
        return '';
      });

      const graph = await buildDependencyGraph('/project/src');

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(2);
    });

    it('should handle missing files gracefully', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'index.ts', isDirectory: () => false, isFile: () => true },
      ]);
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });
      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.endsWith('index.ts')) {
          return "import { missing } from './does-not-exist';";
        }
        throw new Error('ENOENT');
      });

      const graph = await buildDependencyGraph('/project/src');

      expect(graph.nodes).toHaveLength(1);
      // Edge to missing file should not crash, just skip
      expect(graph.edges).toHaveLength(0);
    });

    it('should scan subdirectories recursively', async () => {
      mockFs.readdir.mockImplementation(async (dirPath: string) => {
        if (dirPath === '/project/src') {
          return [
            { name: 'index.ts', isDirectory: () => false, isFile: () => true },
            { name: 'lib', isDirectory: () => true, isFile: () => false },
          ];
        }
        if (dirPath === '/project/src/lib') {
          return [{ name: 'helper.ts', isDirectory: () => false, isFile: () => true }];
        }
        return [];
      });
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });
      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.endsWith('index.ts')) return "import { h } from './lib/helper';";
        return 'export const h = 1;';
      });

      const graph = await buildDependencyGraph('/project/src');

      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes.find((n) => n.id.includes('helper.ts'))).toBeDefined();
    });

    it('should group files into feature clusters by directory', async () => {
      mockFs.readdir.mockImplementation(async (dirPath: string) => {
        if (dirPath === '/project/src') {
          return [
            { name: 'auth', isDirectory: () => true, isFile: () => false },
            { name: 'dashboard', isDirectory: () => true, isFile: () => false },
          ];
        }
        if (dirPath === '/project/src/auth') {
          return [{ name: 'login.ts', isDirectory: () => false, isFile: () => true }];
        }
        if (dirPath === '/project/src/dashboard') {
          return [{ name: 'home.ts', isDirectory: () => false, isFile: () => true }];
        }
        return [];
      });
      mockFs.stat.mockResolvedValue({ isDirectory: () => false });
      mockFs.readFile.mockResolvedValue('export default 1;');

      const graph = await buildDependencyGraph('/project/src');

      const loginNode = graph.nodes.find((n) => n.id.includes('login.ts'));
      const homeNode = graph.nodes.find((n) => n.id.includes('home.ts'));
      expect(loginNode?.cluster).toBe('auth');
      expect(homeNode?.cluster).toBe('dashboard');
    });
  });
});
