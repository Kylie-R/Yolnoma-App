import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  Binary,
  Braces,
  Code2,
  FileText,
  Globe2,
  Hash,
  Link2,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Terminal,
  Regex,
} from "lucide-react";
import ToolNavigation from "@/shared/ui/ToolNavigation";
import { useHashTab } from "@/shared/hooks/useHashTab";
import JsonFormatterTool from "../components/JsonFormatterTool";
import JwtDecoderTool from "../components/JwtDecoderTool";
import UuidGeneratorTool from "../components/UuidGeneratorTool";
import MarkdownStudioTool from "../components/MarkdownStudioTool";
import QrGeneratorTool from "../components/QrGeneratorTool";
import Base64Tool from "../components/Base64Tool";
import CurlConverterTool from "../components/CurlConverterTool";
import RegexVisualizerTool from "../components/RegexVisualizerTool";
import LoremIpsumTool from "../components/LoremIpsumTool";
import IpLookupTool from "../components/IpLookupTool";
import BcryptTool from "../components/BcryptTool";
import DiffCheckerTool from "../components/DiffCheckerTool";
import UrlEncoderTool from "../components/UrlEncoderTool";

type Tab =
  | "json-formatter"
  | "jwt-decoder"
  | "uuid-generator"
  | "markdown-studio"
  | "qr-generator"
  | "base64"
  | "curl-converter"
  | "regex-visualizer"
  | "lorem-ipsum"
  | "ip-lookup"
  | "bcrypt"
  | "diff-checker"
  | "url-encoder";
type TabDefinition = [Tab, string, LucideIcon];

export default function DeveloperToolsPage() {
  const { t } = useTranslation();
  const tabs: TabDefinition[] = [
    ["json-formatter", t("developerTools.json"), Braces],
    ["jwt-decoder", t("developerTools.jwt"), ShieldCheck],
    ["uuid-generator", t("developerTools.uuid"), Hash],
    ["markdown-studio", t("developerTools.markdown"), Code2],
    ["base64", t("developerTools.base64"), Binary],
    ["qr-generator", t("developerTools.qr"), QrCode],
    ["curl-converter", t("developerTools.curl"), Terminal],
    ["regex-visualizer", t("developerTools.regex"), Regex],
    ["lorem-ipsum", t("developerTools.lorem"), FileText],
    ["ip-lookup", t("developerTools.ip"), Globe2],
    ["bcrypt", t("developerTools.bcrypt"), LockKeyhole],
    ["diff-checker", t("developerTools.diff"), ArrowLeftRight],
    ["url-encoder", t("developerTools.url"), Link2],
  ];
  const [tab, selectTab] = useHashTab(
    tabs.map(([id]) => id),
    "json-formatter",
    "#/tools/developer-tools",
  );

  return (
    <div className="mx-auto min-h-full max-w-7xl pb-16 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("developerTools.eyebrow")}
        </p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              {t("developerTools.title")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              {t("developerTools.desc")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <span className="h-2 w-2 bg-emerald-400" />{" "}
            {t("developerTools.local")}
          </div>
        </div>
      </header>

      <div className="mt-8">
        <ToolNavigation items={tabs} active={tab} onChange={selectTab} />
        <main className="mt-8 min-w-0">
          {tab === "json-formatter" && <JsonFormatterTool />}
          {tab === "jwt-decoder" && <JwtDecoderTool />}
          {tab === "uuid-generator" && <UuidGeneratorTool />}
          {tab === "markdown-studio" && <MarkdownStudioTool />}
          {tab === "base64" && <Base64Tool />}
          {tab === "qr-generator" && <QrGeneratorTool />}
          {tab === "curl-converter" && <CurlConverterTool />}
          {tab === "regex-visualizer" && <RegexVisualizerTool />}
          {tab === "lorem-ipsum" && <LoremIpsumTool />}
          {tab === "ip-lookup" && <IpLookupTool />}
          {tab === "bcrypt" && <BcryptTool />}
          {tab === "diff-checker" && <DiffCheckerTool />}
          {tab === "url-encoder" && <UrlEncoderTool />}
        </main>
      </div>
    </div>
  );
}
