import type { ReactNode } from 'react';
import { useState, useMemo, useCallback } from 'react';
import ReactFlow, { Controls, MiniMap, Background, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import type { DependencyGraph } from '../../shared/types/nerve-map';
import 'reactflow/dist/style.css';

interface NerveMapProps {
  graph: DependencyGraph;
  onRefresh: () => void;
}

const CLUSTER_COLORS: Record<string, string> = {
  auth: '#3b82f6',
  dashboard: '#10b981',
  shared: '#f59e0b',
  root: '#6b7280',
};

function getClusterColor(cluster: string): string {
  return CLUSTER_COLORS[cluster] ?? '#8b5cf6';
}

export function NerveMap({ graph, onRefresh }: NerveMapProps): ReactNode {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());

  const clusters = useMemo(() => {
    const set = new Set<string>();
    for (const node of graph.nodes) {
      set.add(node.cluster);
    }
    return [...set];
  }, [graph.nodes]);

  const toggleCluster = useCallback((cluster: string) => {
    setCollapsedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(cluster)) {
        next.delete(cluster);
      } else {
        next.add(cluster);
      }
      return next;
    });
  }, []);

  const visibleNodes = useMemo(() => {
    return graph.nodes.filter((n) => !collapsedClusters.has(n.cluster));
  }, [graph.nodes, collapsedClusters]);

  const flowNodes: Node[] = useMemo(() => {
    return visibleNodes.map((node, i) => ({
      id: node.id,
      position: { x: (i % 10) * 180, y: Math.floor(i / 10) * 100 },
      data: {
        label: node.id.split('/').pop() ?? node.id,
        cluster: node.cluster,
        filePath: node.filePath,
      },
      style: {
        background: getClusterColor(node.cluster),
        color: '#fff',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      },
    }));
  }, [visibleNodes]);

  const flowEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    return graph.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
      }));
  }, [graph.edges, visibleNodes]);

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  const selectedDetail = useMemo(() => {
    if (!selectedNode) return null;
    return graph.nodes.find((n) => n.id === selectedNode) ?? null;
  }, [selectedNode, graph.nodes]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No files found in this project</p>
        <button
          onClick={onRefresh}
          aria-label="Refresh"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b border-gray-700">
        {clusters.map((cluster) => (
          <button
            key={cluster}
            onClick={() => toggleCluster(cluster)}
            aria-label={cluster}
            className="px-3 py-1 text-xs rounded"
            style={{
              background: collapsedClusters.has(cluster) ? '#374151' : getClusterColor(cluster),
              color: '#fff',
              opacity: collapsedClusters.has(cluster) ? 0.5 : 1,
            }}
          >
            {cluster} {collapsedClusters.has(cluster) ? '▶' : '▼'}
          </button>
        ))}
        <button
          onClick={onRefresh}
          aria-label="Refresh"
          className="ml-auto px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>

        {selectedDetail && (
          <div className="absolute top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-xs">
            <h3 className="font-bold text-sm mb-2">{selectedDetail.id.split('/').pop()}</h3>
            <p className="text-xs text-gray-400">{selectedDetail.filePath}</p>
            <p className="text-xs mt-1">
              Cluster: <span style={{ color: getClusterColor(selectedDetail.cluster) }}>{selectedDetail.cluster}</span>
            </p>
            <button
              onClick={() => setSelectedNode(null)}
              className="mt-2 text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
