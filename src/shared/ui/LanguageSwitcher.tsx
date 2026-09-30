import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
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
  const currentLanguage =
    (i18n.language as AppLanguage) ?? config.language ?? "en";

  const handleChange = (language: AppLanguage) => {
    setAppLanguage(language);
    void updateConfig({ language });
  };

  return (
    <label
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-white/60 transition-colors hover:border-white/15 hover:text-white"
      title={t("navbar.language")}
    >
      <Globe size={13} className="text-[#D97757]" aria-hidden="true" />
      <span className="sr-only">{t("navbar.language")}</span>
      <select
        value={currentLanguage}
        onChange={(event) => handleChange(event.target.value as AppLanguage)}
        disabled={loading}
        aria-label={t("navbar.language")}
        className="cursor-pointer appearance-none bg-transparent text-[11px] font-medium outline-none disabled:cursor-wait disabled:opacity-50"
      >
        {languages.map((language) => (
          <option
            key={language.code}
            value={language.code}
            className="bg-[#181410] text-white"
          >
            {language.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
