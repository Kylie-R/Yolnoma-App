import { useTranslation } from "react-i18next";
import { useAccountConfigStore } from "@/shared/stores/accountConfigStore";
import SelectMenu from "@/shared/ui/SelectMenu";
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
    <div
      className="inline-flex items-center gap-1.5"
      title={t("navbar.language")}
    >
      {/* <Globe size={13} className="text-[#D97757]" aria-hidden="true" /> */}
      <SelectMenu
        value={currentLanguage}
        onChange={(value) => handleChange(value as AppLanguage)}
        disabled={loading}
        ariaLabel={t("navbar.language")}
        options={languages.map((language) => ({
          value: language.code,
          label: language.nativeLabel,
        }))}
        className="min-w-[104px]"
      />
    </div>
  );
}
