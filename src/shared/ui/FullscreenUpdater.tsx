import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, X } from "lucide-react";
import { useUpdaterStore } from "@/shared/stores/updaterStore";
import Button from "./Button";
import styles from "./FullscreenUpdater.module.css";

export default function FullscreenUpdater() {
  const { t } = useTranslation();
  const {
    status,
    progress,
    error,
    fullscreenOpen,
    closeFullscreen,
    downloadAndInstall,
  } = useUpdaterStore();

  useEffect(() => {
    if (!fullscreenOpen) return;

    // Blocking the context menu (right mouse button)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    // Block page reloading (Ctrl+R, Cmd+R, F5, Ctrl+F5, Ctrl+Shift+R)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isRefresh =
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"));

      if (isRefresh) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu, {
      capture: true,
    });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, {
        capture: true,
      });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [fullscreenOpen]);

  if (!fullscreenOpen) return null;

  const isBusy = [
    "preparing",
    "downloading",
    "installing",
    "complete",
  ].includes(status);
  const isError = status === "error";
  const isComplete = status === "complete";
  const progressWidth = isComplete || status === "installing" ? 100 : progress;

  return (
    <div
      className="updater-screen fixed inset-0 z-[110] flex min-h-screen items-center justify-center overflow-hidden bg-[#090a0f] px-6 py-10 text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("updater.aria")}
    >
      <div className={`${styles.grid} pointer-events-none absolute inset-0`} />
      <div
        className={`${styles.orb} ${styles.orbOne} pointer-events-none absolute left-[12%] top-[8%]`}
      />
      <div
        className={`${styles.orb} ${styles.orbTwo} pointer-events-none absolute bottom-[8%] right-[12%]`}
      />
      <div
        className={`${styles.lines} pointer-events-none absolute inset-0`}
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
            aria-label={t("updater.close")}
          >
            <X size={18} />
          </button>
        )}

        <h1 className="text-5xl font-serif font-semibold tracking-[-0.04em] sm:text-7xl transition-all duration-500 ease-in-out hover:scale-105">
          <span
            className="animate-bounce inline-block"
            style={{ color: "var(--main-color)" }}
          >
            Yol
          </span>
          noma <span className="animate-bounce inline-block">Up</span>dating
        </h1>

        <div className="mt-14 w-full max-w-xl">
          <div
            className={styles.progressTrack}
            aria-label={t("updater.progress")}
          >
            <div
              className={styles.progressValue}
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
                <span>{error ?? t("updater.error")}</span>
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
