import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { GitBranch, GitCommitHorizontal, History } from "lucide-react";
import ToolNavigation from "@/shared/ui/ToolNavigation";
import { useHashTab } from "@/shared/hooks/useHashTab";
import CommitGenerator from "../components/CommitGenerator";
import CommitHistoryGraph from "../components/CommitHistoryGraph";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/shared/ui/Toast";
import type { GitChange } from "../types";

type Tab = "commit-generator" | "history-graph";
type TabDefinition = [Tab, string, LucideIcon];

const tabs: TabDefinition[] = [
  ["commit-generator", "Commit Generator", GitBranch],
  ["history-graph", "History Graph", History],
];
const tabIds = tabs.map(([id]) => id);

export default function GitPage() {
  const [tab, selectTab] = useHashTab(
    tabIds,
    "commit-generator",
    "#/tools/git",
  );
  const [folderPath, setFolderPath] = useState("");
  const [changes, setChanges] = useState<GitChange[]>([]);

  const refreshChanges = async (path = folderPath) => {
    if (!path) return;
    try {
      const next = await invoke<GitChange[]>("get_git_changes", {
        rootPath: path,
      });
      setChanges(next);
      if (!next.length) toast.info("No modified or new Git files found");
    } catch (value) {
      setChanges([]);
      toast.error(value instanceof Error ? value.message : String(value));
    }
  };

  const changeFolder = (path: string) => {
    setFolderPath(path);
    setChanges([]);
  };

  return (
    <div className="mx-auto min-h-full max-w-7xl pb-16 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Git Workspace
        </p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              A clearer view of your Git story
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Generate thoughtful commit options from current changes or explore
              the branch timeline without leaving Yolnoma.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <GitCommitHorizontal size={14} className="text-emerald-400" /> Local
            repository workspace
          </div>
        </div>
      </header>
      <div className="mt-8">
        <ToolNavigation items={tabs} active={tab} onChange={selectTab} />
        <main className="mt-8 min-w-0">
          {tab === "commit-generator" && (
            <CommitGenerator
              folderPath={folderPath}
              changes={changes}
              onFolderChange={changeFolder}
              onRefresh={refreshChanges}
            />
          )}
          {tab === "history-graph" && (
            <CommitHistoryGraph
              folderPath={folderPath}
              onFolderChange={changeFolder}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export { tabs };
export type { Tab };
