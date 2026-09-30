import { useState, useCallback, useMemo } from "react";
import type {
  DnsHistoryItem,
  DnsLookupResult,
  DnsProvider,
  DnsQueryType,
  DnsRecordType,
} from "../types";
import { lookupDnsRecords, cleanDomainInput } from "../services/dnsService";
import { toast } from "@/shared/ui/Toast";

const STORAGE_KEY = "yolnoma_dns_history";
const MAX_HISTORY = 10;

function loadHistory(): DnsHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DnsHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: DnsHistoryItem[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function useDnsLookup(initialDomain = "") {
  const [domain, setDomain] = useState(initialDomain);
  const [queryType, setQueryType] = useState<DnsQueryType>("ALL");
  const [provider, setProvider] = useState<DnsProvider>("cloudflare");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnsLookupResult | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | DnsRecordType>("ALL");
  const [history, setHistory] = useState<DnsHistoryItem[]>(loadHistory);

  const performLookup = useCallback(
    async (
      targetDomain = domain,
      targetType = queryType,
      targetProvider = provider,
    ) => {
      const clean = cleanDomainInput(targetDomain);
      if (!clean) {
        toast.error("Please enter a domain or IP address.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const lookupRes = await lookupDnsRecords(
          clean,
          targetType,
          targetProvider,
        );
        setResult(lookupRes);

        // Update history
        const newItem: DnsHistoryItem = {
          id: `${clean}-${targetType}-${Date.now()}`,
          domain: clean,
          queryType: targetType,
          provider: targetProvider,
          recordCount: lookupRes.records.length,
          timestamp: Date.now(),
        };

        setHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.domain !== clean || item.queryType !== targetType,
          );
          const next = [newItem, ...filtered].slice(0, MAX_HISTORY);
          saveHistory(next);
          return next;
        });

        if (lookupRes.records.length === 0) {
          toast.warning(
            `No ${targetType === "ALL" ? "" : targetType + " "}records found for ${clean}.`,
          );
        } else {
          toast.success(
            `Found ${lookupRes.records.length} record${lookupRes.records.length === 1 ? "" : "s"} (${lookupRes.latencyMs}ms)`,
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "DNS lookup failed.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [domain, queryType, provider],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Search history cleared.");
    } catch {
      // Ignore
    }
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const filteredRecords = useMemo(() => {
    if (!result) return [];
    return result.records.filter((rec) => {
      if (filterType !== "ALL" && rec.type !== filterType) {
        return false;
      }
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        return (
          rec.name.toLowerCase().includes(query) ||
          rec.data.toLowerCase().includes(query) ||
          rec.type.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [result, filterType, searchFilter]);

  const recordTypeCounts = useMemo(() => {
    if (!result) return {};
    const counts: Record<string, number> = {};
    for (const r of result.records) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return counts;
  }, [result]);

  return {
    domain,
    setDomain,
    queryType,
    setQueryType,
    provider,
    setProvider,
    loading,
    error,
    result,
    searchFilter,
    setSearchFilter,
    filterType,
    setFilterType,
    filteredRecords,
    recordTypeCounts,
    history,
    performLookup,
    clearHistory,
    removeFromHistory,
  };
}
