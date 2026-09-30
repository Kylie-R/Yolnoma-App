import { useMemo, useState } from "react";
import { Columns, AlignJustify, FileDiff, WrapText } from "lucide-react";

export type SideBySideRow =
  | {
      type: "hunk";
      content: string;
    }
  | {
      type: "diff";
      leftLineNum?: number;
      leftText?: string;
      leftType: "normal" | "delete" | "empty";
      rightLineNum?: number;
      rightText?: string;
      rightType: "normal" | "add" | "empty";
    };

export function parseUnifiedDiff(diffText: string): {
  rows: SideBySideRow[];
  additions: number;
  deletions: number;
} {
  const lines = diffText.split("\n");
  const rows: SideBySideRow[] = [];
  let additions = 0;
  let deletions = 0;

  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;

  let deletedBuffer: string[] = [];
  let addedBuffer: string[] = [];

  const flushBuffers = () => {
    if (deletedBuffer.length === 0 && addedBuffer.length === 0) return;
    const maxLen = Math.max(deletedBuffer.length, addedBuffer.length);
    for (let i = 0; i < maxLen; i++) {
      const hasLeft = i < deletedBuffer.length;
      const hasRight = i < addedBuffer.length;
      rows.push({
        type: "diff",
        leftLineNum: hasLeft ? oldLine++ : undefined,
        leftText: hasLeft ? deletedBuffer[i] : undefined,
        leftType: hasLeft ? "delete" : "empty",
        rightLineNum: hasRight ? newLine++ : undefined,
        rightText: hasRight ? addedBuffer[i] : undefined,
        rightType: hasRight ? "add" : "empty",
      });
    }
    deletedBuffer = [];
    addedBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for hunk header @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(
      /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/,
    );
    if (hunkMatch) {
      flushBuffers();
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      inHunk = true;
      rows.push({
        type: "hunk",
        content: line,
      });
      continue;
    }

    if (!inHunk) {
      // Diff metadata headers (diff --git, index, ---, +++)
      continue;
    }

    if (line.startsWith("-")) {
      deletions++;
      deletedBuffer.push(line.slice(1));
    } else if (line.startsWith("+")) {
      additions++;
      addedBuffer.push(line.slice(1));
    } else if (line.startsWith(" ") || line === "") {
      flushBuffers();
      const content = line.startsWith(" ") ? line.slice(1) : line;
      rows.push({
        type: "diff",
        leftLineNum: oldLine++,
        leftText: content,
        leftType: "normal",
        rightLineNum: newLine++,
        rightText: content,
        rightType: "normal",
      });
    }
  }

  flushBuffers();

  return { rows, additions, deletions };
}

interface SideBySideDiffViewerProps {
  filePath: string;
  diff: string;
  status?: string;
}

export default function SideBySideDiffViewer({
  filePath,
  diff,
  status = "M",
}: SideBySideDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"split" | "inline">("split");
  const [wordWrap, setWordWrap] = useState(true);

  const { rows, additions, deletions } = useMemo(
    () => parseUnifiedDiff(diff),
    [diff],
  );

  const fileName = filePath.replace(/\\/g, "/").split("/").pop() || filePath;

  if (
    !diff ||
    diff === "[No textual diff available]" ||
    diff === "[Binary file omitted]"
  ) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center text-white/40">
        <FileDiff size={40} className="mb-3 opacity-30" />
        <p className="text-sm font-medium text-white/70">{fileName}</p>
        <p className="mt-1 text-xs text-white/35">
          {diff || "No textual changes recorded in this revision."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#14120e] text-[var(--text-primary)]">
      {/* Subheader: Side-by-side headers and view switcher */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#11100d] px-3">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="font-mono text-white/80 shrink-0">{fileName}</span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40 font-mono truncate max-w-[200px]">
            {filePath}
          </span>
          <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 font-mono shrink-0">
            {status}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
            {additions > 0 && (
              <span className="text-emerald-400">+{additions}</span>
            )}
            {deletions > 0 && (
              <span className="text-red-400">-{deletions}</span>
            )}
          </div>
        </div>

        {/* View mode toggle & Word wrap toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
              wordWrap
                ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)]"
                : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white"
            }`}
            title="Word Wrap (Qatorlarni avtomatik pastga o'rash)"
          >
            <WrapText size={12} /> Wrap
          </button>

          <div className="flex items-center gap-1 rounded bg-black/40 p-0.5 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                viewMode === "split"
                  ? "bg-[var(--accent)] text-[#1b120e]"
                  : "text-white/40 hover:text-white"
              }`}
              title="Yonma-yon (Side-by-side)"
            >
              <Columns size={12} /> Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("inline")}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                viewMode === "inline"
                  ? "bg-[var(--accent)] text-[#1b120e]"
                  : "text-white/40 hover:text-white"
              }`}
              title="Qatorma-qator (Inline)"
            >
              <AlignJustify size={12} /> Inline
            </button>
          </div>
        </div>
      </div>

      {/* Column Titles in Split mode */}
      {viewMode === "split" && (
        <div className="grid grid-cols-2 border-b border-white/[0.06] bg-[#0d0c0a] text-[11px] font-mono select-none">
          <div className="flex items-center justify-between border-r border-white/[0.08] px-3 py-1 text-white/45">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" />
              Original (HEAD / Old)
            </span>
            <span className="text-[10px] text-white/25">Read-only</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1 text-white/45">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              Working Tree (Modified / New)
            </span>
            <span className="text-[10px] text-white/25">Current file</span>
          </div>
        </div>
      )}

      {/* Main Diff Content */}
      <div className="min-h-0 flex-1 overflow-auto select-text font-mono text-[11.5px] leading-5">
        {viewMode === "split" ? (
          /* Split View */
          <div className="min-w-full">
            {rows.map((row, idx) => {
              if (row.type === "hunk") {
                return (
                  <div
                    key={`hunk-${idx}`}
                    className="sticky top-0 z-10 flex items-center gap-2 border-y border-white/[0.08] bg-[#182030]/90 backdrop-blur-sm px-4 py-0.5 text-[10.5px] text-blue-300/80 font-mono select-none"
                  >
                    <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[9px] font-bold">
                      Hunk
                    </span>
                    <span>{row.content}</span>
                  </div>
                );
              }

              const isLeftDelete = row.leftType === "delete";
              const isRightAdd = row.rightType === "add";

              const leftBg = isLeftDelete
                ? "bg-red-500/15 text-red-200"
                : row.leftType === "empty"
                  ? "bg-black/20 text-transparent"
                  : "text-white/60";

              const rightBg = isRightAdd
                ? "bg-emerald-500/15 text-emerald-200"
                : row.rightType === "empty"
                  ? "bg-black/20 text-transparent"
                  : "text-white/60";

              return (
                <div
                  key={`diff-${idx}`}
                  className="grid grid-cols-2 border-b border-white/[0.02] hover:bg-white/[0.02]"
                >
                  {/* Left Column (Original) */}
                  <div
                    className={`flex items-start border-r border-white/[0.08] min-w-0 ${leftBg}`}
                  >
                    <span className="w-11 shrink-0 select-none pr-2.5 text-right text-[10px] text-white/25 border-r border-white/[0.04] pt-0.5">
                      {row.leftLineNum ?? ""}
                    </span>
                    <span className="w-4 shrink-0 select-none text-center font-bold text-red-400 pt-0.5">
                      {isLeftDelete ? "-" : ""}
                    </span>
                    <pre
                      className={`flex-1 min-w-0 pr-2 py-0 text-[11.5px] font-mono leading-5 ${
                        wordWrap
                          ? "whitespace-pre-wrap break-words break-all"
                          : "whitespace-pre overflow-x-auto"
                      }`}
                    >
                      {row.leftText ?? ""}
                    </pre>
                  </div>

                  {/* Right Column (Modified) */}
                  <div className={`flex items-start min-w-0 ${rightBg}`}>
                    <span className="w-11 shrink-0 select-none pr-2.5 text-right text-[10px] text-white/25 border-r border-white/[0.04] pt-0.5">
                      {row.rightLineNum ?? ""}
                    </span>
                    <span className="w-4 shrink-0 select-none text-center font-bold text-emerald-400 pt-0.5">
                      {isRightAdd ? "+" : ""}
                    </span>
                    <pre
                      className={`flex-1 min-w-0 pr-2 py-0 text-[11.5px] font-mono leading-5 ${
                        wordWrap
                          ? "whitespace-pre-wrap break-words break-all"
                          : "whitespace-pre overflow-x-auto"
                      }`}
                    >
                      {row.rightText ?? ""}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Inline View */
          <div className="min-w-full">
            {diff.split("\n").map((line, i) => {
              let cls =
                "px-4 py-0 flex items-start border-b border-white/[0.02]";
              let indicator = " ";
              if (line.startsWith("@@")) {
                return (
                  <div
                    key={`inline-hunk-${i}`}
                    className="sticky top-0 z-10 border-y border-white/[0.08] bg-[#182030]/90 backdrop-blur-sm px-4 py-0.5 text-[10.5px] text-blue-300/80 font-mono select-none"
                  >
                    {line}
                  </div>
                );
              }
              if (line.startsWith("+")) {
                cls += " bg-emerald-500/15 text-emerald-200";
                indicator = "+";
              } else if (line.startsWith("-")) {
                cls += " bg-red-500/15 text-red-200";
                indicator = "-";
              } else if (line.startsWith("---") || line.startsWith("+++")) {
                cls += " text-white/35";
              } else {
                cls += " text-white/60";
              }
              return (
                <div key={`inline-line-${i}`} className={cls}>
                  <span className="w-4 shrink-0 select-none font-bold text-center pt-0.5">
                    {indicator}
                  </span>
                  <pre
                    className={`flex-1 min-w-0 pr-2 text-[11.5px] font-mono leading-5 ${
                      wordWrap
                        ? "whitespace-pre-wrap break-words break-all"
                        : "whitespace-pre overflow-x-auto"
                    }`}
                  >
                    {line.slice(1) || " "}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
