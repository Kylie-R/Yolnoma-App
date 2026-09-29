import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Loader2,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Button, Toggle } from "@/shared/ui";

type StartupApp = {
  id: string;
  name: string;
  command: string;
  location: string;
  kind: "registry" | "folder";
  enabled: boolean;
  requiresAdmin: boolean;
};

const iconColors = [
  "from-[#e65d65] to-[#b52b56]",
  "from-[#41b9cf] to-[#2872c7]",
  "from-[#f2aa4b] to-[#d85a39]",
  "from-[#9c78e9] to-[#5750b5]",
  "from-[#51b98f] to-[#32765f]",
];

function locationLabel(app: StartupApp) {
  if (app.kind === "folder") return app.location;
  return app.location.startsWith("HKLM") ? "All users" : "Current user";
}

function iconLetter(name: string) {
  return (
    name
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 1)
      .toUpperCase() || "A"
  );
}

function iconColor(name: string) {
  const sum = [...name].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return iconColors[sum % iconColors.length];
}

function commandLabel(command: string) {
  return command.length > 110 ? `${command.slice(0, 107)}…` : command;
}

function StartupAppIcon({ name }: { name: string }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconColor(name)} text-lg font-bold text-white shadow-lg shadow-black/20`}
      aria-hidden="true"
    >
      {iconLetter(name)}
    </div>
  );
}

export default function StartUpAppsPage() {
  const [apps, setApps] = useState<StartupApp[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setApps(await invoke<StartupApp[]>("list_startup_apps"));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : String(loadError),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return apps;
    return apps.filter((app) =>
      [app.name, app.command, app.location].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [apps, query]);

  const enabledCount = apps.filter((app) => app.enabled).length;

  const changeState = async (app: StartupApp, enabled: boolean) => {
    setChangingId(app.id);
    setError("");
    setApps((current) =>
      current.map((item) => (item.id === app.id ? { ...item, enabled } : item)),
    );
    try {
      await invoke("set_startup_app_enabled", { id: app.id, enabled });
    } catch (changeError) {
      setApps((current) =>
        current.map((item) =>
          item.id === app.id ? { ...item, enabled: app.enabled } : item,
        ),
      );
      setError(
        changeError instanceof Error
          ? changeError.message
          : String(changeError),
      );
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--main-color)">
            Windows utility
          </p>
          <h1 className="font-serif text-3xl text-white">Startup Apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Choose which apps start with Windows. Changes apply to Registry Run
            entries and Startup folders.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void loadApps()}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </Button>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-3 text-sm text-red-100">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden select-none">
        <div className="flex flex-col gap-4  px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Startup apps</h2>
            <p className="mt-1 text-xs text-white/40">
              {apps.length} detected · {enabledCount} enabled
            </p>
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2 sm:w-72">
            <Search size={15} className="shrink-0 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search apps"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-20 text-sm text-white/40">
            <Loader2 size={17} className="animate-spin" /> Reading Windows
            startup entries…
          </div>
        ) : !filteredApps.length ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <FolderOpen size={28} className="mb-3 text-white/25" />
            <p className="text-sm text-white/55">
              {apps.length
                ? "No matching startup apps"
                : "No startup apps detected"}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Try refreshing or changing your search.
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group flex min-h-[82px] flex-col gap-3 rounded-lg border border-transparent bg-[#272929] px-5 py-4 transition-colors hover:border-white/[0.08] hover:bg-[#2b2d2d] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <StartupAppIcon name={app.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-medium text-white">
                        {app.name}
                      </h3>
                      {app.requiresAdmin && (
                        <span title="Changing this entry may require administrator permission">
                          <ShieldAlert
                            size={14}
                            className="shrink-0 text-amber-300/65"
                          />
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 truncate text-xs text-white/55"
                      title={app.command}
                    >
                      {locationLabel(app)}{" "}
                      <span className="px-1 text-white/25">|</span>{" "}
                      {commandLabel(app.command)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-3 pl-[60px] sm:pl-4">
                  <span
                    className={`w-8 text-right text-sm font-medium ${app.enabled ? "text-white" : "text-white/80"}`}
                  >
                    {app.enabled ? "On" : "Off"}
                  </span>
                  <Toggle
                    checked={app.enabled}
                    disabled={changingId === app.id}
                    onChange={(enabled) => void changeState(app, enabled)}
                    label=""
                  />
                  <button
                    type="button"
                    title="Startup entry details"
                    aria-label={`Details for ${app.name}`}
                    className="rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    {app.kind === "folder" ? (
                      <ExternalLink size={17} />
                    ) : (
                      <ChevronRight size={19} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs leading-5 text-white/30">
        <Power size={13} /> System-wide entries may require administrator
        permission to change.
      </div>
    </div>
  );
}
