import React, { useState } from "react";
import {
  Search,
  Loader2,
  Globe,
  Share2,
  FileJson,
  FileCode2,
  FileSpreadsheet,
  History,
  Trash2,
  Info,
  Server,
  Mail,
  Shield,
  Layers,
} from "lucide-react";
import { useDnsLookup } from "../hooks/useDnsLookup";
import {
  DNS_PROVIDERS,
  DNS_RECORD_TYPES,
  exportToJson,
  exportToBindZone,
  exportToCsv,
} from "../services/dnsService";
import type { DnsProvider, DnsQueryType, DnsRecordType } from "../types";
import { DnsSummaryCards } from "./DnsSummaryCards";
import { DnsRecordCard } from "./DnsRecordCard";
import { DnsPresets } from "./DnsPresets";
import { toast } from "@/shared/ui/Toast";
import { SelectMenu } from "@/shared/ui";

const RECORD_TYPE_OPTIONS = [
  { value: "ALL", label: "ALL Records" },
  ...DNS_RECORD_TYPES.map((t) => ({ value: t, label: t })),
];

const DNS_RESOLVER_OPTIONS = DNS_PROVIDERS.map((p) => ({
  value: p.id,
  label: `${p.name} (${p.ip})`,
}));

export const DnsLookupTab: React.FC = () => {
  const {
    domain,
    setDomain,
    queryType,
    setQueryType,
    provider,
    setProvider,
    loading,
    error,
    result,
    searchFilter,
    setSearchFilter,
    filterType,
    setFilterType,
    filteredRecords,
    recordTypeCounts,
    history,
    performLookup,
    clearHistory,
  } = useDnsLookup("google.com");

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup();
  };

  const handleSelectPreset = (presetDomain: string, type?: DnsQueryType) => {
    setDomain(presetDomain);
    if (type) setQueryType(type);
    void performLookup(presetDomain, type || queryType, provider);
  };

  const handleCopyExport = (format: "json" | "bind" | "csv") => {
    if (!result) return;
    let content = "";
    if (format === "json") content = exportToJson(result);
    else if (format === "bind") content = exportToBindZone(result);
    else if (format === "csv") content = exportToCsv(result);

    navigator.clipboard.writeText(content);
    toast.success(`Copied records as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const availableTypes: DnsRecordType[] = DNS_RECORD_TYPES.filter(
    (t) => (recordTypeCounts[t] || 0) > 0,
  );

  return (
    <div className="space-y-6">
      {/* Lookup Control Card */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end"
        >
          {/* Domain Input */}
          <div className="lg:col-span-6 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
              <span>Domain or Hostname</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="inline-flex items-center gap-1 text-[11px] font-normal text-[var(--accent)] hover:underline capitalize"
                >
                  <History size={11} />{" "}
                  {showHistory ? "Hide Recent" : `Recent (${history.length})`}
                </button>
              )}
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
                placeholder="e.g. google.com, github.com, or IP"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/40 focus:border-[#D97757]/50 transition-all font-mono text-white"
              />
            </div>
          </div>

          {/* Record Type Select */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Record Type
            </label>
            <SelectMenu
              value={queryType}
              options={RECORD_TYPE_OPTIONS}
              onChange={(val) => setQueryType(val as DnsQueryType)}
              ariaLabel="Select Record Type"
              disabled={loading}
            />
          </div>

          {/* Provider Select */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              DNS Resolver
            </label>
            <SelectMenu
              value={provider}
              options={DNS_RESOLVER_OPTIONS}
              onChange={(val) => setProvider(val as DnsProvider)}
              ariaLabel="Select DNS Resolver"
              disabled={loading}
            />
          </div>

          {/* Search Button */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-[#1b120e] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/15 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Lookup
                </>
              )}
            </button>
          </div>
        </form>

        {/* History Dropdown */}
        {showHistory && history.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Recent Searches
              </span>
              <button
                type="button"
                onClick={clearHistory}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 size={11} /> Clear History
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleSelectPreset(item.domain, item.queryType)
                  }
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <span>{item.domain}</span>
                  <span className="text-[10px] text-[var(--accent)]">
                    ({item.queryType})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <DnsPresets onSelectDomain={handleSelectPreset} disabled={loading} />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-3">
          <Info size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-5">
          {/* Top Summary Cards */}
          <DnsSummaryCards result={result} />

          {/* Filtering and Export Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3.5">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === "ALL"
                    ? "bg-[var(--accent)] text-[#1b120e] font-semibold"
                    : "text-[var(--text-muted)] hover:text-white bg-white/[0.03] border border-white/[0.06]"
                }`}
              >
                All ({result.records.length})
              </button>

              {availableTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    filterType === t
                      ? "bg-[var(--accent)] text-[#1b120e] font-semibold"
                      : "text-[var(--text-muted)] hover:text-white bg-white/[0.03] border border-white/[0.06]"
                  }`}
                >
                  {t} ({recordTypeCounts[t]})
                </button>
              ))}
            </div>

            {/* Search within results & Export */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
                />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter records..."
                  className="pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-[var(--border)] text-xs text-white placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>

              {/* Export dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all"
                >
                  <Share2 size={13} /> Export
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl border border-white/[0.08] bg-[#1a1715] p-1.5 shadow-2xl z-20 space-y-1">
                    <button
                      type="button"
                      onClick={() => handleCopyExport("json")}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <FileJson size={13} className="text-amber-400" /> Copy
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyExport("bind")}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <FileCode2 size={13} className="text-blue-400" /> Copy
                      BIND Zone
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyExport("csv")}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <FileSpreadsheet size={13} className="text-emerald-400" />{" "}
                      Copy CSV Table
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Record List */}
          {filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredRecords.map((record) => (
                <DnsRecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-sm text-[var(--text-muted)]">
              No DNS records matching the current filter.
            </div>
          )}
        </div>
      )}

      {/* Introductory / Educational Info Card if no search executed yet */}
      {!result && !loading && (
        <div className="rounded-2xl border border-[var(--border)] bg-white/[0.01] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
            <Info size={16} /> What does DNS Records retrieve?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Server size={14} className="text-blue-400" /> A & AAAA
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                IPv4 (A) and IPv6 (AAAA) addresses pointing hostnames to
                physical or cloud servers.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Mail size={14} className="text-amber-400" /> MX Records
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Mail Exchange servers with priority order for inbound email
                deliverability.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" /> TXT & SPF /
                DKIM
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                SPF, DMARC, DKIM keys, and third-party domain ownership
                verifications (Google, MS, Apple).
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-purple-400" /> NS, SOA & CAA
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Authoritative Name Servers, Zone Serial, timers, and Certificate
                Authority SSL authorizations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
