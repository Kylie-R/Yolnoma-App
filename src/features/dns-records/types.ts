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
