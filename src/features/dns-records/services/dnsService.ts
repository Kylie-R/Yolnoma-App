import type {
  DnsLookupResult,
  DnsProvider,
  DnsProviderInfo,
  DnsQueryType,
  DnsRecord,
  DnsRecordParsedData,
  DnsRecordType,
} from "../types";

export const DNS_PROVIDERS: readonly DnsProviderInfo[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    ip: "1.1.1.1",
    description: "Fast, privacy-first DNS resolver",
    endpoint: "https://cloudflare-dns.com/dns-query",
  },
  {
    id: "google",
    name: "Google Public DNS",
    ip: "8.8.8.8",
    description: "Reliable and globally distributed resolver",
    endpoint: "https://dns.google/resolve",
  },
  {
    id: "quad9",
    name: "Quad9",
    ip: "9.9.9.9",
    description: "Security & malware blocking resolver",
    endpoint: "https://dns.quad9.net/dns-query",
  },
  {
    id: "adguard",
    name: "AdGuard DNS",
    ip: "94.140.14.14",
    description: "Ad-blocking and privacy resolver",
    endpoint: "https://dns.adguard-dns.com/dns-query",
  },
];

export const DNS_RECORD_TYPES: readonly DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
  "SRV",
  "PTR",
];

export const ALL_COMMON_TYPES: readonly DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
  "SRV",
];

const TYPE_ID_MAP: Record<number, DnsRecordType> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

const STATUS_CODES: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
  6: "YXDOMAIN",
  7: "YXRRSET",
  8: "NXRRSET",
  9: "NOTAUTH",
  10: "NOTZONE",
};

interface RawDnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface RawDnsResponse {
  Status: number;
  TC?: boolean;
  RD?: boolean;
  RA?: boolean;
  AD?: boolean;
  CD?: boolean;
  Question?: Array<{ name: string; type: number }>;
  Answer?: RawDnsAnswer[];
  Authority?: RawDnsAnswer[];
  Comment?: string;
}

export function cleanDomainInput(input: string): string {
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^[a-z]+:\/\//, "");
  cleaned = cleaned.replace(/\/.*$/, "");
  cleaned = cleaned.replace(/:\d+$/, "");
  cleaned = cleaned.replace(/^\.+|\.+$/g, "");
  return cleaned;
}

export function isIpv4(value: string): boolean {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    value,
  );
}

export function formatIpv4ToArpa(ip: string): string {
  return ip.split(".").reverse().join(".") + ".in-addr.arpa";
}

function parseRecordData(
  type: DnsRecordType,
  rawData: string,
): { data: string; parsed?: DnsRecordParsedData } {
  let cleanData = rawData.trim();

  switch (type) {
    case "TXT": {
      // Unquote TXT strings, handling potential concatenation
      const cleaned = cleanData
        .replace(/^"|"$/g, "")
        .replace(/"\s*"/g, "")
        .replace(/\\"/g, '"');
      return { data: cleaned };
    }

    case "MX": {
      // Format: "10 mail.example.com."
      const parts = cleanData.split(/\s+/);
      if (parts.length >= 2) {
        const priority = parseInt(parts[0], 10);
        const target = parts.slice(1).join(" ").replace(/\.$/, "");
        return {
          data: `${priority} ${target}`,
          parsed: { priority, target },
        };
      }
      return { data: cleanData.replace(/\.$/, "") };
    }

    case "SOA": {
      // Format: "mname rname serial refresh retry expire minimum"
      const parts = cleanData.split(/\s+/);
      if (parts.length >= 7) {
        const mname = parts[0].replace(/\.$/, "");
        const rawRname = parts[1].replace(/\.$/, "");
        const rname = rawRname.replace(".", "@");
        const serial = parseInt(parts[2], 10);
        const refresh = parseInt(parts[3], 10);
        const retry = parseInt(parts[4], 10);
        const expire = parseInt(parts[5], 10);
        const minimum = parseInt(parts[6], 10);
        return {
          data: cleanData,
          parsed: { mname, rname, serial, refresh, retry, expire, minimum },
        };
      }
      return { data: cleanData };
    }

    case "CAA": {
      // Format: '0 issue "letsencrypt.org"'
      const parts = cleanData.split(/\s+/);
      if (parts.length >= 3) {
        const flags = parseInt(parts[0], 10);
        const tag = parts[1];
        const value = parts.slice(2).join(" ").replace(/^"|"$/g, "");
        return {
          data: `${flags} ${tag} "${value}"`,
          parsed: { flags, tag, target: value },
        };
      }
      return { data: cleanData };
    }

    case "SRV": {
      // Format: "priority weight port target"
      const parts = cleanData.split(/\s+/);
      if (parts.length >= 4) {
        const priority = parseInt(parts[0], 10);
        const weight = parseInt(parts[1], 10);
        const port = parseInt(parts[2], 10);
        const target = parts.slice(3).join(" ").replace(/\.$/, "");
        return {
          data: `${priority} ${weight} ${port} ${target}`,
          parsed: { priority, weight, port, target },
        };
      }
      return { data: cleanData.replace(/\.$/, "") };
    }

    case "CNAME":
    case "NS":
    case "PTR":
      return {
        data: cleanData.replace(/\.$/, ""),
        parsed: { target: cleanData.replace(/\.$/, "") },
      };

    default:
      return { data: cleanData };
  }
}

async function querySingleType(
  domain: string,
  type: DnsRecordType,
  providerInfo: DnsProviderInfo,
): Promise<{
  records: DnsRecord[];
  status: string;
  statusCode: number;
  dnssec: boolean;
}> {
  const url = new URL(providerInfo.endpoint);
  url.searchParams.set("name", domain);
  url.searchParams.set("type", type);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/dns-json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DNS resolver responded with HTTP ${response.status}`);
    }

    const json = (await response.json()) as RawDnsResponse;
    const statusCode = json.Status ?? 0;
    const statusName = STATUS_CODES[statusCode] || `CODE_${statusCode}`;
    const dnssec = Boolean(json.AD);

    const answers = json.Answer || [];
    const authorities = json.Authority || [];
    const allRaw = [...answers, ...authorities];

    const records: DnsRecord[] = allRaw
      .filter((ans) => {
        const mappedType = TYPE_ID_MAP[ans.type];
        return (
          mappedType === type ||
          (!TYPE_ID_MAP[ans.type] && ans.type.toString() === type)
        );
      })
      .map((ans, idx) => {
        const recordType = TYPE_ID_MAP[ans.type] || type;
        const { data, parsed } = parseRecordData(recordType, ans.data);
        return {
          id: `${domain}-${recordType}-${idx}-${ans.data}`,
          name: ans.name.replace(/\.$/, ""),
          type: recordType,
          typeId: ans.type,
          ttl: ans.TTL,
          data,
          parsed,
          raw: ans.data,
        };
      });

    return {
      records,
      status: statusName,
      statusCode,
      dnssec,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupDnsRecords(
  inputDomain: string,
  queryType: DnsQueryType = "ALL",
  providerId: DnsProvider = "cloudflare",
): Promise<DnsLookupResult> {
  const cleaned = cleanDomainInput(inputDomain);
  if (!cleaned) {
    throw new Error("Please enter a valid domain or IP address.");
  }

  // If user entered an IP address and requested PTR (or PTR was clicked), convert to in-addr.arpa
  let targetDomain = cleaned;
  if (isIpv4(cleaned) && queryType === "PTR") {
    targetDomain = formatIpv4ToArpa(cleaned);
  }

  const provider =
    DNS_PROVIDERS.find((p) => p.id === providerId) || DNS_PROVIDERS[0];
  const startTime = performance.now();

  if (queryType === "ALL") {
    const promises = ALL_COMMON_TYPES.map((t) =>
      querySingleType(targetDomain, t, provider)
        .then((res) => ({ success: true as const, res }))
        .catch((err) => ({
          success: false as const,
          error: err instanceof Error ? err.message : String(err),
        })),
    );

    const results = await Promise.all(promises);
    const latencyMs = Math.round(performance.now() - startTime);

    const allRecords: DnsRecord[] = [];
    let mainStatus = "NOERROR";
    let mainStatusCode = 0;
    let anyDnssec = false;

    for (const r of results) {
      if (r.success) {
        allRecords.push(...r.res.records);
        if (r.res.statusCode !== 0 && mainStatusCode === 0) {
          mainStatus = r.res.status;
          mainStatusCode = r.res.statusCode;
        }
        if (r.res.dnssec) anyDnssec = true;
      }
    }

    // Deduplicate records by type and data
    const seen = new Set<string>();
    const uniqueRecords: DnsRecord[] = [];
    for (const rec of allRecords) {
      const key = `${rec.type}|${rec.name}|${rec.data}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecords.push(rec);
      }
    }

    // Sort logically: A, AAAA, CNAME, MX, TXT, NS, SOA, CAA, SRV
    const typeOrder: Record<string, number> = {
      A: 1,
      AAAA: 2,
      CNAME: 3,
      MX: 4,
      TXT: 5,
      NS: 6,
      SOA: 7,
      CAA: 8,
      SRV: 9,
      PTR: 10,
    };

    uniqueRecords.sort((a, b) => {
      const orderA = typeOrder[a.type] ?? 99;
      const orderB = typeOrder[b.type] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.data.localeCompare(b.data);
    });

    return {
      domain: cleaned,
      provider: providerId,
      queryType: "ALL",
      records: uniqueRecords,
      status: uniqueRecords.length > 0 ? "NOERROR" : mainStatus,
      statusCode: uniqueRecords.length > 0 ? 0 : mainStatusCode,
      latencyMs,
      dnssecValid: anyDnssec,
      timestamp: Date.now(),
    };
  }

  // Single record type lookup
  const singleRes = await querySingleType(targetDomain, queryType, provider);
  const latencyMs = Math.round(performance.now() - startTime);

  return {
    domain: cleaned,
    provider: providerId,
    queryType,
    records: singleRes.records,
    status: singleRes.status,
    statusCode: singleRes.statusCode,
    latencyMs,
    dnssecValid: singleRes.dnssec,
    timestamp: Date.now(),
  };
}

export function formatTTL(ttl: number): string {
  if (ttl < 60) return `${ttl}s`;
  if (ttl < 3600) {
    const mins = Math.floor(ttl / 60);
    const secs = ttl % 60;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  }
  const hours = Math.floor(ttl / 3600);
  const mins = Math.floor((ttl % 3600) / 60);
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function exportToJson(result: DnsLookupResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportToBindZone(result: DnsLookupResult): string {
  const lines: string[] = [
    `; Domain: ${result.domain}`,
    `; Provider: ${result.provider}`,
    `; Timestamp: ${new Date(result.timestamp).toISOString()}`,
    `; Status: ${result.status}`,
    `$ORIGIN ${result.domain}.`,
    `$TTL 300`,
    "",
  ];

  for (const r of result.records) {
    const name = r.name.endsWith(".") ? r.name : `${r.name}.`;
    const paddedName = name.padEnd(28, " ");
    const paddedTTL = `${r.ttl}`.padEnd(8, " ");
    const paddedType = r.type.padEnd(8, " ");
    lines.push(`${paddedName} ${paddedTTL} IN  ${paddedType} ${r.data}`);
  }

  return lines.join("\n");
}

export function exportToCsv(result: DnsLookupResult): string {
  const rows = ["Type,Name,TTL,Value"];
  for (const r of result.records) {
    const escapedValue = `"${r.data.replace(/"/g, '""')}"`;
    rows.push(`${r.type},${r.name},${r.ttl},${escapedValue}`);
  }
  return rows.join("\n");
}
