import dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { MindMapNode } from "@/lib/types";

/**
 * Zihin şeması JSON ağacını React Flow node/edge biçimine dönüştürür ve
 * dagre ile otomatik (RTL / sağdan sola) ağaç yerleşimi uygular.
 *
 * ÖNEMLİ: Kaynak JSON şeması (`MindMapNode`) değiştirilmez; burada üretilen
 * `depth`/`group` alanları yalnızca görselleştirme (renk) içindir.
 */

export type FlowNodeData = {
  titleAr: string;
  titleTr?: string;
  /** 0 = hafta/root, 1 = ana başlık, 2+ = alt başlıklar. */
  depth: number;
  /** Bağlı olduğu ana başlık (depth 1) sırası; renk grubu için. -1 = root. */
  group: number;
};

export type MindMapFlowNode = Node<FlowNodeData, "mindmap">;

const NODE_WIDTH = 230;
const CHARS_PER_LINE = 24;
const LINE_HEIGHT = 20;

function estimateHeight(node: MindMapNode): number {
  const lines = Math.max(1, Math.ceil(node.titleAr.length / CHARS_PER_LINE));
  const base = 20 + lines * LINE_HEIGHT;
  return Math.min(190, base + (node.titleTr ? 16 : 0));
}

/** Ağacı gezip henüz konumlandırılmamış node/edge listesi üretir. */
function collect(root: MindMapNode): {
  nodes: MindMapFlowNode[];
  edges: Edge[];
  heights: Map<string, number>;
} {
  const nodes: MindMapFlowNode[] = [];
  const edges: Edge[] = [];
  const heights = new Map<string, number>();

  const walk = (
    node: MindMapNode,
    depth: number,
    group: number,
    parentId: string | null
  ) => {
    nodes.push({
      id: node.id,
      type: "mindmap",
      position: { x: 0, y: 0 },
      data: {
        titleAr: node.titleAr,
        titleTr: node.titleTr,
        depth,
        group,
      },
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
    });
    heights.set(node.id, estimateHeight(node));

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      });
    }

    node.children?.forEach((child, index) => {
      // depth 1 çocuklarında yeni grup başlar; daha derinde grup miras alınır.
      const childGroup = depth === 0 ? index : group;
      walk(child, depth + 1, childGroup, node.id);
    });
  };

  walk(root, 0, -1, null);
  return { nodes, edges, heights };
}

export function buildFlow(root: MindMapNode): {
  nodes: MindMapFlowNode[];
  edges: Edge[];
} {
  const { nodes, edges, heights } = collect(root);

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "RL", nodesep: 22, ranksep: 90, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: heights.get(node.id) ?? 56 });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const positioned = nodes.map((node) => {
    const laid = g.node(node.id);
    return {
      ...node,
      position: {
        x: laid.x - laid.width / 2,
        y: laid.y - laid.height / 2,
      },
      style: { width: NODE_WIDTH },
    };
  });

  return { nodes: positioned, edges };
}
