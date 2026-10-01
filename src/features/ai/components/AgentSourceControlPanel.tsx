import { FileDiff, Loader2, RefreshCw } from "lucide-react";
import type { GitChange } from "@/features/git/types";
import { useTranslation } from "react-i18next";

function gitStatusColor(s: string) {
  if (s === "??" || s === "A") return "text-emerald-400";
  if (s === "D") return "text-red-400";
  if (s === "R") return "text-blue-400";
  return "text-amber-300";
}

function gitStatusLabel(s: string) {
  return (
    ({ "??": "U", A: "A", D: "D", M: "M", R: "R" } as Record<string, string>)[
      s
    ] ??
    s[0] ??
    "?"
  );
}

interface AgentSourceControlPanelProps {
  gitChanges: GitChange[];
  gitLoading: boolean;
  gitError: string;
  activePath?: string;
  onOpenDiffTab: (change: GitChange, forcePin?: boolean) => void;
  onRefresh: () => void;
}

export default function AgentSourceControlPanel({
  gitChanges,
  gitLoading,
  gitError,
  activePath,
  onOpenDiffTab,
  onRefresh,
}: AgentSourceControlPanelProps) {
  const { t } = useTranslation();
  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#11100d]">
      {/* Panel title */}
      <div className="flex h-8 items-center justify-between border-b border-white/[0.07] px-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          Source Control
        </span>
        <button
          type="button"
          onClick={onRefresh}
          title={t("ai.refreshGit")}
          className="text-white/25 hover:text-white transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Changes list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {gitLoading && (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-white/40">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        )}
        {gitError && (
          <p className="rounded bg-red-400/10 p-2 text-[11px] text-red-300">
            {gitError}
          </p>
        )}
        {!gitLoading && !gitError && gitChanges.length === 0 && (
          <p className="px-2 py-3 text-xs text-white/25">
            No changes detected.
          </p>
        )}
        {gitChanges.map((change) => {
          const isActive = activePath === change.path;
          return (
            <button
              key={change.path}
              type="button"
              onClick={() => onOpenDiffTab(change, false)}
              onDoubleClick={() => onOpenDiffTab(change, true)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-white/[0.05] transition-colors ${
                isActive ? "bg-[var(--accent-dim)]" : ""
              }`}
            >
              <FileDiff size={12} className="shrink-0 text-white/30" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/60">
                {change.path}
              </span>
              <span
                className={`shrink-0 text-[10px] font-bold ${gitStatusColor(change.status)}`}
              >
                {gitStatusLabel(change.status)}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
