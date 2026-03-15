// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NERVE_MAP_SCAN } from '../../../shared/constants/ipc';

const mockBuildDependencyGraph = vi.hoisted(() => vi.fn());

vi.mock('../../../main/nerve-map/import-parser', () => ({
  buildDependencyGraph: mockBuildDependencyGraph,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerNerveMapHandlers } from '../../../main/ipc/nerve-map-handlers';

describe('Nerve Map IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    registerNerveMapHandlers(mockIpcMain as never);
  });

  it('should register handler for nerve-map:scan', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(NERVE_MAP_SCAN, expect.any(Function));
  });

  describe('nerve-map:scan', () => {
    it('should return dependency graph for given directory', async () => {
      const graph = {
        nodes: [{ id: 'a.ts', filePath: '/src/a.ts', cluster: 'src' }],
        edges: [{ source: 'a.ts', target: 'b.ts' }],
      };
      mockBuildDependencyGraph.mockResolvedValue(graph);

      const handler = handlers.get(NERVE_MAP_SCAN)!;
      const result = await handler({}, '/my-project/src');

      expect(mockBuildDependencyGraph).toHaveBeenCalledWith('/my-project/src');
      expect(result).toEqual({ success: true, data: graph });
    });

    it('should return error response on scan failure', async () => {
      mockBuildDependencyGraph.mockRejectedValue(new Error('read failed'));

      const handler = handlers.get(NERVE_MAP_SCAN)!;
      const result = await handler({}, '/bad-path');

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });
});
