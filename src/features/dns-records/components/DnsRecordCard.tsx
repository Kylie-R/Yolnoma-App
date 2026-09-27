import React, { useState } from "react";
import {
  Copy,
  Check,
  Clock,
  Mail,
  ShieldAlert,
  Server,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { DnsRecord } from "../types";
import { DnsRecordBadge } from "./DnsRecordBadge";
import { formatTTL } from "../services/dnsService";
import { toast } from "@/shared/ui/Toast";

interface DnsRecordCardProps {
  record: DnsRecord;
}

export const DnsRecordCard: React.FC<DnsRecordCardProps> = ({ record }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(record.data);
    setCopied(true);
    toast.success(
      `Copied: ${record.data.slice(0, 40)}${record.data.length > 40 ? "..." : ""}`,
    );
    setTimeout(() => setCopied(false), 1600);
  };

  const isLongText = record.data.length > 120 || record.type === "SOA";

  return (
    <div className="group relative rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 transition-all hover:border-[var(--accent)]/40 hover:bg-white/[0.04]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Type badge + Name + Specific Meta */}
        <div className="flex items-start gap-3 min-w-0">
          <DnsRecordBadge type={record.type} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-medium text-[var(--text-primary)] break-all">
                {record.name}
              </span>

              {record.type === "MX" &&
                record.parsed?.priority !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                    <Mail size={11} /> Priority: {record.parsed.priority}
                  </span>
                )}

              {record.type === "CAA" && record.parsed?.tag && (
                <span className="inline-flex items-center gap-1 rounded bg-violet-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-400 border border-violet-500/20">
                  <ShieldAlert size={11} /> Tag: {record.parsed.tag}
                </span>
              )}

              {record.type === "SRV" && record.parsed?.port && (
                <span className="inline-flex items-center gap-1 rounded bg-orange-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-orange-400 border border-orange-500/20">
                  <Server size={11} /> Port: {record.parsed.port} (Pri:{" "}
                  {record.parsed.priority}, Wgt: {record.parsed.weight})
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-[var(--text-faint)]" />
                TTL: {formatTTL(record.ttl)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
          {isLongText && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Less" : "More"}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy record data"
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Value / Data Display */}
      <div className="mt-3 rounded-lg bg-black/30 border border-white/[0.04] p-3">
        <p
          className={`font-mono text-xs leading-relaxed text-white/90 break-words select-all ${
            !expanded && isLongText ? "line-clamp-2" : ""
          }`}
        >
          {record.data}
        </p>

        {/* SOA Deep Details */}
        {record.type === "SOA" && record.parsed && expanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Primary Nameserver
              </span>
              <span className="font-mono text-white/80 break-all">
                {record.parsed.mname || "—"}
              </span>
            </div>
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Responsible Email
              </span>
              <span className="font-mono text-white/80 break-all">
                {record.parsed.rname || "—"}
              </span>
            </div>
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Serial
              </span>
              <span className="font-mono text-white/80">
                {record.parsed.serial ?? "—"}
              </span>
            </div>
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Refresh
              </span>
              <span className="font-mono text-white/80">
                {record.parsed.refresh ? formatTTL(record.parsed.refresh) : "—"}
              </span>
            </div>
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Retry
              </span>
              <span className="font-mono text-white/80">
                {record.parsed.retry ? formatTTL(record.parsed.retry) : "—"}
              </span>
            </div>
            <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                Expire
              </span>
              <span className="font-mono text-white/80">
                {record.parsed.expire ? formatTTL(record.parsed.expire) : "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
