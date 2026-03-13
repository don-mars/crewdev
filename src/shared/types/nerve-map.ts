export interface GraphNode {
  readonly id: string;
  readonly filePath: string;
  readonly cluster: string;
}

export interface GraphEdge {
  readonly source: string;
  readonly target: string;
}

export interface DependencyGraph {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
}
