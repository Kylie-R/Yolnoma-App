export type DnsRecordType =
  "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA" | "CAA" | "SRV" | "PTR";

export type DnsQueryType = "ALL" | DnsRecordType;

export type DnsProvider = "cloudflare" | "google" | "quad9" | "adguard";

export interface DnsRecordParsedData {
  priority?: number;
  target?: string;
  port?: number;
  weight?: number;
  tag?: string;
  flags?: number;
  mname?: string;
  rname?: string;
  serial?: number;
  refresh?: number;
  retry?: number;
  expire?: number;
  minimum?: number;
}

export interface DnsRecord {
  id: string;
  name: string;
  type: DnsRecordType;
  typeId: number;
  ttl: number;
  data: string;
  parsed?: DnsRecordParsedData;
  raw: string;
}

export interface DnsLookupResult {
  domain: string;
  provider: DnsProvider;
  queryType: DnsQueryType;
  records: DnsRecord[];
  status: string;
  statusCode: number;
  latencyMs: number;
  dnssecValid: boolean;
  timestamp: number;
}

export interface DnsHistoryItem {
  id: string;
  domain: string;
  queryType: DnsQueryType;
  provider: DnsProvider;
  recordCount: number;
  timestamp: number;
}

export interface DnsProviderInfo {
  id: DnsProvider;
  name: string;
  ip: string;
  description: string;
  endpoint: string;
}

export type SubdomainCategory =
  "api" | "auth" | "mail" | "dev" | "content" | "cloud" | "other";

export interface SubdomainItem {
  id: string;
  subdomain: string;
  fullDomain: string;
  ip?: string;
  asnOrg?: string;
  cname?: string;
  status: "live" | "unresolved" | "checking";
  category: SubdomainCategory;
  source: "ct_log" | "wordlist";
  ports?: number[];
  services?: string[];
  sslInfo?: SslCertificateInfo;
  httpHeaders?: HttpHeadersResult;
}

export interface HttpHeadersResult {
  statusCode: number;
  statusText: string;
  server?: string;
  contentType?: string;
  contentLength?: string;
  headers: Record<string, string>;
  securityHeaders: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    referrerPolicy?: string;
    permissionsPolicy?: string;
  };
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
}

export interface SslCertificateInfo {
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  serialNumber?: string;
  sanList: string[];
  score: number;
  grade: "A+" | "A" | "B" | "C" | "F";
  isExpired: boolean;
}

export interface DnsTransportInfo {
  resolver: string;
  protocol: "DNS-over-HTTPS" | "DNS-over-TLS" | "UDP 53";
  latencyMs: number;
  dnssec: boolean;
  authoritativeNs: string[];
  ipv4Count: number;
  ipv6Count: number;
  transportSecurity: string;
}

export interface SubdomainScanResult {
  domain: string;
  subdomains: SubdomainItem[];
  totalFound: number;
  liveCount: number;
  unresolvedCount: number;
  scanDurationMs: number;
  timestamp: number;
  transportInfo?: DnsTransportInfo;
  sslSummary?: SslCertificateInfo;
}

export type SubdomainViewMode = "relationship" | "tree" | "graph" | "grid";
