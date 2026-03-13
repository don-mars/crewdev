import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NerveMap } from '../../../renderer/components/NerveMap';
import type { DependencyGraph, GraphNode, GraphEdge } from '../../../shared/types/nerve-map';

// Mock ReactFlow since it requires DOM measurements
vi.mock('reactflow', () => {
  const ReactFlow = ({ nodes, edges, onNodeClick, children }: any) => (
    <div data-testid="react-flow">
      {nodes?.map((node: any) => (
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          data-cluster={node.data?.cluster}
          onClick={() => onNodeClick?.({} as any, node)}
        >
          {node.data?.label}
        </div>
      ))}
      {edges?.map((edge: any) => (
        <div key={edge.id} data-testid={`edge-${edge.id}`} data-source={edge.source} data-target={edge.target} />
      ))}
      {children}
    </div>
  );

  return {
    __esModule: true,
    default: ReactFlow,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Background: () => <div data-testid="background" />,
    useNodesState: (initial: any[]) => {
      const nodes = initial || [];
      return [nodes, vi.fn(), vi.fn()];
    },
    useEdgesState: (initial: any[]) => {
      const edges = initial || [];
      return [edges, vi.fn(), vi.fn()];
    },
    MarkerType: { ArrowClosed: 'arrowclosed' },
    Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  };
});

function makeGraph(nodeCount: number, edgeCount: number): DependencyGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const cluster = i % 3 === 0 ? 'auth' : i % 3 === 1 ? 'dashboard' : 'shared';
    nodes.push({
      id: `file-${i}.ts`,
      filePath: `/src/${cluster}/file-${i}.ts`,
      cluster,
    });
  }

  for (let i = 0; i < edgeCount && i < nodeCount - 1; i++) {
    edges.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
    });
  }

  return { nodes, edges };
}

describe('NerveMap', () => {
  const smallGraph = makeGraph(5, 3);
  let mockOnRefresh: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnRefresh = vi.fn() as unknown as () => void;
  });

  it('should render file nodes', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    for (const node of smallGraph.nodes) {
      expect(screen.getByTestId(`node-${node.id}`)).toBeTruthy();
    }
  });

  it('should render edges between dependent files', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    for (let i = 0; i < smallGraph.edges.length; i++) {
      const edge = smallGraph.edges[i];
      const edgeEl = screen.getByTestId(`edge-${edge.source}-${edge.target}`);
      expect(edgeEl.getAttribute('data-source')).toBe(edge.source);
      expect(edgeEl.getAttribute('data-target')).toBe(edge.target);
    }
  });

  it('should group files into feature clusters', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    const authNodes = smallGraph.nodes.filter((n) => n.cluster === 'auth');
    for (const node of authNodes) {
      const el = screen.getByTestId(`node-${node.id}`);
      expect(el.getAttribute('data-cluster')).toBe('auth');
    }
  });

  it('should show file detail on node click', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    const firstNode = smallGraph.nodes[0];
    fireEvent.click(screen.getByTestId(`node-${firstNode.id}`));

    expect(screen.getByText(firstNode.filePath)).toBeTruthy();
  });

  it('should expand and collapse cluster bubbles', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    // Click cluster toggle for 'auth'
    const toggleBtn = screen.getByRole('button', { name: /auth/i });
    expect(toggleBtn).toBeTruthy();

    fireEvent.click(toggleBtn);

    // After collapse, individual auth nodes should be hidden
    const authNodes = smallGraph.nodes.filter((n) => n.cluster === 'auth');
    for (const node of authNodes) {
      expect(screen.queryByTestId(`node-${node.id}`)).toBeNull();
    }

    // Click again to expand
    fireEvent.click(toggleBtn);
    for (const node of authNodes) {
      expect(screen.getByTestId(`node-${node.id}`)).toBeTruthy();
    }
  });

  it('should support zoom and pan controls', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    expect(screen.getByTestId('controls')).toBeTruthy();
    expect(screen.getByTestId('minimap')).toBeTruthy();
  });

  it('should render 100 nodes within performance budget', () => {
    const largeGraph = makeGraph(100, 50);

    const start = performance.now();
    render(<NerveMap graph={largeGraph} onRefresh={mockOnRefresh} />);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
  });

  it('should have a refresh button', () => {
    render(<NerveMap graph={smallGraph} onRefresh={mockOnRefresh} />);

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when graph has no nodes', () => {
    const emptyGraph: DependencyGraph = { nodes: [], edges: [] };
    render(<NerveMap graph={emptyGraph} onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/no files/i)).toBeTruthy();
  });
});
