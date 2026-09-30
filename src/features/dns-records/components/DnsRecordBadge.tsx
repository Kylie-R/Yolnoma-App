import React from "react";
import type { DnsRecordType } from "../types";

interface DnsRecordBadgeProps {
  type: DnsRecordType | string;
  size?: "sm" | "md";
}

const BADGE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  A: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/25",
  },
  AAAA: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/25",
  },
  CNAME: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
  },
  MX: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/25",
  },
  TXT: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  NS: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/25",
  },
  SOA: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/25",
  },
  CAA: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/25",
  },
  SRV: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/25",
  },
  PTR: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/25",
  },
};

export const DnsRecordBadge: React.FC<DnsRecordBadgeProps> = ({
  type,
  size = "md",
}) => {
  const style = BADGE_STYLES[type] || {
    bg: "bg-white/10",
    text: "text-white/70",
    border: "border-white/15",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] font-semibold"
      : "px-2.5 py-1 text-xs font-bold tracking-wide";

  return (
    <span
      className={`inline-flex items-center justify-center font-mono rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      {type}
    </span>
  );
};
