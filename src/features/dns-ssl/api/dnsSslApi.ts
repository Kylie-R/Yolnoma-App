import { invoke } from "@tauri-apps/api/core";
import type { DnsSslAudit } from "../types";

export function auditDnsSsl(domain: string): Promise<DnsSslAudit> {
  return invoke<DnsSslAudit>("audit_dns_ssl", { domain });
}
