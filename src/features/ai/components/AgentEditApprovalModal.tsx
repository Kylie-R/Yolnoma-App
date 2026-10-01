import { Check, XCircle } from "lucide-react";
import type { ToolCall } from "../types";
import { useTranslation } from "react-i18next";

export type PendingEdit = {
  call: ToolCall;
  path: string;
  content: string;
};

interface AgentEditApprovalModalProps {
  pendingEdit: PendingEdit | null;
  onApprove: (allow: boolean) => void;
}

export default function AgentEditApprovalModal({
  pendingEdit,
  onApprove,
}: AgentEditApprovalModalProps) {
  const { t } = useTranslation();
  if (!pendingEdit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#181410] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
              Agent edit approval
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-white">
              Write {pendingEdit.path}?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onApprove(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>
        <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-5 text-white/55">
          {pendingEdit.content}
        </pre>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={() => onApprove(false)}
            className="rounded border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => onApprove(true)}
            className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#1b120e] hover:bg-[#e08a6b] transition-colors"
          >
            <Check size={12} /> {t("ai.approveSave")}
          </button>
        </div>
      </div>
    </div>
  );
}
