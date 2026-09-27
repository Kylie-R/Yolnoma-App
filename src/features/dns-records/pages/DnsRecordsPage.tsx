import React from "react";
import { Network, ListTree } from "lucide-react";
import { useHashTab } from "@/shared/hooks/useHashTab";
import { DnsLookupTab } from "../components/DnsLookupTab";
import { SubdomainFinderTab } from "../components/SubdomainFinderTab";

type DnsWorkspaceTab = "dns-lookup" | "subdomains";

const TABS: readonly {
  id: DnsWorkspaceTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "dns-lookup", label: "DNS Records", icon: Network },
  { id: "subdomains", label: "Subdomain Finder & Visualizer", icon: ListTree },
];

export default function DnsRecordsPage() {
  const [activeTab, selectTab] = useHashTab(
    TABS.map((t) => t.id),
    "dns-lookup",
    "#/tools/dns-records",
  );

  return (
    <div className="min-h-full p-6 max-w-6xl mx-auto space-y-6 text-[#F2EDE6]">
      {/* Workspace Header */}
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2.5 text-[#D97757] mb-1.5">
          <Network size={22} strokeWidth={2} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            Network & DNS Studio
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[var(--text-primary)]">
              DNS Records & Subdomain Explorer
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Inspect zone DNS records, SPF/DKIM verifications, and discover
              active subdomains with topology visualization.
            </p>
          </div>

          {/* Workspace Tabs */}
          <div className="flex items-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-1 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTab(id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-[var(--accent)] text-[#1b120e] shadow-md shadow-[var(--accent)]/15"
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <main className="min-w-0">
        {activeTab === "dns-lookup" && <DnsLookupTab />}
        {activeTab === "subdomains" && <SubdomainFinderTab />}
      </main>
    </div>
  );
}
