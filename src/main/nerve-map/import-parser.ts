import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { DependencyGraph, GraphNode, GraphEdge } from '../../shared/types/nerve-map';
import { logger } from '../../shared/utils/logger';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

// Matches: import ... from 'specifier'
const ES_IMPORT_RE = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
// Matches: require('specifier')
const CJS_REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
// Matches: import('specifier')
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export function parseImports(source: string): string[] {
  const imports = new Set<string>();

  for (const re of [ES_IMPORT_RE, CJS_REQUIRE_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
      imports.add(match[1]);
    }
  }

  return [...imports];
}

async function collectFiles(
  dirPath: string,
  rootDir: string,
): Promise<Array<{ filePath: string; cluster: string }>> {
  const files: Array<{ filePath: string; cluster: string }> = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, rootDir);
      files.push(...subFiles);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      const relativePath = path.relative(rootDir, fullPath);
      const parts = relativePath.split(path.sep);
      const cluster = parts.length > 1 ? parts[0] : 'root';
      files.push({ filePath: fullPath, cluster });
    }
  }

  return files;
}

function resolveImportPath(importSpecifier: string, fromFile: string, allFilePaths: string[]): string | null {
  if (!importSpecifier.startsWith('.')) {
    return null; // External package, skip
  }

  const fromDir = path.dirname(fromFile);
  const resolved = path.resolve(fromDir, importSpecifier);

  // Try exact match, then with extensions
  for (const candidate of [resolved, ...SOURCE_EXTENSIONS.map((ext) => resolved + ext)]) {
    if (allFilePaths.includes(candidate)) {
      return candidate;
    }
  }

  // Try index files
  for (const ext of SOURCE_EXTENSIONS) {
    const indexPath = path.join(resolved, `index${ext}`);
    if (allFilePaths.includes(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

export async function buildDependencyGraph(rootDir: string): Promise<DependencyGraph> {
  const files = await collectFiles(rootDir, rootDir);
  const allFilePaths = files.map((f) => f.filePath);

  const nodes: GraphNode[] = files.map((f) => ({
    id: f.filePath,
    filePath: f.filePath,
    cluster: f.cluster,
  }));

  const edges: GraphEdge[] = [];

  for (const file of files) {
    try {
      const source = await readFile(file.filePath, 'utf-8');
      const imports = parseImports(source);

      for (const imp of imports) {
        const target = resolveImportPath(imp, file.filePath, allFilePaths);
        if (target) {
          edges.push({ source: file.filePath, target });
        }
      }
    } catch (err) {
      logger.warn('Failed to parse file', { file: file.filePath, error: err });
    }
  }

  return { nodes, edges };
}
