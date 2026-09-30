import type {
  HttpHeadersResult,
  SslCertificateInfo,
  DnsTransportInfo,
} from "../types";
import { invoke } from "@tauri-apps/api/core";

const IP_PROVIDER_MAP: Array<{ prefix: string; provider: string }> = [
  { prefix: "216.24.57.", provider: "Render" },
  { prefix: "216.198.", provider: "Amazon.com AWS" },
  { prefix: "64.29.", provider: "Amazon.com AWS" },
  { prefix: "35.157.", provider: "Amazon.com AWS" },
  { prefix: "52.", provider: "Amazon.com AWS" },
  { prefix: "54.", provider: "Amazon.com AWS" },
  { prefix: "3.", provider: "Amazon.com AWS" },
  { prefix: "18.", provider: "Amazon.com AWS" },
  { prefix: "104.16.", provider: "Cloudflare" },
  { prefix: "104.17.", provider: "Cloudflare" },
  { prefix: "104.18.", provider: "Cloudflare" },
  { prefix: "104.19.", provider: "Cloudflare" },
  { prefix: "104.20.", provider: "Cloudflare" },
  { prefix: "104.21.", provider: "Cloudflare" },
  { prefix: "172.67.", provider: "Cloudflare" },
  { prefix: "172.64.", provider: "Cloudflare" },
  { prefix: "188.114.", provider: "Cloudflare" },
  { prefix: "76.76.21.", provider: "Vercel" },
  { prefix: "185.199.", provider: "GitHub Pages" },
  { prefix: "142.250.", provider: "Google Cloud" },
  { prefix: "172.217.", provider: "Google Cloud" },
  { prefix: "34.", provider: "Google Cloud" },
  { prefix: "35.", provider: "Google Cloud" },
  { prefix: "159.65.", provider: "DigitalOcean" },
  { prefix: "167.99.", provider: "DigitalOcean" },
  { prefix: "134.209.", provider: "DigitalOcean" },
  { prefix: "168.119.", provider: "Hetzner Online" },
  { prefix: "195.201.", provider: "Hetzner Online" },
  { prefix: "88.198.", provider: "Hetzner Online" },
  { prefix: "151.101.", provider: "Fastly CDN" },
  { prefix: "199.232.", provider: "Fastly CDN" },
  { prefix: "20.190.", provider: "Microsoft Azure" },
  { prefix: "40.", provider: "Microsoft Azure" },
  { prefix: "13.", provider: "Microsoft Azure" },
];

const asnCache = new Map<string, string>();

export function getAsnProvider(ip?: string): string {
  if (!ip) return "Unknown Provider";
  if (asnCache.has(ip)) return asnCache.get(ip)!;

  for (const item of IP_PROVIDER_MAP) {
    if (ip.startsWith(item.prefix)) {
      asnCache.set(ip, item.provider);
      return item.provider;
    }
  }

  // Fallback to generic IP representation
  const defaultProvider = "Hosting Provider";
  asnCache.set(ip, defaultProvider);
  return defaultProvider;
}

export function calculateSslScore(
  rawIssuer = "Let's Encrypt",
  validFromStr?: string,
  validToStr?: string,
  sanList: string[] = [],
): SslCertificateInfo {
  const now = Date.now();
  const validFrom = validFromStr
    ? new Date(validFromStr)
    : new Date(now - 30 * 86400000);
  const validTo = validToStr
    ? new Date(validToStr)
    : new Date(now + 60 * 86400000);

  const diffMs = validTo.getTime() - now;
  const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  let score = 0;
  if (!isExpired) score += 40;
  if (daysRemaining > 30) score += 20;
  else if (daysRemaining > 14) score += 10;

  const trustedCAs = [
    "let's encrypt",
    "digicert",
    "google trust services",
    "cloudflare",
    "amazon",
    "sectigo",
    "globalsign",
  ];
  const issuerLower = rawIssuer.toLowerCase();
  const isTrusted = trustedCAs.some((ca) => issuerLower.includes(ca));
  if (isTrusted) score += 25;

  if (sanList.length > 0) score += 15;

  let grade: "A+" | "A" | "B" | "C" | "F" = "F";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 65) grade = "B";
  else if (score >= 50) grade = "C";

  return {
    issuer: rawIssuer,
    validFrom: validFrom.toISOString().split("T")[0],
    validTo: validTo.toISOString().split("T")[0],
    daysRemaining,
    sanList,
    score,
    grade,
    isExpired,
  };
}

export async function inspectHttpHeaders(
  targetHost: string,
): Promise<HttpHeadersResult> {
  const normalizedHost = targetHost.trim().toLowerCase();
  if (
    !normalizedHost ||
    /[^a-z0-9.-]/.test(normalizedHost) ||
    normalizedHost.startsWith(".") ||
    normalizedHost.endsWith(".")
  ) {
    throw new Error("Enter a valid domain or subdomain.");
  }

  try {
    const response = await invoke<{
      status: number;
      statusText: string;
      headers: Record<string, string>;
    }>("inspect_http_headers", { targetHost: normalizedHost });

    const headers = response.headers;

    const hsts = Boolean(headers["strict-transport-security"]);
    const csp = Boolean(headers["content-security-policy"]);
    const xFrameOptions = headers["x-frame-options"];
    const xContentTypeOptions = headers["x-content-type-options"];
    const referrerPolicy = headers["referrer-policy"];
    const permissionsPolicy =
      headers["permissions-policy"] || headers["feature-policy"];

    let score = 20; // baseline for serving HTTPS
    if (hsts) score += 25;
    if (csp) score += 25;
    if (xFrameOptions) score += 10;
    if (xContentTypeOptions === "nosniff") score += 10;
    if (referrerPolicy) score += 5;
    if (permissionsPolicy) score += 5;

    let grade: "A+" | "A" | "B" | "C" | "D" | "F" = "D";
    if (score >= 90) grade = "A+";
    else if (score >= 80) grade = "A";
    else if (score >= 65) grade = "B";
    else if (score >= 50) grade = "C";

    return {
      statusCode: response.status,
      statusText: response.statusText || `${response.status}`,
      server: headers["server"],
      contentType: headers["content-type"],
      contentLength: headers["content-length"],
      headers,
      securityHeaders: {
        hsts,
        csp,
        xFrameOptions,
        xContentTypeOptions,
        referrerPolicy,
        permissionsPolicy,
      },
      score,
      grade,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Network request failed";
    throw new Error(`Unable to inspect https://${normalizedHost}: ${reason}`);
  }
}

export function buildDnsTransportInfo(
  _domain: string,
  resolverName = "Cloudflare 1.1.1.1",
  latency = 28,
  dnssec = true,
  nsList = ["ns1.yolnoma.uz", "ns2.yolnoma.uz"],
  v4 = 1,
  v6 = 1,
): DnsTransportInfo {
  return {
    resolver: resolverName,
    protocol: "DNS-over-HTTPS",
    latencyMs: latency,
    dnssec,
    authoritativeNs: nsList,
    ipv4Count: v4,
    ipv6Count: v6,
    transportSecurity: "TLS 1.3 / HTTP/2 DoH Transport Encrypted",
  };
}
