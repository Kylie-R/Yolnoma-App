import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Loader2,
  Globe,
  Share2,
  Network,
  ListTree,
  LayoutGrid,
  FileText,
  FileSpreadsheet,
  FileJson,
  XCircle,
  Activity,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
  Server,
} from "lucide-react";
import { useSubdomainFinder } from "../hooks/useSubdomainFinder";
import {
  SUBDOMAIN_CATEGORIES,
  exportSubdomainsToTxt,
  exportSubdomainsToCsv,
  exportSubdomainsToJson,
} from "../services/subdomainService";
import type { SubdomainCategory } from "../types";
import { SubdomainTreeVisualizer } from "./SubdomainTreeVisualizer";
import { SubdomainGraphVisualizer } from "./SubdomainGraphVisualizer";
import { SubdomainGridVisualizer } from "./SubdomainGridVisualizer";
import { toast } from "@/shared/ui/Toast";

const PRESET_DOMAINS = [
  "github.com",
  "cloudflare.com",
  "yolnoma.uz",
  "spotify.com",
  "discord.com",
  "openai.com",
  "uber.com",
];

export const SubdomainFinderTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    domain,
    setDomain,
    scanning,
    progressStep,
    progressPercent,
    scanResult,
    error,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredSubdomains,
    categoryCounts,
    handleScan,
    cancelScan,
  } = useSubdomainFinder("github.com");

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleScan();
  };

  const handleSelectPreset = (preset: string) => {
    setDomain(preset);
    void handleScan(preset);
  };

  const handleExport = (format: "txt" | "csv" | "json") => {
    if (!scanResult) return;
    let content = "";
    if (format === "txt")
      content = exportSubdomainsToTxt(scanResult.subdomains);
    else if (format === "csv")
      content = exportSubdomainsToCsv(scanResult.subdomains);
    else if (format === "json") content = exportSubdomainsToJson(scanResult);

    navigator.clipboard.writeText(content);
    toast.success(`Copied subdomains as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const categories = Object.keys(SUBDOMAIN_CATEGORIES) as SubdomainCategory[];

  return (
    <div className="space-y-6">
      {/* Target input & Scan trigger */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end"
        >
          <div className="lg:col-span-9 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
              <span>{t("dns.subdomainTarget")}</span>
              <span className="text-[11px] text-[var(--text-faint)] font-normal">
                {t("dns.subdomainMethod")}
              </span>
            </label>
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. github.com, cloudflare.com, or spotify.com"
                disabled={scanning}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/40 focus:border-[#D97757]/50 transition-all font-mono text-white"
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={scanning}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--accent)] text-[#1b120e] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/15 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("dns.scanning")}
                </>
              ) : (
                <>
                  <Search size={16} />
                  {t("dns.find")}
                </>
              )}
            </button>

            {scanning && (
              <button
                type="button"
                onClick={cancelScan}
                className="py-2.5 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                title={t("dns.cancelScan")}
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Progress Bar while scanning */}
        {scanning && (
          <div className="space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--accent)] flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" /> {progressStep}
              </span>
              <span className="text-white/60">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Preset Domains */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[var(--text-faint)] flex items-center gap-1 font-medium">
            <Sparkles size={12} className="text-[var(--accent)]" />{" "}
            {t("dns.presets")}
          </span>
          {PRESET_DOMAINS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={scanning}
              onClick={() => handleSelectPreset(p)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-3">
          <XCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {scanResult && (
        <div className="space-y-5">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Globe size={13} className="text-blue-400" />{" "}
                {t("dns.discovered")}
              </span>
              <div className="mt-2">
                <p className="font-mono text-2xl font-bold text-white">
                  {scanResult.totalFound}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {t("dns.total")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />{" "}
                {t("dns.live")}
              </span>
              <div className="mt-2">
                <p className="font-mono text-2xl font-bold text-emerald-400">
                  {scanResult.liveCount}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {t("dns.liveDesc")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Layers size={13} className="text-purple-400" /> Unresolved
              </span>
              <div className="mt-2">
                <p className="font-mono text-2xl font-bold text-white/60">
                  {scanResult.totalFound - scanResult.liveCount}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {t("dns.unresolvedDesc")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Activity size={13} className="text-[var(--accent)]" />{" "}
                {t("dns.duration")}
              </span>
              <div className="mt-2">
                <p className="font-mono text-2xl font-bold text-[var(--accent)]">
                  {(scanResult.scanDurationMs / 1000).toFixed(1)}s
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {t("dns.durationDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Filtering, Search & View Controls */}
          <div className="space-y-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4">
            {/* Top row: View Switcher + Search + Export */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* View Switcher: Tree vs Graph vs Grid */}
              <div className="flex items-center rounded-xl bg-white/[0.03] border border-[var(--border)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("tree")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "tree"
                      ? "bg-[var(--accent)] text-[#1b120e] font-semibold shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <ListTree size={14} /> {t("dns.tree")}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("graph")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "graph"
                      ? "bg-[var(--accent)] text-[#1b120e] font-semibold shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <Network size={14} /> {t("dns.graph")}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-[var(--accent)] text-[#1b120e] font-semibold shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <LayoutGrid size={14} /> {t("dns.grid")}
                </button>
              </div>

              {/* Status filter: All / Live only / Unresolved */}
              <div className="flex items-center rounded-xl bg-white/[0.03] border border-[var(--border)] p-1">
                {(["all", "live", "unresolved"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs capitalize rounded-lg transition-all ${
                      statusFilter === s
                        ? "bg-white/10 text-white font-medium"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Search input + Export */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("dns.searchSubdomains")}
                    className="pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-[var(--border)] text-xs text-white placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)]/50"
                  />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all"
                  >
                    <Share2 size={13} /> Export
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-1 w-44 rounded-xl border border-white/[0.08] bg-[#1a1715] p-1.5 shadow-2xl z-30 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleExport("txt")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                      >
                        <FileText size={13} className="text-amber-400" /> Copy
                        List (TXT)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("csv")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                      >
                        <FileSpreadsheet
                          size={13}
                          className="text-emerald-400"
                        />{" "}
                        Copy CSV Table
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("json")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                      >
                        <FileJson size={13} className="text-blue-400" /> Copy
                        JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-[var(--accent)] text-[#1b120e] font-semibold"
                    : "text-[var(--text-muted)] hover:text-white bg-white/[0.02] border border-white/[0.05]"
                }`}
              >
                All Categories ({scanResult.subdomains.length})
              </button>

              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                const config = SUBDOMAIN_CATEGORIES[cat];
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[var(--accent)] text-[#1b120e] font-semibold"
                        : `${config.color} bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]`
                    }`}
                  >
                    {config.label.split(" ")[0]} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Display */}
          {viewMode === "tree" && (
            <SubdomainTreeVisualizer
              rootDomain={scanResult.domain}
              items={filteredSubdomains}
            />
          )}

          {viewMode === "graph" && (
            <SubdomainGraphVisualizer
              rootDomain={scanResult.domain}
              items={filteredSubdomains}
            />
          )}

          {viewMode === "grid" && (
            <SubdomainGridVisualizer items={filteredSubdomains} />
          )}
        </div>
      )}

      {/* Educational intro card when no scan yet */}
      {!scanResult && !scanning && (
        <div className="rounded-2xl border border-[var(--border)] bg-white/[0.01] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
            <Sparkles size={16} /> How Subdomain Discovery Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" /> Certificate Logs
                (crt.sh)
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Queries public Certificate Transparency logs for SSL/TLS
                certificates issued to the domain and its subdomains.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Server size={14} className="text-emerald-400" /> Live DNS
                Resolution
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Probes discovered hostnames via high-speed DNS-over-HTTPS (DoH)
                to detect active public IP addresses and CNAME aliases.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-purple-400" /> Visual Topology
                Maps
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Visualizes the domain infrastructure into radial hub graphs,
                collapsible directory trees, and functional categories.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
