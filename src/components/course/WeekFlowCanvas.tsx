"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import MindMapFlowNode from "./MindMapFlowNode";
import { buildFlow, type FlowNodeData } from "@/lib/mindmapFlow";
import type { MindMapNode } from "@/lib/types";

const nodeTypes: NodeTypes = { mindmap: MindMapFlowNode };

function miniMapColor(node: Node): string {
  const depth = (node.data as Partial<FlowNodeData>)?.depth;
  return depth === 0 ? "#12304d" : "#94a3b8";
}

export default function WeekFlowCanvas({ week }: { week: MindMapNode }) {
  const { nodes, edges } = useMemo(() => buildFlow(week), [week]);
  const hasContent = (week.children?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-10 text-center text-surface-muted">
        Bu haftanın zihin şeması yakında eklenecek.
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={false}
          zoomOnScroll
          proOptions={{ hideAttribution: false }}
          className="bg-slate-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={miniMapColor}
            nodeStrokeWidth={2}
            className="!bg-white"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
