import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { useUpdaterStore } from "@/shared/stores/updaterStore";
import Button from "./Button";

export default function FullscreenUpdater() {
  const {
    status,
    progress,
    error,
    fullscreenOpen,
    closeFullscreen,
    downloadAndInstall,
  } = useUpdaterStore();

  if (!fullscreenOpen) return null;

  const isBusy = [
    "preparing",
    "downloading",
    "installing",
    "complete",
  ].includes(status);
  const isError = status === "error";
  const isComplete = status === "complete";
  const progressWidth =
    isComplete || status === "installing" ? 100 : Math.max(2, progress);

  return (
    <div
      className="updater-screen fixed inset-0 z-[110] flex min-h-screen items-center justify-center overflow-hidden bg-[#090a0f] px-6 py-10 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Yolnoma updater"
    >
      <div className="updater-grid pointer-events-none absolute inset-0" />
      <div className="updater-orb updater-orb-one pointer-events-none absolute left-[12%] top-[8%]" />
      <div className="updater-orb updater-orb-two pointer-events-none absolute bottom-[8%] right-[12%]" />
      <div
        className="updater-lines pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        {!isBusy && (
          <button
            type="button"
            onClick={closeFullscreen}
            className="absolute right-0 top-0 rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Close updater"
          >
            <X size={18} />
          </button>
        )}

        <div className={`updater-mark ${isBusy ? "updater-mark-active" : ""}`}>
          {isComplete ? (
            <Check size={32} />
          ) : isError ? (
            <AlertCircle size={32} />
          ) : (
            <Loader2 size={32} className="animate-spin" />
          )}
        </div>
        <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#f3b39c]">
          Yolnoma
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-7xl">
          Yolnoma Updating
        </h1>

        <div className="mt-14 w-full max-w-xl">
          <div className="updater-progress-track" aria-label="Update progress">
            <div
              className="updater-progress-value"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          {isError && (
            <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-left text-sm leading-6 text-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-300"
                />
                <span>{error ?? "The update could not be installed."}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={downloadAndInstall}
                >
                  Retry update
                </Button>
                <Button variant="ghost" size="sm" onClick={closeFullscreen}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
