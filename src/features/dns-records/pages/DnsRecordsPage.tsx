import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Network, ListTree, ShieldCheck } from "lucide-react";
import ToolNavigation from "@/shared/ui/ToolNavigation";
import { useHashTab } from "@/shared/hooks/useHashTab";
import { DnsLookupTab } from "../components/DnsLookupTab";
import { SubdomainFinderTab } from "../components/SubdomainFinderTab";
import { SecurityAuditTab } from "../components/SecurityAuditTab";

type Tab = "dns-lookup" | "subdomains" | "security-audit";
type TabDefinition = [Tab, string, LucideIcon];

export default function DnsRecordsPage() {
  const { t } = useTranslation();
  const tabs: TabDefinition[] = [
    ["dns-lookup", t("dns.records"), Network],
    ["subdomains", t("dns.subdomains"), ListTree],
    ["security-audit", t("dns.security"), ShieldCheck],
  ];
  const [tab, selectTab] = useHashTab(
    tabs.map(([id]) => id),
    "dns-lookup",
    "#/tools/dns-records",
  );

  return (
    <div className="mx-auto min-h-full max-w-7xl pb-16 text-[var(--text-primary)]">
      {/* Workspace Header */}
      <header className="border-b border-white/[0.08] pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("dns.eyebrow")}
        </p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              {t("dns.title")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              {t("dns.desc")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />{" "}
            {t("dns.doh")}
          </div>
        </div>
      </header>

      {/* Workspace Navigation via ToolNavigation */}
      <div className="mt-8">
        <ToolNavigation items={tabs} active={tab} onChange={selectTab} />

        <main className="mt-8 min-w-0">
          {tab === "dns-lookup" && <DnsLookupTab />}
          {tab === "subdomains" && <SubdomainFinderTab />}
          {tab === "security-audit" && <SecurityAuditTab />}
        </main>
      </div>
    </div>
  );
}
