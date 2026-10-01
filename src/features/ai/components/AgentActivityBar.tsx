import { Files, GitBranch } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SidebarPanel = "explorer" | "source-control";

interface AgentActivityBarProps {
  sidebarVisible: boolean;
  sidebarPanel: SidebarPanel;
  gitChangesCount: number;
  onTogglePanel: (panel: SidebarPanel) => void;
}

export default function AgentActivityBar({
  sidebarVisible,
  sidebarPanel,
  gitChangesCount,
  onTogglePanel,
}: AgentActivityBarProps) {
  const { t } = useTranslation();
  return (
    <nav className="flex w-10 shrink-0 flex-col border-r border-white/[0.08] bg-[#0f0e0b] pt-1">
      <button
        type="button"
        title={t("ai.explorer")}
        onClick={() => onTogglePanel("explorer")}
        className={`flex h-10 w-full items-center justify-center border-l-2 transition-colors ${
          sidebarVisible && sidebarPanel === "explorer"
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-white/35 hover:text-white"
        }`}
      >
        <Files size={18} />
      </button>
      <button
        type="button"
        title={t("ai.sourceControl")}
        onClick={() => onTogglePanel("source-control")}
        className={`relative flex h-10 w-full items-center justify-center border-l-2 transition-colors ${
          sidebarVisible && sidebarPanel === "source-control"
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-white/35 hover:text-white"
        }`}
      >
        <GitBranch size={18} />
        {gitChangesCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-black">
            {Math.min(gitChangesCount, 9)}
            {gitChangesCount > 9 ? "+" : ""}
          </span>
        )}
      </button>
    </nav>
  );
}
