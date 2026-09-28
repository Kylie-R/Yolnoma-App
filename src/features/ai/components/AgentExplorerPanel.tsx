import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";

export type TreeNode = {
  name: string;
  absPath: string;
  rel: string;
  kind: "file" | "directory";
  depth: number;
};

const TEXT_EXT =
  /\.(txt|md|mdx|json|jsonc|js|jsx|mjs|cjs|ts|tsx|css|scss|sass|less|html|htm|xml|yaml|yml|toml|ini|env|rs|py|go|java|kt|swift|c|h|cpp|hpp|cs|php|rb|sh|bash|bat|ps1|sql|graphql|vue|svelte|astro|gitignore|dockerfile|lock)$/i;

function fileIcon(name: string) {
  return TEXT_EXT.test(name) ? <FileCode2 size={13} /> : <FileText size={13} />;
}

interface AgentExplorerPanelProps {
  flatTree: TreeNode[];
  expanded: Set<string>;
  loadingDir: Set<string>;
  loadingProject: boolean;
  activeRel?: string;
  onToggleFolder: (node: TreeNode) => void;
  onOpenFileTab: (node: TreeNode, forcePin?: boolean) => void;
  onOpenProject: () => void;
}

export default function AgentExplorerPanel({
  flatTree,
  expanded,
  loadingDir,
  loadingProject,
  activeRel,
  onToggleFolder,
  onOpenFileTab,
  onOpenProject,
}: AgentExplorerPanelProps) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#11100d]">
      {/* Panel title */}
      <div className="flex h-8 items-center justify-between border-b border-white/[0.07] px-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          Explorer
        </span>
        <button
          type="button"
          onClick={onOpenProject}
          title="Change folder"
          className="text-white/25 hover:text-white transition-colors"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      {/* Explorer tree */}
      <div className="min-h-0 flex-1 overflow-y-auto py-0.5">
        {loadingProject ? (
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-white/40">
            <Loader2 size={12} className="animate-spin" /> Scanning…
          </div>
        ) : flatTree.length === 0 ? (
          <p className="px-3 py-3 text-xs text-white/25">No files found.</p>
        ) : (
          flatTree.map((node) => {
            const isDir = node.kind === "directory";
            const isExpanded = expanded.has(node.rel);
            const isLoading = loadingDir.has(node.rel);
            const isActiveFile = activeRel === node.rel;
            return (
              <button
                key={node.rel}
                type="button"
                onClick={() =>
                  void (isDir
                    ? onToggleFolder(node)
                    : onOpenFileTab(node, false))
                }
                onDoubleClick={() => void (!isDir && onOpenFileTab(node, true))}
                className={`flex w-full items-center gap-1 py-[3px] text-left text-[12px] hover:bg-white/[0.05] ${
                  isActiveFile
                    ? "bg-[var(--accent-dim)] text-white"
                    : "text-white/55"
                }`}
                style={{ paddingLeft: `${6 + node.depth * 14}px` }}
              >
                {isDir ? (
                  <span className="flex w-4 shrink-0 items-center text-white/35">
                    {isLoading ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : isExpanded ? (
                      <ChevronDown size={11} />
                    ) : (
                      <ChevronRight size={11} />
                    )}
                  </span>
                ) : (
                  <span className="w-4 shrink-0" />
                )}
                {isDir ? (
                  <Folder size={12} className="shrink-0 text-amber-300/60" />
                ) : (
                  <span className="shrink-0 text-[var(--accent)]/60">
                    {fileIcon(node.name)}
                  </span>
                )}
                <span className="truncate">{node.name}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
