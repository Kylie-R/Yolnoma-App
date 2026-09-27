import React, { useState, useMemo } from "react";
import {
  Server,
  ExternalLink,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type { SubdomainCategory, SubdomainItem } from "../types";
import { SUBDOMAIN_CATEGORIES } from "../services/subdomainService";
import { toast } from "@/shared/ui/Toast";

interface SubdomainGraphVisualizerProps {
  rootDomain: string;
  items: SubdomainItem[];
}

export const SubdomainGraphVisualizer: React.FC<
  SubdomainGraphVisualizerProps
> = ({ rootDomain, items }) => {
  const [selectedItem, setSelectedItem] = useState<SubdomainItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  // Group and limit items for graph aesthetic (e.g. top 40 for optimal layout)
  const displayItems = useMemo(() => items.slice(0, 48), [items]);

  const categories = useMemo(() => {
    const set = new Set<SubdomainCategory>();
    for (const item of displayItems) set.add(item.category);
    return Array.from(set);
  }, [displayItems]);

  const centerX = 500;
  const centerY = 350;
  const categoryRadius = 160;
  const nodeRadius = 280;

  // Calculate coordinates for categories
  const categoryCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    const total = categories.length || 1;
    categories.forEach((cat, idx) => {
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      coords[cat] = {
        x: centerX + categoryRadius * Math.cos(angle),
        y: centerY + categoryRadius * Math.sin(angle),
      };
    });
    return coords;
  }, [categories, centerX, centerY, categoryRadius]);

  // Calculate coordinates for subdomain nodes
  const nodeCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    const grouped: Record<string, SubdomainItem[]> = {};
    for (const item of displayItems) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    const totalCats = categories.length || 1;

    categories.forEach((cat, catIdx) => {
      const catAngle = (catIdx / totalCats) * 2 * Math.PI - Math.PI / 2;
      const itemsInCat = grouped[cat] || [];
      const spread = Math.min(0.6, (Math.PI * 2) / (totalCats * 1.5));

      itemsInCat.forEach((item, itemIdx) => {
        const offset =
          itemsInCat.length === 1
            ? 0
            : (itemIdx / (itemsInCat.length - 1) - 0.5) * spread;
        const angle = catAngle + offset;
        // Stagger distance slightly for depth
        const dist = nodeRadius + (itemIdx % 2 === 0 ? 0 : 35);
        coords[item.id] = {
          x: centerX + dist * Math.cos(angle),
          y: centerY + dist * Math.sin(angle),
        };
      });
    });

    return coords;
  }, [categories, displayItems, centerX, centerY, nodeRadius]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[#0d0c0b] overflow-hidden">
      {/* Controls Header */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-[var(--accent)] border border-white/[0.08]">
          Topology Graph ({displayItems.length} nodes)
        </span>
      </div>

      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md p-1 border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          className="rounded p-1 text-white/70 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          className="rounded p-1 text-white/70 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="rounded p-1 text-white/70 hover:text-white"
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* SVG Canvas */}
      <div className="overflow-auto min-h-[580px] flex items-center justify-center p-4">
        <svg
          viewBox="0 0 1000 700"
          className="w-full max-w-[1000px] h-auto transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Subtle concentric guide rings */}
          <circle
            cx={centerX}
            cy={centerY}
            r={categoryRadius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="3 3"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={nodeRadius}
            fill="none"
            stroke="rgba(255,255,255,0.02)"
            strokeDasharray="4 4"
          />

          {/* Links: Root -> Category Hubs */}
          {categories.map((cat) => {
            const coord = categoryCoords[cat];
            if (!coord) return null;
            return (
              <line
                key={`root-${cat}`}
                x1={centerX}
                y1={centerY}
                x2={coord.x}
                y2={coord.y}
                stroke="#D97757"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            );
          })}

          {/* Links: Category Hubs -> Subdomain Nodes */}
          {displayItems.map((item) => {
            const catCoord = categoryCoords[item.category];
            const nodeCoord = nodeCoords[item.id];
            if (!catCoord || !nodeCoord) return null;

            const isSelected = selectedItem?.id === item.id;
            const isLive = item.status === "live";

            return (
              <path
                key={`link-${item.id}`}
                d={`M ${catCoord.x} ${catCoord.y} Q ${(catCoord.x + nodeCoord.x) / 2} ${(catCoord.y + nodeCoord.y) / 2} ${nodeCoord.x} ${nodeCoord.y}`}
                fill="none"
                stroke={
                  isSelected
                    ? "#D97757"
                    : isLive
                      ? "rgba(52, 211, 153, 0.35)"
                      : "rgba(255, 255, 255, 0.1)"
                }
                strokeWidth={isSelected ? 2 : 1}
              />
            );
          })}

          {/* Category Hub Nodes */}
          {categories.map((cat) => {
            const coord = categoryCoords[cat];
            if (!coord) return null;
            const config =
              SUBDOMAIN_CATEGORIES[cat] || SUBDOMAIN_CATEGORIES.other;

            return (
              <g
                key={`hub-${cat}`}
                transform={`translate(${coord.x}, ${coord.y})`}
              >
                <circle
                  r="14"
                  fill="#1b1715"
                  stroke="#D97757"
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />
                <circle r="5" fill="#D97757" />
                <text
                  y="-18"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.75)"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {config.label.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Subdomain Nodes */}
          {displayItems.map((item) => {
            const coord = nodeCoords[item.id];
            if (!coord) return null;

            const isSelected = selectedItem?.id === item.id;
            const isLive = item.status === "live";

            return (
              <g
                key={`node-${item.id}`}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => setSelectedItem(item)}
                className="cursor-pointer transition-all"
              >
                <circle
                  r={isSelected ? 8 : 5}
                  fill={isLive ? "#34d399" : "#525252"}
                  stroke={isSelected ? "#ffffff" : "rgba(0,0,0,0.5)"}
                  strokeWidth={isSelected ? 2 : 1}
                  className="hover:scale-125 transition-transform"
                />
                <text
                  x={coord.x > centerX ? 10 : -10}
                  y="3"
                  textAnchor={coord.x > centerX ? "start" : "end"}
                  fill={
                    isSelected
                      ? "#D97757"
                      : isLive
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.4)"
                  }
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {item.subdomain}
                </text>
              </g>
            );
          })}

          {/* Center Root Domain Node */}
          <g transform={`translate(${centerX}, ${centerY})`}>
            <circle
              r="36"
              fill="rgba(217, 119, 87, 0.15)"
              stroke="#D97757"
              strokeWidth="2"
            />
            <circle r="26" fill="#1b120e" stroke="#D97757" strokeWidth="1.5" />
            <text
              y="4"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {rootDomain.length > 14
                ? rootDomain.slice(0, 12) + ".."
                : rootDomain}
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Node Details Floating Card */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 rounded-xl border border-[var(--accent)]/40 bg-[#161413]/95 backdrop-blur-md p-4 shadow-2xl z-20 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span
                className={`h-2 w-2 rounded-full ${
                  selectedItem.status === "live"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-neutral-500"
                }`}
              />
              {selectedItem.status === "live"
                ? "Active / Resolving"
                : "Unresolved"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="text-[var(--text-faint)] hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <p className="text-white font-bold break-all select-all text-sm">
              {selectedItem.fullDomain}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Category:{" "}
              {SUBDOMAIN_CATEGORIES[selectedItem.category]?.label || "General"}
            </p>
          </div>

          {selectedItem.ip && (
            <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] bg-white/[0.03] p-1.5 rounded border border-white/[0.06]">
              <Server size={12} /> IP: {selectedItem.ip}
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(selectedItem.fullDomain)}
              className="flex-1 py-1 px-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-white flex items-center justify-center gap-1 text-[11px] transition-colors"
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}{" "}
              Copy
            </button>
            <a
              href={`https://${selectedItem.fullDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-3 rounded-lg bg-[var(--accent)] text-[#1b120e] font-semibold flex items-center gap-1 text-[11px] hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={12} /> Visit
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
