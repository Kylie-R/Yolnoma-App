import { useState, useCallback, useMemo, useRef } from "react";
import type {
  SubdomainCategory,
  SubdomainItem,
  SubdomainScanResult,
  SubdomainViewMode,
} from "../types";
import { discoverSubdomains } from "../services/subdomainService";
import { toast } from "@/shared/ui/Toast";

export function useSubdomainFinder(initialDomain = "github.com") {
  const [domain, setDomain] = useState(initialDomain);
  const [scanning, setScanning] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [scanResult, setScanResult] = useState<SubdomainScanResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<SubdomainViewMode>("tree");
  const [selectedCategory, setSelectedCategory] = useState<
    SubdomainCategory | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "live" | "unresolved"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleScan = useCallback(
    async (targetDomain = domain) => {
      if (!targetDomain.trim()) {
        toast.error("Please enter a target domain name.");
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setScanning(true);
      setError(null);
      setProgressPercent(5);
      setProgressStep("Initializing subdomain discovery...");

      try {
        const result = await discoverSubdomains(
          targetDomain,
          (step, percent) => {
            setProgressStep(step);
            setProgressPercent(percent);
          },
          controller.signal,
        );

        setScanResult(result);
        if (result.subdomains.length === 0) {
          toast.warning(`No subdomains discovered for ${result.domain}.`);
        } else {
          toast.success(
            `Discovered ${result.totalFound} subdomains (${result.liveCount} live) in ${(
              result.scanDurationMs / 1000
            ).toFixed(1)}s!`,
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          toast.info("Subdomain scan cancelled.");
          return;
        }
        const msg =
          err instanceof Error ? err.message : "Subdomain discovery failed.";
        setError(msg);
        toast.error(msg);
      } finally {
        setScanning(false);
        abortControllerRef.current = null;
      }
    },
    [domain],
  );

  const cancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setScanning(false);
      setProgressStep("");
    }
  }, []);

  const filteredSubdomains = useMemo(() => {
    if (!scanResult) return [];
    return scanResult.subdomains.filter((item: SubdomainItem) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === "live" && item.status !== "live") return false;
      if (statusFilter === "unresolved" && item.status !== "unresolved")
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.fullDomain.toLowerCase().includes(q) ||
          (item.ip && item.ip.includes(q)) ||
          (item.cname && item.cname.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [scanResult, selectedCategory, statusFilter, searchQuery]);

  const categoryCounts = useMemo(() => {
    if (!scanResult) return {} as Record<SubdomainCategory, number>;
    const counts = {} as Record<SubdomainCategory, number>;
    for (const item of scanResult.subdomains) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [scanResult]);

  return {
    domain,
    setDomain,
    scanning,
    progressStep,
    progressPercent,
    scanResult,
    error,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredSubdomains,
    categoryCounts,
    handleScan,
    cancelScan,
  };
}
