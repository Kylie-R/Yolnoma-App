import { useMemo, useState } from "react";
import {
  Cloud,
  Copy,
  Globe,
  Search,
  Server,
  ShieldCheck,
  Database,
  Layers3,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/shared/ui/Toast";
import { Button } from "@/shared/ui";
import {
  analyzeDnsRecords,
  buildSubdomainCandidates,
  COMMON_SUBDOMAINS,
  normalizeDnsRecord,
  normalizeDomain,
  RECORD_TYPES,
  type DnsRecordValue,
  type NormalizedDnsRecord,
} from "@/features/dns-records/lib/dnsAnalysis";

const SAMPLE_RECORDS: Record<string, DnsRecordValue[]> = {
  "example.com": [
    { name: "example.com", type: "A", ttl: 300, value: "93.184.216.34" },
    {
      name: "example.com",
      type: "MX",
      ttl: 300,
      priority: 10,
      value: "mail.example.com",
    },
    {
      name: "example.com",
      type: "TXT",
      ttl: 300,
      value: "v=spf1 include:_spf.example.com ~all",
    },
    { name: "example.com", type: "NS", ttl: 86400, value: "ns1.example.net" },
    { name: "example.com", type: "NS", ttl: 86400, value: "ns2.example.net" },
  ],
  "www.example.com": [
    { name: "www.example.com", type: "CNAME", ttl: 300, value: "example.com" },
    { name: "www.example.com", type: "A", ttl: 300, value: "93.184.216.34" },
  ],
  "mail.example.com": [
    { name: "mail.example.com", type: "A", ttl: 300, value: "212.11.123.88" },
    {
      name: "mail.example.com",
      type: "MX",
      ttl: 300,
      priority: 10,
      value: "mail.example.com",
    },
  ],
  "api.example.com": [
    {
      name: "api.example.com",
      type: "CNAME",
      ttl: 300,
      value: "ghs.googlehosted.com",
    },
    { name: "api.example.com", type: "A", ttl: 300, value: "142.250.190.78" },
  ],
  "cdn.example.com": [
    {
      name: "cdn.example.com",
      type: "CNAME",
      ttl: 300,
      value: "cdn.cloudflare.net",
    },
  ],
};

const buildSampleAnalysis = (domain: string) => {
  const recordsByHost: Record<string, NormalizedDnsRecord[]> = {};
  const candidates = buildSubdomainCandidates(domain);

  for (const candidate of candidates) {
    const rawRecords =
      SAMPLE_RECORDS[candidate] ?? SAMPLE_RECORDS["example.com"];
    if (rawRecords) {
      recordsByHost[candidate] = rawRecords.map((record) =>
        normalizeDnsRecord(record, candidate),
      );
    }
  }

  return analyzeDnsRecords(domain, recordsByHost);
};

export default function DnsRecordsPage() {
  const [domain, setDomain] = useState("example.com");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "records" | "providers">("all");

  const popularRecordTypes = useMemo(
    () => RECORD_TYPES.slice(0, 6).join(" · "),
    [],
  );

  const analysis = useMemo(() => {
    const cleanDomain = normalizeDomain(domain || "example.com");
    return buildSampleAnalysis(cleanDomain);
  }, [domain]);

  const filteredSubdomains = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analysis.subdomains.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.records.some((record) => record.type.toLowerCase().includes(q))
      );
    });
  }, [analysis, query]);

  const copySummary = async () => {
    const text = [
      `Domain: ${analysis.domain}`,
      `Total records: ${analysis.totalRecords}`,
      ...analysis.subdomains.map(
        (sub) => `${sub.name}: ${sub.records.length} records`,
      ),
      ...analysis.providers.map(
        (provider) => `Provider: ${provider.name} (${provider.summary})`,
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("DNS summary copied.");
    } catch {
      toast.error("Clipboard copy is unavailable in this browser.");
    }
  };

  const providerSummary = useMemo(() => {
    const flat = analysis.providers.map((provider) => provider.name).join(", ");
    return flat || "No provider match";
  }, [analysis.providers]);

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          <Cloud size={18} />
          DNS Records
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              DNS map for every subdomain
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Inspect host records, identify likely provider ownership, and
              trace how the whole domain is set up across subdomains.
            </p>
          </div>
          <Button variant="primary" onClick={copySummary} className="w-fit">
            Copy summary
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
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
            <span>Overview</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Domain</span>
              <strong className="text-white">{analysis.domain}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Record count</span>
              <strong className="text-white">{analysis.totalRecords}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Likely provider</span>
              <strong className="text-white">{providerSummary}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Server}
          label="Subdomains"
          value={String(analysis.subdomains.length)}
          accent="text-sky-400"
        />
        <StatCard
          icon={Database}
          label="A / AAAA / CNAME"
          value={String(
            analysis.subdomains.reduce(
              (sum, item) =>
                sum +
                item.records.filter((record) =>
                  ["A", "AAAA", "CNAME"].includes(record.type),
                ).length,
              0,
            ),
          )}
          accent="text-violet-400"
        />
        <StatCard
          icon={Layers3}
          label="MX / TXT / NS"
          value={String(
            analysis.subdomains.reduce(
              (sum, item) =>
                sum +
                item.records.filter((record) =>
                  ["MX", "TXT", "NS"].includes(record.type),
                ).length,
              0,
            ),
          )}
          accent="text-amber-400"
        />
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Host and record explorer
            </h2>
            <p className="text-sm text-white/45">
              Every zone record is grouped by host and shows what is pointing
              where.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 text-sm text-white/65">
            <Search size={16} className="text-[var(--accent)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-44 bg-transparent text-sm outline-none placeholder:text-white/25"
              placeholder="Filter host / type"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "records", "providers"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition ${mode === item ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white" : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSubdomains.map((subdomain) => (
            <div
              key={subdomain.name}
              className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                      Host
                    </span>
                    <span className="font-mono text-sm text-white">
                      {subdomain.name}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subdomain.providerHints.map((provider) => (
                      <span
                        key={`${subdomain.name}-${provider}`}
                        className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{subdomain.records.length} records</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              {mode !== "providers" && (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_1.7fr] bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    <span>Name</span>
                    <span>Type</span>
                    <span>TTL</span>
                    <span>Value</span>
                  </div>
                  {subdomain.records.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-white/35">
                      No records available for this host.
                    </div>
                  ) : (
                    subdomain.records.map((record, index) => (
                      <div
                        key={`${subdomain.name}-${record.type}-${index}`}
                        className="grid grid-cols-[1.2fr_0.8fr_0.7fr_1.7fr] border-t border-white/[0.05] px-3 py-2 text-sm text-white/70"
                      >
                        <span className="font-mono text-xs text-white/80">
                          {record.name || subdomain.name}
                        </span>
                        <span className="font-mono text-xs text-[var(--accent)]">
                          {record.type}
                        </span>
                        <span>{record.ttl || "-"}</span>
                        <span className="break-all font-mono text-xs text-white/80">
                          {record.value || "-"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              Hosting and DNS provider clues
            </h2>
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            {popularRecordTypes}
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {analysis.providers.map((provider) => (
            <div
              key={provider.name}
              className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {provider.name}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50">
                  Hint
                </span>
              </div>
              <p className="mb-3 text-sm text-white/60">{provider.summary}</p>
              <ul className="space-y-2 text-xs text-white/55">
                {provider.evidence.length === 0 ? (
                  <li>No explicit provider evidence found.</li>
                ) : (
                  provider.evidence.map((entry, index) => (
                    <li key={`${provider.name}-${index}`}>• {entry}</li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <Copy size={18} className="text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-white">
            Suggested subdomains
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_SUBDOMAINS.slice(0, 18).map((sub) => (
            <span
              key={sub}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-white/60"
            >
              {sub}.{analysis.domain}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Server;
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
