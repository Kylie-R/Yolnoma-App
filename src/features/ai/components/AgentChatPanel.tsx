import { useRef, useEffect } from "react";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import type { OpenRouterModel } from "../types";
import { getShortModelName } from "../api/openRouterApi";
import { useTranslation } from "react-i18next";

interface AgentChatPanelProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  activity: string[];
  prompt: string;
  agentLoading: boolean;
  apiKey: string;
  draftKey: string;
  modelList: string[];
  modelNames: OpenRouterModel[];
  currentModelIdx: number;
  onDraftKeyChange: (val: string) => void;
  onSaveKey: () => void;
  onModelChange: (idx: number) => void;
  onPromptChange: (val: string) => void;
  onSendPrompt: () => void;
}

export default function AgentChatPanel({
  messages,
  activity,
  prompt,
  agentLoading,
  apiKey,
  draftKey,
  modelList,
  modelNames,
  currentModelIdx,
  onDraftKeyChange,
  onSaveKey,
  onModelChange,
  onPromptChange,
  onSendPrompt,
}: AgentChatPanelProps) {
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity]);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-white/[0.08] bg-[#11100d]">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/[0.07] px-3">
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          <Sparkles size={11} className="text-[var(--accent)]" /> Agent
        </span>
      </div>

      {/* API key + model selector */}
      <div className="shrink-0 border-b border-white/[0.07] p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-white/25">
            OpenRouter
          </span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${apiKey ? "bg-emerald-400" : "bg-amber-300"}`}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={draftKey}
            onChange={(e) => onDraftKeyChange(e.target.value)}
            placeholder={t("ai.apiKey")}
            className="min-w-0 flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[var(--accent-border)]"
          />
          <button
            type="button"
            onClick={onSaveKey}
            className="rounded border border-white/10 px-2 text-[11px] text-white/50 hover:text-white transition-colors"
          >
            Save
          </button>
        </div>
        <select
          value={modelList[currentModelIdx] ?? ""}
          onChange={(e) => {
            const idx = modelList.indexOf(e.target.value);
            if (idx !== -1) onModelChange(idx);
          }}
          className="mt-2 w-full rounded border border-white/10 bg-[#181410] px-2 py-1.5 text-[11px] text-white outline-none"
        >
          {modelNames.map((m) => (
            <option key={m.id} value={m.id}>
              {getShortModelName(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="mt-6 text-center">
            <MessageSquare
              className="mx-auto mb-3 text-[var(--accent)]/40"
              size={20}
            />
            <p className="text-xs text-white/50">{t("ai.askAgent")}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-white/25">
              Reads files · searches codebase · writes edits
              <br />
              Auto-switches model on token limit
              <br />
              "UPGRADE README.md" → only reads README
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className="border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs leading-relaxed text-white/60"
              >
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  {msg.role === "user" ? "You" : "Agent"}
                </span>
                <pre className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </pre>
              </div>
            ))}
          </div>
        )}
        {activity.slice(0, 4).map((item, i) => (
          <p key={`${item}-${i}`} className="mt-1.5 text-[10px] text-white/20">
            {item}
          </p>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Prompt input */}
      <div className="shrink-0 border-t border-white/[0.08] p-2.5">
        <div className="rounded border border-white/10 bg-white/[0.03] focus-within:border-[var(--accent-border)]">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSendPrompt();
              }
            }}
            placeholder={t("ai.askProject")}
            rows={3}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-[11px] leading-relaxed text-white outline-none placeholder:text-white/20"
          />
          <div className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2">
            <span className="text-[10px] text-white/20">
              {agentLoading ? "Working…" : "Enter to send"}
            </span>
            <button
              type="button"
              onClick={onSendPrompt}
              disabled={agentLoading || !prompt.trim()}
              className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-[#1b120e] disabled:opacity-30 transition-opacity"
            >
              {agentLoading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Send size={11} />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
