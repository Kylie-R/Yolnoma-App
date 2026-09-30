import React from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  Mail,
  Globe2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { DnsLookupResult } from "../types";

interface DnsSummaryCardsProps {
  result: DnsLookupResult;
}

export const DnsSummaryCards: React.FC<DnsSummaryCardsProps> = ({ result }) => {
  const isSuccess = result.statusCode === 0;
  const nsCount = result.records.filter((r) => r.type === "NS").length;
  const mxCount = result.records.filter((r) => r.type === "MX").length;
  const aCount = result.records.filter((r) => r.type === "A").length;
  const aaaaCount = result.records.filter((r) => r.type === "AAAA").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* Status & Latency */}
      <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          {isSuccess ? (
            <CheckCircle2 size={13} className="text-emerald-400" />
          ) : (
            <XCircle size={13} className="text-rose-400" />
          )}
          Status
        </span>
        <div className="mt-2">
          <p
            className={`font-mono text-base font-bold ${
              isSuccess ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {result.status}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
            <Activity size={11} className="text-[var(--accent)]" />{" "}
            {result.latencyMs} ms latency
          </p>
        </div>
      </div>

      {/* Total Records */}
      <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Server size={13} className="text-blue-400" /> Total Records
        </span>
        <div className="mt-2">
          <p className="font-mono text-xl font-bold text-white">
            {result.records.length}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            resolved entries
          </p>
        </div>
      </div>

      {/* IP Addresses */}
      <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Globe2 size={13} className="text-cyan-400" /> IPs (v4 / v6)
        </span>
        <div className="mt-2">
          <p className="font-mono text-xl font-bold text-white">
            {aCount}{" "}
            <span className="text-sm font-normal text-[var(--text-muted)]">
              /
            </span>{" "}
            {aaaaCount}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            IPv4 & IPv6 records
          </p>
        </div>
      </div>

      {/* Mail Servers */}
      <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Mail size={13} className="text-amber-400" /> Mail Servers
        </span>
        <div className="mt-2">
          <p className="font-mono text-xl font-bold text-white">{mxCount}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {nsCount} nameservers
          </p>
        </div>
      </div>

      {/* DNSSEC */}
      <div className="col-span-2 sm:col-span-1 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5 flex flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          {result.dnssecValid ? (
            <ShieldCheck size={13} className="text-emerald-400" />
          ) : (
            <ShieldAlert size={13} className="text-white/40" />
          )}
          DNSSEC
        </span>
        <div className="mt-2">
          <p
            className={`font-mono text-sm font-bold ${
              result.dnssecValid ? "text-emerald-400" : "text-white/60"
            }`}
          >
            {result.dnssecValid ? "Authenticated" : "Standard"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {result.dnssecValid ? "AD flag validated" : "No AD flag present"}
          </p>
        </div>
      </div>
    </div>
  );
};
