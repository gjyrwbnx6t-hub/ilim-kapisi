"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindMapFlowNode as MindMapFlowNodeType } from "@/lib/mindmapFlow";

/** Ana başlık (depth 1) renk grupları — muted / akademik tonlar. */
const GROUP_COLORS = [
  "#0f6e7d", // petrol
  "#2f7d5b", // yeşil
  "#6b3f8c", // mor
  "#8a2f4a", // bordo
  "#1e3a5f", // lacivert
  "#b45f2b", // turuncu
  "#334155", // slate
  "#0e7490", // camgöbeği
] as const;

const ROOT_COLOR = "#12304d"; // koyu petrol/lacivert

function groupColor(group: number): string {
  if (group < 0) return ROOT_COLOR;
  return GROUP_COLORS[group % GROUP_COLORS.length];
}

/** Hex rengi beyaz üzerine düşük opaklıkta zemine çevirir (tinted arka plan). */
function tint(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MindMapFlowNode({
  data,
}: NodeProps<MindMapFlowNodeType>) {
  const { titleAr, titleTr, depth, group } = data;
  const color = groupColor(group);

  // Root koyu dolu; derinleştikçe zemin açılır, metin koyu kalır.
  const isRoot = depth === 0;
  const background = isRoot
    ? ROOT_COLOR
    : depth === 1
    ? tint(color, 0.22)
    : depth === 2
    ? tint(color, 0.13)
    : tint(color, 0.07);

  const textColor = isRoot ? "#ffffff" : "#1f2937";
  const borderColor = color;
  const borderWidth = isRoot ? 2 : depth === 1 ? 2 : 1;

  return (
    <div
      className="rounded-md shadow-sm"
      style={{
        width: 230,
        background,
        border: `${borderWidth}px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Right}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-400"
      />
      <div dir="rtl" className="px-3 py-2 text-right">
        <p
          className={`font-arabic leading-snug ${
            isRoot ? "text-sm font-bold" : "text-[13px] font-semibold"
          }`}
        >
          {titleAr}
        </p>
        {titleTr && (
          <p
            className="mt-0.5 text-[11px] leading-tight"
            style={{ color: isRoot ? "rgba(255,255,255,0.8)" : "#64748b" }}
          >
            {titleTr}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Left}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-400"
      />
    </div>
  );
}
