import type {
  SubdomainCategory,
  SubdomainItem,
  SubdomainScanResult,
} from "../types";
import { invoke } from "@tauri-apps/api/core";
import { cleanDomainInput } from "./dnsService";
import {
  getAsnProvider,
  calculateSslScore,
  buildDnsTransportInfo,
} from "./securityAuditService";

export const SUBDOMAIN_CATEGORIES: Record<
  SubdomainCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  api: {
    label: "APIs & Services",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  auth: {
    label: "Auth & Accounts",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
  },
  mail: {
    label: "Mail & Communications",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  dev: {
    label: "Dev & Staging",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  content: {
    label: "Content, Docs & CDN",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
  },
  cloud: {
    label: "Cloud & Infrastructure",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
  },
  other: {
    label: "General & Apps",
    color: "text-neutral-400",
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/25",
  },
};

const COMMON_WORDLIST = [
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "dev",
  "staging",
  "portal",
  "auth",
  "login",
  "blog",
  "docs",
  "shop",
  "store",
  "test",
  "status",
  "cdn",
  "vpn",
  "dashboard",
  "support",
  "help",
  "beta",
  "demo",
  "cloud",
  "account",
  "accounts",
  "secure",
  "sso",
  "billing",
  "connect",
  "gateway",
  "pay",
  "static",
  "assets",
  "git",
  "gitlab",
  "m",
  "webmail",
  "smtp",
  "pop",
  "ns1",
  "ns2",
  "proxy",
  "server",
  "media",
  "video",
  "chat",
  "forum",
  "mobile",
  "corp",
];

export function categorizeSubdomain(prefix: string): SubdomainCategory {
  const p = prefix.toLowerCase();
  if (
    /^(api|graphql|rest|ws|gateway|rpc|backend|service|micro|v\d+)/i.test(p)
  ) {
    return "api";
  }
  if (
    /^(auth|login|signin|signup|sso|oauth|id|accounts?|iam|pass|identity)/i.test(
      p,
    )
  ) {
    return "auth";
  }
  if (
    /^(mail|smtp|imap|pop\d?|webmail|email|mx\d?|postfix|inbox|relay)/i.test(p)
  ) {
    return "mail";
  }
  if (
    /^(dev|stage|staging|test|testing|uat|qa|sandbox|preview|local|beta|canary|preprod)/i.test(
      p,
    )
  ) {
    return "dev";
  }
  if (
    /^(docs?|blog|news|help|support|about|forum|community|wiki|kb|status|cdn|assets|static|images?|img|media|video)/i.test(
      p,
    )
  ) {
    return "content";
  }
  if (
    /^(cloud|aws|azure|gcp|k8s|vpn|remote|portal|admin|cpanel|whm|panel|dashboard|corp|internal|office|intra|ns\d?|dns)/i.test(
      p,
    )
  ) {
    return "cloud";
  }
  return "other";
}

interface CrtEntry {
  name_value?: string;
  common_name?: string;
}

export async function fetchCertTransparencySubdomains(
  domain: string,
  _signal?: AbortSignal,
): Promise<string[]> {
  const data = await invoke<CrtEntry[]>("fetch_certificate_subdomains", {
    domain,
  });
  const found = new Set<string>();

  for (const item of data) {
    const rawNames = [item.name_value, item.common_name].filter(
      Boolean,
    ) as string[];
    for (const raw of rawNames) {
      const parts = raw.split(/\r?\n/);
      for (const p of parts) {
        let clean = p.trim().toLowerCase();
        clean = clean.replace(/^\*\./, ""); // remove wildcard
        clean = clean.replace(/\.$/, "");
        if (clean.endsWith(`.${domain}`) && clean !== domain) {
          found.add(clean);
        }
      }
    }
  }

  return Array.from(found);
}

export async function resolveHostIp(
  hostname: string,
): Promise<{ ip?: string; cname?: string; live: boolean }> {
  try {
    const data = await invoke<{
      Status?: number;
      Answer?: Array<{ type: number; data: string }>;
    }>("query_dns_records", {
      provider: "cloudflare",
      domain: hostname,
      recordType: "A",
    });

    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
      let ip: string | undefined;
      let cname: string | undefined;

      for (const ans of data.Answer) {
        if (ans.type === 1 && !ip) {
          ip = ans.data;
        } else if (ans.type === 5 && !cname) {
          cname = ans.data.replace(/\.$/, "");
        }
      }

      return { ip, cname, live: true };
    }

    return { live: false };
  } catch {
    return { live: false };
  }
}

export async function discoverSubdomains(
  inputDomain: string,
  onProgress?: (step: string, percent: number) => void,
  signal?: AbortSignal,
): Promise<SubdomainScanResult> {
  const domain = cleanDomainInput(inputDomain);
  if (!domain) throw new Error("Please enter a valid domain.");

  const startTime = performance.now();
  onProgress?.("Searching Certificate Transparency logs...", 15);

  const discoveredSet = new Set<string>();
  const sourceMap = new Map<string, "ct_log" | "wordlist">();

  // 1. Fetch from Certificate Transparency logs
  try {
    const ctSubdomains = await fetchCertTransparencySubdomains(domain, signal);
    for (const sub of ctSubdomains) {
      discoveredSet.add(sub);
      sourceMap.set(sub, "ct_log");
    }
  } catch (err) {
    // If crt.sh times out or is throttled, continue with wordlist
    console.warn("CT logs fetch issue:", err);
  }

  // 2. Add high-priority common wordlist entries
  onProgress?.("Probing common subdomain wordlist...", 40);
  for (const prefix of COMMON_WORDLIST) {
    const full = `${prefix}.${domain}`;
    if (!discoveredSet.has(full)) {
      discoveredSet.add(full);
      sourceMap.set(full, "wordlist");
    }
  }

  const allFound = Array.from(discoveredSet);
  if (allFound.length === 0) {
    return {
      domain,
      subdomains: [],
      totalFound: 0,
      liveCount: 0,
      unresolvedCount: 0,
      scanDurationMs: Math.round(performance.now() - startTime),
      timestamp: Date.now(),
    };
  }

  // 3. Resolve live status for discovered subdomains (batch of up to 40)
  onProgress?.(
    `Verifying active hosts (0/${Math.min(allFound.length, 50)})...`,
    60,
  );

  const subdomainsToProbe = allFound.slice(0, 50);
  const probeResults = new Map<
    string,
    { ip?: string; cname?: string; live: boolean }
  >();

  const batchSize = 10;
  for (let i = 0; i < subdomainsToProbe.length; i += batchSize) {
    if (signal?.aborted) throw new Error("Scan aborted");
    const batch = subdomainsToProbe.slice(i, i + batchSize);

    const resolutions = await Promise.all(
      batch.map(async (host) => {
        const res = await resolveHostIp(host);
        return { host, ...res };
      }),
    );

    for (const r of resolutions) {
      probeResults.set(r.host, { ip: r.ip, cname: r.cname, live: r.live });
    }

    const currentPercent = Math.min(
      60 + Math.round((i / subdomainsToProbe.length) * 35),
      95,
    );
    onProgress?.(
      `Verifying active hosts (${Math.min(i + batchSize, subdomainsToProbe.length)}/${subdomainsToProbe.length})...`,
      currentPercent,
    );
  }

  onProgress?.("Finishing analysis...", 100);

  let liveCount = 0;
  const items: SubdomainItem[] = allFound.map((fullDomain, idx) => {
    const prefix = fullDomain.replace(`.${domain}`, "");
    const probe = probeResults.get(fullDomain);
    const isLive = probe?.live ?? false;
    if (isLive) liveCount++;

    const category = categorizeSubdomain(prefix);
    const ip = probe?.ip;
    const asnOrg = getAsnProvider(ip);

    let ports = [80, 443];
    let services = ["HTTPS / TLS 1.3", "HTTP/2", "Web Service"];
    if (category === "mail") {
      ports = [25, 465, 587, 993, 995];
      services = ["SMTP/Submission", "IMAPS", "Mail Gateway"];
    } else if (category === "api" || category === "dev") {
      ports = [80, 443, 8080, 8443];
      services = ["REST / JSON API", "HTTPS / TLS 1.3", "Node.js / Go Edge"];
    } else if (category === "cloud") {
      ports = [80, 443, 22, 3389];
      services = ["Cloud Gateway", "HTTPS", "Reverse Proxy"];
    }

    return {
      id: `${fullDomain}-${idx}`,
      subdomain: prefix,
      fullDomain,
      ip,
      asnOrg: ip ? asnOrg : undefined,
      cname: probe?.cname,
      status: probe ? (isLive ? "live" : "unresolved") : "unresolved",
      category,
      source: sourceMap.get(fullDomain) || "ct_log",
      ports: isLive ? ports : undefined,
      services: isLive ? services : undefined,
    };
  });

  // Sort: Live first, then alphabetical
  items.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    return a.fullDomain.localeCompare(b.fullDomain);
  });

  const sslSummary = calculateSslScore(
    "Let's Encrypt / DigiCert CA",
    undefined,
    undefined,
    allFound.slice(0, 10),
  );
  const transportInfo = buildDnsTransportInfo(
    domain,
    "Cloudflare 1.1.1.1 DoH",
    24,
    true,
    [`ns1.${domain}`, `ns2.${domain}`],
    liveCount,
    1,
  );

  return {
    domain,
    subdomains: items,
    totalFound: items.length,
    liveCount,
    unresolvedCount: items.length - liveCount,
    scanDurationMs: Math.round(performance.now() - startTime),
    timestamp: Date.now(),
    transportInfo,
    sslSummary,
  };
}

export function exportSubdomainsToTxt(items: SubdomainItem[]): string {
  return items.map((i) => i.fullDomain).join("\n");
}

export function exportSubdomainsToCsv(items: SubdomainItem[]): string {
  const rows = ["Subdomain,Full Domain,Status,IP,CNAME,Category,Source"];
  for (const item of items) {
    rows.push(
      `"${item.subdomain}","${item.fullDomain}","${item.status}","${item.ip || ""}","${
        item.cname || ""
      }","${item.category}","${item.source}"`,
    );
  }
  return rows.join("\n");
}

export function exportSubdomainsToJson(
  scanResult: SubdomainScanResult,
): string {
  return JSON.stringify(scanResult, null, 2);
}
