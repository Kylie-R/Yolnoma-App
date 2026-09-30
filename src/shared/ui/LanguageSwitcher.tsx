import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useAccountConfigStore } from "@/shared/stores/accountConfigStore";
import {
  getSupportedLanguages,
  i18n,
  setAppLanguage,
  type AppLanguage,
} from "@/shared/i18n";

const languages = getSupportedLanguages();

export default function LanguageSwitcher() {
  const { t } = useTranslation("common");
  const { config, loading, updateConfig } = useAccountConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    (i18n.language as AppLanguage) ?? config.language ?? "en";

  const currentLangObj =
    languages.find((lang) => lang.code === currentLanguage) ?? languages[0];

  const handleSelect = (language: AppLanguage) => {
    setAppLanguage(language);
    void updateConfig({ language });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("pointerdown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loading}
        aria-label={t("navbar.language")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-all ${
          isOpen
            ? "border-[#D97757]/50 bg-white/[0.08] text-white shadow-sm ring-1 ring-[#D97757]/30"
            : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Globe
          size={13}
          className={`shrink-0 transition-colors ${
            isOpen
              ? "text-[#D97757]"
              : "text-white/40 group-hover:text-[#D97757]"
          }`}
        />
        <span className="font-normal">{currentLangObj.nativeLabel}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-white/40 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#D97757]" : "group-hover:text-white/70"
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t("navbar.language")}
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] rounded-xl border border-white/10 bg-[#181410]/95 p-1 shadow-2xl shadow-black/80 backdrop-blur-2xl"
        >
          {languages.map((language) => {
            const isSelected = language.code === currentLanguage;
            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(language.code as AppLanguage)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#D97757]/15 text-[#D97757]"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span>{language.nativeLabel}</span>
                {isSelected && (
                  <Check size={13} className="shrink-0 text-[#D97757]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
