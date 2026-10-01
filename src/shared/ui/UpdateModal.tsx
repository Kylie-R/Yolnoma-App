import { ArrowRight, Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdaterStore } from "@/shared/stores/updaterStore";
import Button from "./Button";

export default function UpdateModal() {
  const { t } = useTranslation();
  const {
    status,
    updateInfo,
    error,
    modalOpen,
    closeModal,
    downloadAndInstall,
  } = useUpdaterStore();

  if (!modalOpen || !updateInfo) return null;

  const hasError = status === "error";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-available-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#181410]/95 p-7 text-[#F2EDE6] shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D97757] to-transparent" />
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label={t("updater.dialogClose")}
        >
          <X size={17} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D97757]/30 bg-[#D97757]/15 text-[#f3b39c]">
          <Download size={20} />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f3b39c]">
          {t("updater.label")}
        </p>
        <h1
          id="update-available-title"
          className="mt-2 text-2xl font-semibold tracking-tight"
        >
          {t("updater.newVersion")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {t("updater.description")}
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm">
          <span className="font-mono text-white/55">
            v{updateInfo.currentVersion}
          </span>
          <ArrowRight size={14} className="text-[#D97757]" />
          <span className="rounded-full border border-[#D97757]/30 bg-[#D97757]/10 px-2.5 py-1 font-mono font-semibold text-[#f3b39c]">
            v{updateInfo.version}
          </span>
        </div>

        {hasError && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-5 text-red-200">
            {error}
          </p>
        )}

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={closeModal}>
            Later
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={downloadAndInstall}
            className="gap-2"
          >
            <Download size={14} />
            {hasError ? t("updater.retry") : t("updater.now")}
          </Button>
        </div>
      </div>
    </div>
  );
}
