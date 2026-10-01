import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Copy, FileDiff, RotateCcw } from "lucide-react";
import { ToolCard, ToolTitle } from "./ToolShell";
import { SideBySideDiffViewer } from "@/shared/ui";
import { createUnifiedDiff } from "@/shared/lib/diff";

const LEFT_INITIAL = `const greeting = 'Hello';
console.log(greeting);

function add(a, b) {
  return a + b;
}`;

const RIGHT_INITIAL = `const greeting = 'Welcome';
console.log(greeting);

function add(a, b) {
  return Number(a) + Number(b);
}

export default add;`;

export default function DiffCheckerTool() {
  const { t } = useTranslation();
  const [left, setLeft] = useState(LEFT_INITIAL);
  const [right, setRight] = useState(RIGHT_INITIAL);

  const diff = useMemo(
    () => createUnifiedDiff(left, right, "diff-check"),
    [left, right],
  );

  const reset = () => {
    setLeft(LEFT_INITIAL);
    setRight(RIGHT_INITIAL);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <ToolCard>
      <ToolTitle
        icon={FileDiff}
        text={t("developerTools.diff")}
        subtitle={t("developerTools.diffDesc")}
      />

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <span className="text-xs text-white/40">
          Paste original text on the left and updated text on the right:
        </span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1 text-xs text-white/50 hover:border-white/20 hover:text-white transition-colors"
        >
          <RotateCcw size={13} />
          {t("developerTools.reset")}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="diff-left"
              className="text-[11px] font-semibold uppercase tracking-wider text-white/40"
            >
              {t("developerTools.originalText")}
            </label>
            <button
              type="button"
              onClick={() => void copy(left)}
              className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
            >
              <Copy size={12} />
              {t("developerTools.copy")}
            </button>
          </div>
          <textarea
            id="diff-left"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#0d0d0a] p-3 font-mono text-xs leading-5 text-white/70 outline-none focus:border-[var(--accent-border)]"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="diff-right"
              className="text-[11px] font-semibold uppercase tracking-wider text-white/40"
            >
              {t("developerTools.updatedText")}
            </label>
            <button
              type="button"
              onClick={() => void copy(right)}
              className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
            >
              <Copy size={12} />
              {t("developerTools.copy")}
            </button>
          </div>
          <textarea
            id="diff-right"
            value={right}
            onChange={(event) => setRight(event.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#0d0d0a] p-3 font-mono text-xs leading-5 text-white/70 outline-none focus:border-[var(--accent-border)]"
          />
        </div>
      </div>

      {/* Visual Diff View using shared SideBySideDiffViewer */}
      <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-[#14120e]">
        <div className="h-[420px]">
          <SideBySideDiffViewer filePath="snippet.txt" diff={diff} status="M" />
        </div>
      </div>
    </ToolCard>
  );
}
