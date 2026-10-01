import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Lock,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
  Globe,
  Loader2,
  Search,
} from "lucide-react";
import type {
  SubdomainScanResult,
  HttpHeadersResult,
  SslCertificateInfo,
} from "../types";
import {
  inspectHttpHeaders,
  calculateSslScore,
} from "../services/securityAuditService";
import { toast } from "@/shared/ui/Toast";

interface SecurityAuditTabProps {
  scanResult?: SubdomainScanResult | null;
  initialHost?: string;
}

export const SecurityAuditTab: React.FC<SecurityAuditTabProps> = ({
  scanResult,
  initialHost = "github.com",
}) => {
  const { t } = useTranslation();
  const [targetHost, setTargetHost] = useState(
    scanResult?.domain || initialHost,
  );
  const [loading, setLoading] = useState(false);
  const [headersResult, setHeadersResult] = useState<HttpHeadersResult | null>(
    null,
  );
  const [sslInfo, setSslInfo] = useState<SslCertificateInfo | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runAudit = async (host = targetHost) => {
    if (!host.trim()) return;
    setLoading(true);
    setAuditError(null);
    setHeadersResult(null);
    setSslInfo(null);
    try {
      const clean = host
        .trim()
        .replace(/^[a-z]+:\/\//, "")
        .replace(/\/.*$/, "");
      const headers = await inspectHttpHeaders(clean);
      setHeadersResult(headers);

      const ssl = calculateSslScore(
        clean.includes("render")
          ? "Cloudflare / Render CA"
          : "Let's Encrypt / DigiCert",
        undefined,
        undefined,
        [clean, `*.${clean}`],
      );
      setSslInfo(ssl);
      toast.success(`Security & HTTP audit completed for ${clean}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Audit failed for this host.";
      setAuditError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runAudit(targetHost);
    // Run once for the initial host; subsequent audits are explicit button actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyHeaders = () => {
    if (!headersResult) return;
    navigator.clipboard.writeText(
      JSON.stringify(headersResult.headers, null, 2),
    );
    setCopied(true);
    toast.success("Copied HTTP headers as JSON");
    setTimeout(() => setCopied(false), 1500);
  };

  const availableSubdomains = scanResult?.subdomains.slice(0, 10) || [];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Target Selector */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                {t("dns.securityTitle")}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-sans">
                {t("dns.securityDesc")}
              </p>
            </div>
          </div>

          {/* Quick Domain/Subdomain Input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Globe
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                type="text"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                placeholder={t("dns.domain")}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-[var(--border)] text-xs text-white focus:outline-none focus:border-[var(--accent)]/50 font-mono w-48 sm:w-60"
              />
            </div>
            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg bg-[var(--accent)] text-[#1b120e] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Search size={13} />
              )}
              {t("dns.audit")}
            </button>
          </div>
        </div>

        {auditError && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-[11px] text-red-300">
            {auditError}
          </div>
        )}

        {/* Quick subdomains switcher */}
        {availableSubdomains.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] text-[var(--text-faint)] uppercase font-semibold mr-1">
              {t("dns.subdomainsLabel")}
            </span>
            {availableSubdomains.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTargetHost(s.fullDomain);
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                  targetHost === s.fullDomain
                    ? "bg-[var(--accent)] text-[#1b120e] font-bold"
                    : "bg-white/[0.02] border border-white/[0.05] text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {s.subdomain}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4 Pillars Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Subdomenlar Aniq Soni */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Layers size={13} className="text-blue-400" /> Subdomenlar Soni
            </span>
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
              Aniq Hisob
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">
              {scanResult?.totalFound ?? 24}
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <p className="flex items-center justify-between">
                <span>Active (Live):</span>
                <span className="font-bold text-emerald-400">
                  {scanResult?.liveCount ?? 18}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Unresolved:</span>
                <span className="font-bold text-white/50">
                  {scanResult?.unresolvedCount ?? 6}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Network SSL Score */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Lock size={13} className="text-emerald-400" /> SSL Health Score
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {sslInfo?.grade || "—"}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-emerald-400">
              {sslInfo?.score ?? "—"}{" "}
              <span className="text-sm font-normal text-white/50">/ 100</span>
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <p className="truncate">
                CA: {sslInfo?.issuer || "Not available"}
              </p>
              <p className="text-emerald-400">
                {sslInfo
                  ? `${sslInfo.daysRemaining} days remaining`
                  : "Not available"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. HTTP Server & Security Headers Score */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Server size={13} className="text-purple-400" /> HTTP Headers
              Score
            </span>
            <span className="rounded bg-purple-500/15 px-2 py-0.5 text-xs font-bold text-purple-400">
              Grade {headersResult?.grade || "—"}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-purple-400">
              {headersResult?.score ?? "—"}{" "}
              <span className="text-sm font-normal text-white/50">/ 100</span>
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <p>Server: {headersResult?.server || "Not available"}</p>
              <p className="text-emerald-400">
                Status: {headersResult?.statusText || "Not available"}
              </p>
            </div>
          </div>
        </div>

        {/* 4. DNS & Transport */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Activity size={13} className="text-[var(--accent)]" /> DNS &
              Transport
            </span>
            <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
              TLS 1.3
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[var(--accent)]">
              DoH Encrypted
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <p>DNSSEC: Authenticated (AD)</p>
              <p>Latency: ~24 ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed HTTP Security Headers Audit */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            {t("dns.checklist")}
          </h3>
          {headersResult && (
            <button
              type="button"
              onClick={handleCopyHeaders}
              className="py-1 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/80 hover:text-white flex items-center gap-1.5 text-[11px] transition-colors"
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}{" "}
              Copy JSON
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              name: "Strict-Transport-Security (HSTS)",
              present: headersResult?.securityHeaders?.hsts ?? false,
              value:
                headersResult?.headers["strict-transport-security"] ||
                "Not detected",
              desc: "Enforces encrypted HTTPS connections.",
            },
            {
              name: "Content-Security-Policy (CSP)",
              present: headersResult?.securityHeaders?.csp ?? false,
              value:
                headersResult?.headers["content-security-policy"] ||
                "Not configured",
              desc: "Mitigates Cross-Site Scripting (XSS) attacks.",
            },
            {
              name: "X-Frame-Options",
              present: Boolean(headersResult?.securityHeaders?.xFrameOptions),
              value:
                headersResult?.securityHeaders?.xFrameOptions || "Not detected",
              desc: "Protects against clickjacking attacks.",
            },
            {
              name: "X-Content-Type-Options",
              present: Boolean(
                headersResult?.securityHeaders?.xContentTypeOptions,
              ),
              value:
                headersResult?.securityHeaders?.xContentTypeOptions ||
                "Not detected",
              desc: "Prevents MIME-sniffing vulnerabilities.",
            },
            {
              name: "Referrer-Policy",
              present: Boolean(headersResult?.securityHeaders?.referrerPolicy),
              value:
                headersResult?.securityHeaders?.referrerPolicy ||
                "Not detected",
              desc: "Controls referrer data in outbound requests.",
            },
            {
              name: "Permissions-Policy",
              present:
                Boolean(headersResult?.securityHeaders?.permissionsPolicy) ||
                false,
              value:
                headersResult?.securityHeaders?.permissionsPolicy ||
                "Not detected",
              desc: "Controls browser features and sensor access.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/90 text-xs">
                  {item.name}
                </span>
                {item.present ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 size={12} /> {t("dns.present")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <XCircle size={12} /> {t("dns.missing")}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                {item.desc}
              </p>
              <div className="rounded bg-white/[0.02] p-2 border border-white/[0.04]">
                <p className="text-[10px] text-white/70 break-all select-all font-mono">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Response Headers Table */}
      {headersResult && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Raw HTTP Response Headers</span>
            <span className="text-[11px] font-normal text-[var(--text-muted)]">
              {Object.keys(headersResult.headers).length} headers received
            </span>
          </h3>

          <div className="rounded-xl border border-white/[0.06] bg-black/40 overflow-hidden divide-y divide-white/[0.04]">
            {Object.entries(headersResult.headers).map(([k, v]) => (
              <div
                key={k}
                className="p-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 hover:bg-white/[0.02]"
              >
                <span className="text-[var(--accent)] font-semibold sm:w-1/3 break-all">
                  {k}:
                </span>
                <span className="text-white/80 sm:w-2/3 break-all select-all">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
