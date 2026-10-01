import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Blocks,
  Clock3,
  Command,
  Database,
  FileText,
  GitBranch,
  History,
  Keyboard,
  ListTree,
  PanelLeftClose,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wrench,
  X,
  Bot,
} from "lucide-react";
import { ROUTE_CONFIG } from "@/app/routes.config";
import { openAgentWindow } from "@/shared/lib/window";
import type { LucideIcon } from "lucide-react";

export type CommandItem = {
  id: string;
  label: string;
  description: string;
  path?: string;
  group:
    | "Actions"
    | "Git workspace"
    | "Developer workspace"
    | "Tools"
    | "Workspace"
    | "Home";
  icon: LucideIcon;
  keywords: string;
  action?: () => void;
};

const ACTION_ITEMS: CommandItem[] = [
  {
    id: "action-keyboard-shortcuts",
    label: "Keyboard Shortcuts Cheat-Sheet",
    description: "View all keyboard shortcuts and hotkeys reference (Ctrl + /)",
    group: "Actions",
    icon: Keyboard,
    keywords: "keyboard shortcuts hotkeys keys cheat sheet help commands",
    action: () => {
      window.dispatchEvent(new CustomEvent("yolnoma:open-shortcuts"));
    },
  },
  {
    id: "action-toggle-sidebar",
    label: "Toggle Sidebar Collapse",
    description: "Collapse or expand the navigation sidebar (Ctrl + B)",
    group: "Actions",
    icon: PanelLeftClose,
    keywords: "sidebar panel menu toggle collapse expand hide show",
    action: () => {
      window.dispatchEvent(new CustomEvent("yolnoma:toggle-sidebar"));
    },
  },
  {
    id: "action-open-dropzone",
    label: "Global File Dropzone",
    description: "Drop or select files to open in dedicated tools",
    group: "Actions",
    icon: UploadCloud,
    keywords: "dropzone upload file drop import media convert",
    action: () => {
      window.dispatchEvent(new CustomEvent("yolnoma:open-dropzone"));
    },
  },
  {
    id: "action-agent-window",
    label: "Yolnoma AI Agent (Window)",
    description: "Launch AI assistant in a dedicated standalone window",
    group: "Actions",
    icon: Bot,
    keywords: "agent ai chatbot window popup assistant helper",
    action: () => {
      openAgentWindow().catch(console.error);
    },
  },
  {
    id: "action-reload",
    label: "Reload / Refresh Page",
    description: "Refresh the application window (Ctrl + R / F5)",
    group: "Actions",
    icon: RotateCw,
    keywords: "reload refresh restart update page",
    action: () => {
      window.location.reload();
    },
  },
];

const WORKSPACE_ITEMS: CommandItem[] = [
  // {
  //   id: "dns-records-lookup",
  //   label: "DNS Records · DNS Lookup",
  //   description: "Inspect DNS records, resolvers, and DNS security details",
  //   path: "/tools/dns-records?tab=dns-lookup",
  //   group: "Workspace",
  //   icon: Network,
  //   keywords: "dns records lookup resolver doh nameserver network",
  // },
  {
    id: "dns-records-subdomains",
    label: "DNS Records · Subdomain Finder",
    description:
      "Discover active subdomains and visualize domain relationships",
    path: "/tools/dns-records?tab=subdomains",
    group: "Workspace",
    icon: ListTree,
    keywords: "dns subdomain finder discover domain topology relationships",
  },
  {
    id: "dns-records-security-audit",
    label: "DNS Records · SSL Score & Headers",
    description: "Inspect SSL health and HTTP security response headers",
    path: "/tools/dns-records?tab=security-audit",
    group: "Workspace",
    icon: ShieldCheck,
    keywords: "dns ssl tls certificate https headers security audit score",
  },
  {
    id: "git-commit-generator",
    label: "Git · Commit Generator",
    description: "Generate a best-practice commit message from changes",
    path: "/tools/git?tab=commit-generator",
    group: "Git workspace",
    icon: GitBranch,
    keywords: "git commit message changes generate commit gen",
  },
  {
    id: "git-history",
    label: "Git · History Graph",
    description: "Explore branches and commit history",
    path: "/tools/git?tab=history-graph",
    group: "Git workspace",
    icon: History,
    keywords: "git history graph branches commits timeline log",
  },
  {
    id: "developer-tools",
    label: "Developer Tools · Workspace",
    description: "Open JSON, JWT, Markdown, QR, Regex and more",
    path: "/tools/developer-tools",
    group: "Developer workspace",
    icon: Wrench,
    keywords:
      "developer dev tools workspace json jwt markdown uuid base64 regex qr curl",
  },
  {
    id: "ai-tools",
    label: "AI Tools · Workspace",
    description: "Open AI-powered project workspaces",
    path: "/tools/ai-tools",
    group: "Developer workspace",
    icon: Sparkles,
    keywords: "ai tools workspace project readme image code",
  },
  {
    id: "ai-database-generator",
    label: "AI Tools · Database Generator",
    description:
      "Open the AI database schema and relationship diagram workspace",
    path: "/tools/ai-tools?tab=database-gen",
    group: "Developer workspace",
    icon: Database,
    keywords:
      "ai tools database generator schema sql tables relationships er diagram",
  },
  {
    id: "ai-readme-generator",
    label: "AI Tools · README Generator",
    description: "Open the AI project README writing workspace",
    path: "/tools/ai-tools?tab=readme-generator",
    group: "Developer workspace",
    icon: FileText,
    keywords:
      "ai tools readme read me documentation project docs markdown generator",
  },
];

const ROUTE_ITEMS: CommandItem[] = ROUTE_CONFIG.filter(
  (route) =>
    route.label &&
    route.path !== "/tools/git" &&
    route.path !== "/tools/developer-tools" &&
    route.path !== "/tools/ai-tools",
).map((route) => ({
  id: route.id,
  label: route.label ?? route.id,
  description: route.description ?? `${route.label} workspace`,
  path: route.path,
  group: (route.navGroup === "tools"
    ? "Tools"
    : route.navGroup === "workspace"
      ? "Workspace"
      : "Home") as CommandItem["group"],
  icon: typeof route.icon === "function" ? route.icon : Blocks,
  keywords: `${route.id} ${route.label ?? ""} ${route.description ?? ""}`,
}));

const COMMAND_ITEMS: CommandItem[] = [
  ...ACTION_ITEMS,
  ...WORKSPACE_ITEMS,
  ...ROUTE_ITEMS,
];
const COMMAND_TRANSLATIONS: Record<string, [string, string]> = {
  "action-keyboard-shortcuts": [
    "commandCenter.itemShortcuts",
    "commandCenter.itemShortcutsDesc",
  ],
  "action-toggle-sidebar": [
    "commandCenter.itemSidebar",
    "commandCenter.itemSidebarDesc",
  ],
  "action-open-dropzone": [
    "commandCenter.itemDropzone",
    "commandCenter.itemDropzoneDesc",
  ],
  "action-agent-window": [
    "commandCenter.itemAgent",
    "commandCenter.itemAgentDesc",
  ],
  "action-reload": ["commandCenter.itemReload", "commandCenter.itemReloadDesc"],
  "dns-records-subdomains": [
    "commandCenter.itemSubdomains",
    "commandCenter.itemSubdomainsDesc",
  ],
  "dns-records-security-audit": [
    "commandCenter.itemSecurity",
    "commandCenter.itemSecurityDesc",
  ],
  "git-commit-generator": [
    "commandCenter.itemCommit",
    "commandCenter.itemCommitDesc",
  ],
  "git-history": ["commandCenter.itemHistory", "commandCenter.itemHistoryDesc"],
  "developer-tools": [
    "commandCenter.itemDeveloper",
    "commandCenter.itemDeveloperDesc",
  ],
  "ai-tools": ["commandCenter.itemAi", "commandCenter.itemAiDesc"],
  "ai-database-generator": [
    "commandCenter.itemDatabase",
    "commandCenter.itemDatabaseDesc",
  ],
  "ai-readme-generator": [
    "commandCenter.itemReadme",
    "commandCenter.itemReadmeDesc",
  ],
};
const RECENT_COMMANDS_KEY = "yolnoma_command_center_recent";
const MAX_RECENT_COMMANDS = 8;

function goTo(path: string) {
  window.location.hash = `#${path}`;
}

function readRecentIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberCommand(id: string) {
  const next = [id, ...readRecentIds().filter((item) => item !== id)].slice(
    0,
    MAX_RECENT_COMMANDS,
  );
  localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(next));
}

export default function CommandCenter() {
  const { t } = useTranslation();
  const commandItems = useMemo(
    () =>
      COMMAND_ITEMS.map((item) => {
        const keys = COMMAND_TRANSLATIONS[item.id];
        return keys
          ? {
              ...item,
              label: t(keys[0], { defaultValue: item.label }),
              description: t(keys[1], { defaultValue: item.description }),
            }
          : item;
      }),
    [t],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(readRecentIds);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      const recent = recentIds
        .map((id) => commandItems.find((item) => item.id === id))
        .filter((item): item is CommandItem => Boolean(item));
      const recentSet = new Set(recent.map((item) => item.id));
      return [
        ...recent,
        ...commandItems.filter((item) => !recentSet.has(item.id)),
      ];
    }
    return commandItems
      .map((item) => {
        const isLabelMatch = item.label.toLowerCase().includes(normalized);
        const isKeywordMatch = item.keywords.toLowerCase().includes(normalized);
        const startsWith = item.label.toLowerCase().startsWith(normalized);
        let score = 0;
        if (startsWith) score = 3;
        else if (isLabelMatch) score = 2;
        else if (isKeywordMatch) score = 1;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .map(({ item }) => item);
  }, [commandItems, query, recentIds]);

  const openCommand = (item: CommandItem) => {
    rememberCommand(item.id);
    setRecentIds(readRecentIds());
    setOpen(false);

    if (item.action) {
      item.action();
    } else if (item.path) {
      goTo(item.path);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          Math.min(index + 1, Math.max(results.length - 1, 0)),
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        openCommand(results[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, open, results]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <section
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/[0.12] bg-[#18130f] shadow-2xl shadow-black/50 flex flex-col"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("commandCenter.aria")}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <Search size={19} className="shrink-0 text-[var(--accent)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("commandCenter.placeholder")}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30"
            aria-label={t("commandCenter.search", {
              defaultValue: "Search commands",
            })}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-white/35 transition hover:bg-white/[0.07] hover:text-white"
            aria-label={t("commandCenter.close")}
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
          <span>
            {query.trim()
              ? t("commandCenter.results", { count: results.length })
              : t("commandCenter.quick")}
          </span>
          <span className="flex items-center gap-1 normal-case tracking-normal text-white/25">
            <Command size={11} /> {t("commandCenter.toggle")}
          </span>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2 custom-scrollbar">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-white/35">
              {t("commandCenter.none")}
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              const isAction = item.group === "Actions";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openCommand(item)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    index === activeIndex
                      ? "bg-[var(--accent-dim)] text-white"
                      : "text-white/70 hover:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                      index === activeIndex
                        ? "border-[var(--accent-border)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : isAction
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-white/[0.08] bg-white/[0.03] text-white/40"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium flex items-center gap-2">
                      {item.label}
                      {isAction && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase tracking-wide">
                          {t("commandCenter.action")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/35">
                      {item.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/25">
                    <span className="hidden sm:inline">
                      {!query.trim() && recentIds.includes(item.id) ? (
                        <Clock3 size={12} />
                      ) : (
                        t(`commandCenter.${item.group}`)
                      )}
                    </span>
                    <ArrowRight
                      size={14}
                      className={
                        index === activeIndex
                          ? "text-[var(--accent)]"
                          : "opacity-0 transition group-hover:opacity-100"
                      }
                    />
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-2.5 text-[10px] text-white/30 bg-black/20">
          <div className="flex items-center gap-4">
            <span>{t("commandCenter.navigate")}</span>
            <span>{t("commandCenter.select")}</span>
            <span>{t("commandCenter.esc")}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("yolnoma:open-shortcuts"));
            }}
            className="flex items-center gap-1.5 text-white/40 hover:text-[var(--accent)] transition-colors"
          >
            <Keyboard size={12} />
            <span>{t("commandCenter.shortcuts")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export { COMMAND_ITEMS };
