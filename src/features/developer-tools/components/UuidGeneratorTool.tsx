import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Hash, WandSparkles } from "lucide-react";
import { ToolCard, ToolTitle } from "./ToolShell";

export default function UuidGeneratorTool() {
  const { t } = useTranslation();
  const [uuid, setUuid] = useState(() => crypto.randomUUID());
  const generate = async () => {
    const next = crypto.randomUUID();
    setUuid(next);
    await navigator.clipboard.writeText(next);
  };

  return (
    <ToolCard>
      <ToolTitle
        icon={Hash}
        text={t("developerTools.uuid")}
        subtitle={t("developerTools.uuidDesc")}
      />
      <div className="flex min-h-72 flex-col items-center justify-center gap-7 border border-white/[0.06] bg-black/10 p-8">
        <p className="break-all text-center font-mono text-2xl tracking-wide text-white md:text-3xl">
          {uuid}
        </p>
        <button
          type="button"
          onClick={() => void generate()}
          className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#17130e] transition hover:brightness-110"
        >
          <WandSparkles size={16} />
          {t("developerTools.generateCopy")}
        </button>
      </div>
    </ToolCard>
  );
}
