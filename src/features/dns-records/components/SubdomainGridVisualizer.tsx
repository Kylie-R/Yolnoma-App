import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Server,
  Layers,
  ShieldCheck,
} from "lucide-react";
import type { SubdomainItem } from "../types";
import { SUBDOMAIN_CATEGORIES } from "../services/subdomainService";
import { toast } from "@/shared/ui/Toast";

interface SubdomainGridVisualizerProps {
  items: SubdomainItem[];
}

export const SubdomainGridVisualizer: React.FC<
  SubdomainGridVisualizerProps
> = ({ items }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-xs text-[var(--text-muted)]">
        No subdomains match the current filter criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
      {items.map((item) => {
        const catConfig =
          SUBDOMAIN_CATEGORIES[item.category] || SUBDOMAIN_CATEGORIES.other;
        const isLive = item.status === "live";

        return (
          <div
            key={item.id}
            className="group rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 hover:border-[var(--accent)]/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-3"
          >
            {/* Top row: Category + Status */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
              >
                {catConfig.label.split(" ")[0]}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-[10px] ${
                  isLive ? "text-emerald-400 font-medium" : "text-white/40"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLive ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                  }`}
                />
                {isLive ? "Live" : "Unresolved"}
              </span>
            </div>

            {/* Middle: Domain name */}
            <div>
              <p className="text-white/90 font-bold text-sm break-all select-all">
                {item.fullDomain}
              </p>
              {item.source === "ct_log" && (
                <span className="text-[10px] text-[var(--text-faint)] flex items-center gap-1 mt-1">
                  <ShieldCheck size={10} className="text-blue-400" />{" "}
                  Certificate Log
                </span>
              )}
            </div>

            {/* Meta: IP & CNAME */}
            <div className="space-y-1 text-[11px] pt-1 border-t border-white/[0.04]">
              {item.ip ? (
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Server size={11} className="shrink-0" />
                  <span className="truncate">{item.ip}</span>
                </div>
              ) : (
                <div className="text-[10px] text-[var(--text-faint)]">
                  IP not resolved
                </div>
              )}

              {item.cname && (
                <div
                  className="flex items-center gap-1.5 text-purple-400 text-[10px] truncate"
                  title={item.cname}
                >
                  <Layers size={11} className="shrink-0" />
                  <span className="truncate">→ {item.cname}</span>
                </div>
              )}
            </div>

            {/* Actions: Copy & Visit */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={() => handleCopy(item.fullDomain, item.id)}
                className="flex-1 py-1 px-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:text-white hover:border-[var(--accent)]/40 flex items-center justify-center gap-1 text-[11px] transition-all"
              >
                {copiedId === item.id ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
                Copy
              </button>

              <a
                href={`https://${item.fullDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-3 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#1b120e] flex items-center gap-1 text-[11px] transition-all font-semibold"
              >
                <ExternalLink size={12} /> Open
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
