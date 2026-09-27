import React from "react";
import { Sparkles } from "lucide-react";
import type { DnsQueryType } from "../types";

interface DnsPresetsProps {
  onSelectDomain: (domain: string, type?: DnsQueryType) => void;
  disabled?: boolean;
}

const PRESET_DOMAINS = [
  { domain: "google.com", label: "google.com" },
  { domain: "cloudflare.com", label: "cloudflare.com" },
  { domain: "github.com", label: "github.com" },
  { domain: "wikipedia.org", label: "wikipedia.org" },
  { domain: "openai.com", label: "openai.com" },
  { domain: "apple.com", label: "apple.com" },
];

export const DnsPresets: React.FC<DnsPresetsProps> = ({
  onSelectDomain,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="text-[var(--text-faint)] flex items-center gap-1 font-medium">
        <Sparkles size={12} className="text-[var(--accent)]" /> Quick Presets:
      </span>
      {PRESET_DOMAINS.map(({ domain, label }) => (
        <button
          key={domain}
          type="button"
          disabled={disabled}
          onClick={() => onSelectDomain(domain)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-40"
        >
          {label}
        </button>
      ))}
    </div>
  );
};
