import { useState } from "react";
import { auditDnsSsl } from "../api/dnsSslApi";
import type { DnsSslAudit } from "../types";

export function useDnsSslAudit() {
  const [audit, setAudit] = useState<DnsSslAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async (domain: string) => {
    setIsAuditing(true);
    setError(null);
    setAudit(null);
    try {
      const result = await auditDnsSsl(domain);
      setAudit(result);
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      throw cause;
    } finally {
      setIsAuditing(false);
    }
  };

  return { audit, isAuditing, error, runAudit };
}
