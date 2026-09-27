import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Cloud,
  Globe,
  LockKeyhole,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { toast } from "@/shared/ui/Toast";

const MOCK_AUDIT = {
  domain: "example.com",
  provider: "Cloudflare",
  status: "Healthy",
  expiry: "2027-02-14",
  tls: "TLS 1.3",
  records: [
    { type: "A", value: "93.184.216.34", status: "Healthy" },
    {
      type: "AAAA",
      value: "2606:2800:220:1:248:1893:25c8:1946",
      status: "Healthy",
    },
    { type: "MX", value: "mail.example.com", status: "Healthy" },
    {
      type: "TXT",
      value: "v=spf1 include:_spf.example.com ~all",
      status: "Healthy",
    },
    { type: "NS", value: "ns1.example.net", status: "Healthy" },
  ],
};

export default function DnsSslAuditPage() {
  const [domain, setDomain] = useState("example.com");
  const [query, setQuery] = useState("");

  const audit = useMemo(() => {
    const target = domain.trim() || MOCK_AUDIT.domain;
    return {
      ...MOCK_AUDIT,
      domain: target,
    };
  }, [domain]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit.records;
    return audit.records.filter(
      (entry) =>
        entry.type.toLowerCase().includes(q) ||
        entry.value.toLowerCase().includes(q) ||
        entry.status.toLowerCase().includes(q),
    );
  }, [audit.records, query]);

  const copySummary = async () => {
    const text = [
      `Domain: ${audit.domain}`,
      `Provider: ${audit.provider}`,
      `Status: ${audit.status}`,
      `TLS: ${audit.tls}`,
      `SSL expiry: ${audit.expiry}`,
      ...audit.records.map((entry) => `${entry.type}: ${entry.value}`),
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
              Validate DNS health and certificate status
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Review DNS records, detect the likely provider, and check whether
              the SSL chain and certificate are in good standing.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => void copySummary()}
            className="w-fit"
          >
            Copy summary
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
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
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>Health</span>
            <BadgeCheck size={16} className="text-emerald-400" />
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Domain</span>
              <strong className="text-white">{audit.domain}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Provider</span>
              <strong className="text-white">{audit.provider}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <strong className="text-emerald-300">{audit.status}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="TLS"
          value={audit.tls}
          accent="text-sky-400"
          icon={ShieldCheck}
        />
        <MetricCard
          label="SSL expires"
          value={audit.expiry}
          accent="text-violet-400"
          icon={LockKeyhole}
        />
        <MetricCard
          label="DNS provider"
          value={audit.provider}
          accent="text-amber-400"
          icon={Cloud}
        />
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">DNS records</h2>
            <p className="text-sm text-white/45">
              Quick record review with health tags and propagation visibility.
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

        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <div className="grid grid-cols-[0.8fr_1.8fr_0.8fr] bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <span>Type</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {filteredRecords.map((record) => (
            <div
              key={`${record.type}-${record.value}`}
              className="grid grid-cols-[0.8fr_1.8fr_0.8fr] border-t border-white/[0.05] px-3 py-3 text-sm text-white/70"
            >
              <span className="font-mono text-[var(--accent)]">
                {record.type}
              </span>
              <span className="break-all font-mono text-xs text-white/75">
                {record.value}
              </span>
              <span className="text-emerald-300">{record.status}</span>
            </div>
          ))}
        </div>
      </section>
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
