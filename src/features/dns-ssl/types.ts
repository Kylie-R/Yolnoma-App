export interface DnsRecord {
  recordType: string;
  name: string;
  value: string;
  ttl: number;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  validNow: boolean;
  daysRemaining: number;
}

export interface TlsAudit {
  verifiedConnection: boolean;
  httpStatus: number | null;
  certificate: CertificateInfo | null;
  error: string | null;
}

export interface DnsSslAudit {
  domain: string;
  providerHint: string | null;
  records: DnsRecord[];
  dnsWarnings: string[];
  tls: TlsAudit;
}
