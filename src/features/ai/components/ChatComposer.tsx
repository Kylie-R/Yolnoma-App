import type { FormEvent, RefObject } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { Button } from "@/shared/ui";
import type { VisionImage } from "../vision";
import { useTranslation } from "react-i18next";

interface ChatComposerProps {
  prompt: string;
  loading: boolean;
  promptInputRef: RefObject<HTMLTextAreaElement | null>;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  image: VisionImage | null;
  imageLoading: boolean;
  onAttachImage: () => void;
  onRemoveImage: () => void;
}

export default function ChatComposer({
  prompt,
  loading,
  promptInputRef,
  onPromptChange,
  onSubmit,
  image,
  imageLoading,
  onAttachImage,
  onRemoveImage,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 192)}px`;
  };

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-white/[0.07] bg-black/10 p-3"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 transition-colors focus-within:border-[var(--accent-border)]">
        {image && (
          <div className="relative mb-2 flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-1.5">
            <img
              src={image.dataUrl}
              alt={image.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <span className="max-w-40 truncate px-1 text-[11px] text-white/60">
              {image.name}
            </span>
            <button
              type="button"
              onClick={onRemoveImage}
              disabled={loading}
              aria-label={t("ai.removeImage")}
              className="rounded-md p-1 text-white/45 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          ref={promptInputRef}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onInput={(event) => resize(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.ctrlKey && !event.shiftKey) {
              event.preventDefault();
              void onSubmit(event);
            }
          }}
          title={t("ai.sendHint")}
          placeholder={t("ai.writeMessage")}
          className="form-textarea max-h-48 min-h-[46px] w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2 shadow-none focus:border-0 focus:bg-transparent"
          rows={1}
          disabled={loading}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onAttachImage}
            disabled={loading || imageLoading}
            aria-label={t("ai.attachImage")}
            title={t("ai.attachFormats")}
            className="rounded-lg p-2 text-white/45 transition-colors hover:bg-white/[0.08] hover:text-[var(--accent)] disabled:opacity-40"
          >
            {imageLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ImagePlus size={17} />
            )}
          </button>
          <Button
            type="submit"
            size="lg"
            loading={loading}
            aria-label={t("ai.send")}
            className="mt-2 w-full justify-center"
          >
            <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white">
              <Send size={16} /> Send
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
