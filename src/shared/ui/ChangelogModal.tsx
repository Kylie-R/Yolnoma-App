import { Check, X } from "lucide-react";
import { useUpdaterStore } from "@/shared/stores/updaterStore";
import Button from "./Button";

const CATEGORY_LABELS = [
  "Added",
  "Improved",
  "Fixed",
  "Changed",
  "Removed",
] as const;

export default function ChangelogModal() {
  const { changelogOpen, changelogEntry, closeChangelog } = useUpdaterStore();
  if (!changelogOpen || !changelogEntry) return null;

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-title"
    >
      <div className="relative flex max-h-[min(760px,calc(100vh-3rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#181410]/98 text-[#F2EDE6] shadow-2xl shadow-black/60">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D97757] to-transparent" />
        <div className="flex items-start justify-between border-b border-white/[0.08] px-7 py-6 sm:px-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f3b39c]">
              What’s new
            </p>
            <h1
              id="changelog-title"
              className="mt-2 text-3xl font-semibold tracking-tight"
            >
              Yolnoma v{changelogEntry.version}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Released {changelogEntry.date}
            </p>
          </div>
          <button
            type="button"
            onClick={closeChangelog}
            className="rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Close changelog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto px-7 py-7 sm:px-9">
          <div className="grid gap-6 sm:grid-cols-2">
            {CATEGORY_LABELS.map((category) => {
              const notes = changelogEntry.categories[category];
              if (!notes?.length) return null;
              return (
                <section key={category}>
                  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3b39c]">
                    <Check size={14} /> {category}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {notes.map((note) => (
                      <li
                        key={note}
                        className="text-sm leading-6 text-white/70"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-white/[0.08] px-7 py-5 sm:px-9">
          <Button variant="primary" size="sm" onClick={closeChangelog}>
            Continue to Yolnoma
          </Button>
        </div>
      </div>
    </div>
  );
}
