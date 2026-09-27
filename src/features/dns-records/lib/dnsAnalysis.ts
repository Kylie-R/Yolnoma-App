export type DnsRecordValue = {
  name?: string;
  type?: string;
  ttl?: number;
  data?: string;
  value?: string;
  priority?: number;
  answer?: string;
};

export type NormalizedDnsRecord = {
  name: string;
  type: string;
  ttl: number;
  value: string;
  priority?: number;
};

export type DnsProviderHint = {
  name: string;
  summary: string;
  evidence: string[];
};

export type DnsSubdomainAnalysis = {
  name: string;
  records: NormalizedDnsRecord[];
  providerHints: string[];
};

export type DnsAnalysis = {
  domain: string;
  providers: DnsProviderHint[];
  subdomains: DnsSubdomainAnalysis[];
  totalRecords: number;
};

export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "SRV",
  "CAA",
  "PTR",
] as const;

export const COMMON_SUBDOMAINS = [
  "www",
  "mail",
  "mx",
  "ftp",
  "smtp",
  "imap",
  "admin",
  "app",
  "api",
  "assets",
  "blog",
  "cdn",
  "cpanel",
  "dashboard",
  "dev",
  "docs",
  "internal",
  "legacy",
  "login",
  "m",
  "ns1",
  "ns2",
  "old",
  "panel",
  "portal",
  "shop",
  "stage",
  "store",
  "test",
  "vpn",
  "webmail",
  "www1",
  "www2",
];

const PROVIDER_PATTERNS: Array<{
  name: string;
  summary: string;
  patterns: RegExp[];
}> = [
  {
    name: "Cloudflare",
    summary: "Cloudflare-managed DNS and edge routing.",
    patterns: [/cloudflare/i, /\.ns\.cloudflare\.com/i, /\.cdn\.cloudflare/i],
  },
  {
    name: "Vercel",
    summary: "Vercel DNS / edge platform.",
    patterns: [/vercel-dns/i, /\.vercel\.com/i, /\.vercel-dns\.com/i],
  },
  {
    name: "Netlify",
    summary: "Netlify DNS and hosting.",
    patterns: [/netlify\.com/i, /\.netlify\.com/i],
  },
  {
    name: "GitHub Pages",
    summary: "GitHub Pages / GitHub DNS route.",
    patterns: [/github\.io/i, /githubusercontent\.com/i],
  },
  {
    name: "AWS / Route 53",
    summary: "Amazon Route 53 or AWS-managed DNS.",
    patterns: [/awsdns/i, /amazonaws\.com/i, /\.cloudfront\.net/i],
  },
  {
    name: "Azure",
    summary: "Microsoft Azure DNS settings.",
    patterns: [/azure-dns/i, /azurewebsites\.net/i, /azureedge\.net/i],
  },
  {
    name: "DigitalOcean",
    summary: "DigitalOcean DNS / app platform.",
    patterns: [/digitalocean\.com/i, /digitaloceanspaces\.com/i],
  },
  {
    name: "Namecheap",
    summary: "Namecheap DNS configuration.",
    patterns: [/namecheap\.com/i, /\.namecheaphosting\.com/i],
  },
  {
    name: "GoDaddy",
    summary: "GoDaddy-managed DNS records.",
    patterns: [/godaddy\.com/i, /domaincontrol\.com/i],
  },
  {
    name: "Google Cloud / Workspace",
    summary: "Google DNS or Workspace mail routing.",
    patterns: [/google\.com/i, /googleusercontent\.com/i, /googlemail\.com/i],
  },
];

export function normalizeDomain(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  return cleaned.replace(/\s+/g, "").replace(/\*\./, "");
}

export function buildSubdomainCandidates(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  if (!normalized || !normalized.includes(".")) {
    return [normalized];
  }

  const candidates = new Set<string>([normalized]);
  for (const sub of COMMON_SUBDOMAINS) {
    candidates.add(`${sub}.${normalized}`);
  }
  return Array.from(candidates);
}

export function normalizeDnsRecord(
  raw: DnsRecordValue,
  fallbackName?: string,
): NormalizedDnsRecord {
  const recordName = (raw.name ?? fallbackName ?? "").replace(/\.$/, "");
  const type = (raw.type ?? "TXT").toUpperCase();
  const data = raw.data ?? raw.value ?? raw.answer ?? "";
  const normalizedValue = data.trim();

  return {
    name: recordName || fallbackName || "",
    type,
    ttl: typeof raw.ttl === "number" ? raw.ttl : 0,
    value: normalizedValue,
    priority: typeof raw.priority === "number" ? raw.priority : undefined,
  };
}

export function inferProviderHints(
  records: NormalizedDnsRecord[],
  domain: string,
): DnsProviderHint[] {
  const evidenceBuffer = new Set<string>();
  const values = records.flatMap((record) => [record.value, record.name]);

  const matches = PROVIDER_PATTERNS.filter((provider) =>
    provider.patterns.some((pattern) =>
      values.some((value) => pattern.test(value)),
    ),
  );

  if (matches.length === 0) {
    const nsRecords = records.filter((record) => record.type === "NS");
    if (nsRecords.length > 0) {
      const nsValue = nsRecords.map((record) => record.value).join(" ");
      evidenceBuffer.add(`Custom NS: ${nsValue}`);
    }
    if (domain) {
      evidenceBuffer.add(`No strong hosting signature detected for ${domain}.`);
    }
    return [
      {
        name: "Custom / Unknown DNS",
        summary: "No provider signature was confidently detected.",
        evidence: Array.from(evidenceBuffer),
      },
    ];
  }

  return matches.map((provider) => ({
    name: provider.name,
    summary: provider.summary,
    evidence: values
      .filter((value) =>
        provider.patterns.some((pattern) => pattern.test(value)),
      )
      .slice(0, 4),
  }));
}

export function analyzeDnsRecords(
  domain: string,
  recordsByHost: Record<string, NormalizedDnsRecord[]>,
): DnsAnalysis {
  const normalizedDomain = normalizeDomain(domain);
  const subdomains: DnsSubdomainAnalysis[] = Object.entries(recordsByHost).map(
    ([name, records]) => ({
      name,
      records,
      providerHints: inferProviderHints(records, normalizedDomain).map(
        (provider) => provider.name,
      ),
    }),
  );

  const allProviders = inferProviderHints(
    Object.values(recordsByHost)
      .flat()
      .filter((record) => record.type !== "SOA"),
    normalizedDomain,
  );

  const totalRecords = subdomains.reduce(
    (sum, item) => sum + item.records.length,
    0,
  );
  return {
    domain: normalizedDomain,
    providers: allProviders,
    subdomains,
    totalRecords,
  };
}
