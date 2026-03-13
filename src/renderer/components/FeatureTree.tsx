import { useState, type ReactNode } from 'react';
import type { FeatureTreeNode, FeatureTree as FeatureTreeType, FeatureStatus } from '../../shared/types/feature';

interface FeatureTreeProps {
  tree: FeatureTreeType;
  activeId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLORS: Record<FeatureStatus, string> = {
  planned: 'bg-gray-400',
  'in-progress': 'bg-blue-400',
  complete: 'bg-green-400',
  blocked: 'bg-red-400',
};

function TreeNode({
  node,
  activeId,
  onSelect,
  depth,
}: {
  node: FeatureTreeNode;
  activeId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}): ReactNode {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.id === activeId;

  return (
    <div>
      <div
        data-testid={`node-${node.id}`}
        className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer ${
          isActive ? 'bg-blue-900 text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            data-testid={`toggle-${node.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 text-xs text-gray-400"
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span
          data-testid={`status-${node.id}`}
          className={`h-2 w-2 rounded-full ${STATUS_COLORS[node.status]}`}
        />

        <span
          className="truncate text-sm"
          onClick={() => onSelect(node.id)}
        >
          {node.title}
        </span>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureTree({ tree, activeId, onSelect }: FeatureTreeProps): ReactNode {
  if (tree.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No features yet. Create your first feature to get started.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          activeId={activeId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}
