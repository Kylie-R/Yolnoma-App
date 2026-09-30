import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Server,
  Layers,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { SubdomainCategory, SubdomainItem } from "../types";
import { SUBDOMAIN_CATEGORIES } from "../services/subdomainService";
import { toast } from "@/shared/ui/Toast";

interface SubdomainTreeVisualizerProps {
  rootDomain: string;
  items: SubdomainItem[];
}

export const SubdomainTreeVisualizer: React.FC<
  SubdomainTreeVisualizerProps
> = ({ rootDomain, items }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Group items by category
  const grouped = items.reduce<Record<SubdomainCategory, SubdomainItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<SubdomainCategory, SubdomainItem[]>,
  );

  const categories = Object.keys(grouped) as SubdomainCategory[];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/25 p-5 font-mono text-xs">
      {/* Root Node */}
      <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[#1b120e]">
          <Globe size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{rootDomain}</span>
            <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              Root Domain
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {items.length} subdomains listed below
          </p>
        </div>
      </div>

      {/* Category Branches */}
      <div className="mt-4 space-y-4 pl-4 sm:pl-6 border-l-2 border-white/[0.08]">
        {categories.map((cat) => {
          const catConfig =
            SUBDOMAIN_CATEGORIES[cat] || SUBDOMAIN_CATEGORIES.other;
          const subList = grouped[cat] || [];
          const isCollapsed = Boolean(collapsedCategories[cat]);
          const liveInCat = subList.filter((s) => s.status === "live").length;

          return (
            <div key={cat} className="space-y-2">
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(cat)}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-2">
                  <button type="button" className="text-[var(--text-faint)]">
                    {isCollapsed ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {isCollapsed ? (
                    <Folder size={15} className={catConfig.color} />
                  ) : (
                    <FolderOpen size={15} className={catConfig.color} />
                  )}
                  <span className={`font-semibold ${catConfig.color}`}>
                    {catConfig.label}
                  </span>
                  <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/50">
                    {subList.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  {liveInCat > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {liveInCat} live
                    </span>
                  )}
                </div>
              </div>

              {/* Subdomain Leaf Nodes */}
              {!isCollapsed && (
                <div className="space-y-1.5 pl-5 sm:pl-7 border-l border-white/[0.05]">
                  {subList.map((item) => {
                    const isLive = item.status === "live";
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] p-2 hover:border-[var(--accent)]/30 hover:bg-white/[0.03] transition-all"
                      >
                        {/* Domain name & Status */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isLive
                                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                : "bg-neutral-600"
                            }`}
                            title={
                              isLive
                                ? "Active / Resolving"
                                : "Unresolved / Inactive"
                            }
                          />
                          <span className="text-white/90 font-medium break-all select-all">
                            {item.fullDomain}
                          </span>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-[11px]">
                          {item.ip && (
                            <span className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-cyan-400 flex items-center gap-1 border border-white/[0.06]">
                              <Server size={10} /> {item.ip}
                            </span>
                          )}

                          {item.cname && (
                            <span
                              className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-purple-400 flex items-center gap-1 border border-white/[0.06] max-w-[140px] truncate"
                              title={item.cname}
                            >
                              <Layers size={10} /> {item.cname}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopy(item.fullDomain, item.id)}
                            className="rounded p-1 text-[var(--text-faint)] hover:text-white transition-colors"
                            title="Copy subdomain"
                          >
                            {copiedId === item.id ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>

                          <a
                            href={`https://${item.fullDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                            title="Open in Browser"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
