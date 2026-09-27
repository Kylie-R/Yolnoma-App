import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Cloud,
  LoaderCircle,
  Globe,
  LockKeyhole,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { toast } from "@/shared/ui/Toast";
import { useDnsSslAudit } from "../hooks/useDnsSslAudit";

export default function DnsSslAuditPage() {
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");
  const { audit, isAuditing, error, runAudit } = useDnsSslAudit();

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit?.records ?? [];
    return (audit?.records ?? []).filter(
      (entry) =>
        entry.recordType.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.value.toLowerCase().includes(q),
    );
  }, [audit, query]);

  const handleAudit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAudit(domain).catch(() => undefined);
  };

  const copySummary = async () => {
    if (!audit) return;
    const certificate = audit.tls.certificate;
    const text = [
      `Domain: ${audit.domain}`,
      `DNS provider hint: ${audit.providerHint ?? "Unknown"}`,
      `TLS certificate verified: ${audit.tls.verifiedConnection}`,
      `TLS HTTP status: ${audit.tls.httpStatus ?? "Unavailable"}`,
      `Certificate issuer: ${certificate?.issuer ?? "Unavailable"}`,
      `Certificate expires: ${certificate?.notAfter ?? "Unavailable"}`,
      ...audit.dnsWarnings.map((warning) => `DNS warning: ${warning}`),
      ...audit.records.map(
        (entry) =>
          `${entry.recordType} ${entry.name}: ${entry.value} (TTL ${entry.ttl}s)`,
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Audit summary copied.");
    } catch {
      toast.error("Clipboard access is unavailable.");
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          <LockKeyhole size={18} />
          DNS + SSL Audit
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Inspect live DNS and TLS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Query public DNS records and verify the HTTPS certificate served
              by the domain. DNS answers are fetched through Cloudflare
              DNS-over-HTTPS.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => void copySummary()}
            className="w-fit"
            disabled={!audit}
          >
            Copy summary
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleAudit}
          className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl"
        >
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Domain
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
            <Globe size={18} className="text-[var(--accent)]" />
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/25"
              placeholder="example.com"
              autoComplete="url"
              aria-label="Domain to audit"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isAuditing || !domain.trim()}
            >
              {isAuditing ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                "Audit"
              )}
            </Button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 text-sm text-rose-300"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>Health</span>
            {audit?.tls.verifiedConnection ? (
              <BadgeCheck size={16} className="text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="text-amber-300" />
            )}
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Domain</span>
              <strong className="max-w-[65%] truncate text-white">
                {audit?.domain ?? "Not checked"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>DNS provider hint</span>
              <strong className="text-white">
                {audit?.providerHint ?? (audit ? "Unknown" : "Not checked")}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Certificate</span>
              <strong
                className={
                  audit?.tls.verifiedConnection
                    ? "text-emerald-300"
                    : "text-amber-300"
                }
              >
                {audit
                  ? audit.tls.verifiedConnection
                    ? "Verified"
                    : "Not verified"
                  : "Not checked"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="HTTPS response"
          value={audit?.tls.httpStatus ? String(audit.tls.httpStatus) : "—"}
          accent="text-sky-400"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Certificate expiry"
          value={
            audit?.tls.certificate?.daysRemaining != null
              ? `${audit.tls.certificate.daysRemaining} days`
              : "—"
          }
          accent="text-violet-400"
          icon={LockKeyhole}
        />
        <MetricCard
          label="DNS provider"
          value={audit?.providerHint ?? "Unknown"}
          accent="text-amber-400"
          icon={Cloud}
        />
      </section>

      {audit && (
        <>
          {audit.tls.error && (
            <div
              role="status"
              className="flex gap-3 border-l-2 border-amber-400 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80"
            >
              <AlertCircle size={18} className="shrink-0 text-amber-300" />
              <span>{audit.tls.error}</span>
            </div>
          )}
          {audit.tls.certificate && (
            <section className="grid gap-3 border-y border-white/[0.08] py-4 text-sm sm:grid-cols-2">
              <CertificateDetail
                label="Subject"
                value={audit.tls.certificate.subject}
              />
              <CertificateDetail
                label="Issuer"
                value={audit.tls.certificate.issuer}
              />
              <CertificateDetail
                label="Valid from"
                value={audit.tls.certificate.notBefore}
              />
              <CertificateDetail
                label="Valid until"
                value={audit.tls.certificate.notAfter}
              />
              <CertificateDetail
                label="Validity window"
                value={
                  audit.tls.certificate.validNow
                    ? "Currently valid"
                    : "Outside validity period"
                }
              />
            </section>
          )}
          {audit.dnsWarnings.length > 0 && (
            <section aria-label="DNS warnings" className="space-y-2">
              {audit.dnsWarnings.map((warning, index) => (
                <p
                  key={`${warning}-${index}`}
                  className="text-sm text-amber-200/75"
                >
                  {warning}
                </p>
              ))}
            </section>
          )}
        </>
      )}

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">DNS records</h2>
            <p className="text-sm text-white/45">
              Live answers with record owner names and resolver TTL values.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 text-sm text-white/65">
            <Search size={16} className="text-[var(--accent)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-44 bg-transparent text-sm outline-none placeholder:text-white/25"
              placeholder="Filter record"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[0.6fr_1fr_2fr_0.6fr] bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              <span>Type</span>
              <span>Name</span>
              <span>Value</span>
              <span>TTL</span>
            </div>
            {filteredRecords.map((record) => (
              <div
                key={`${record.recordType}-${record.name}-${record.value}`}
                className="grid grid-cols-[0.6fr_1fr_2fr_0.6fr] border-t border-white/[0.05] px-3 py-3 text-sm text-white/70"
              >
                <span className="font-mono text-[var(--accent)]">
                  {record.recordType}
                </span>
                <span className="break-all font-mono text-xs text-white/75">
                  {record.name}
                </span>
                <span className="break-all font-mono text-xs text-white/75">
                  {record.value}
                </span>
                <span>{record.ttl}s</span>
              </div>
            ))}
            {audit && filteredRecords.length === 0 && (
              <p className="border-t border-white/[0.05] px-3 py-6 text-center text-sm text-white/45">
                {audit.records.length === 0
                  ? "No DNS records were returned for this domain."
                  : "No records match this filter."}
              </p>
            )}
            {!audit && !isAuditing && (
              <p className="border-t border-white/[0.05] px-3 py-6 text-center text-sm text-white/45">
                Enter a public domain and run an audit to load live results.
              </p>
            )}
            {isAuditing && (
              <p className="border-t border-white/[0.05] px-3 py-6 text-center text-sm text-white/45">
                Querying DNS and checking the HTTPS certificate…
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CertificateDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-xs text-white/75">
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 ${accent}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
    </div>
  );
}
