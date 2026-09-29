import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ToggleRight,
  Power,
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

function locationLabel(app: StartupApp) {
  if (app.kind === "folder") return app.location;
  return app.location.startsWith("HKLM")
    ? "All users · Registry"
    : "Current user · Registry";
}

function commandLabel(command: string) {
  return command.length > 100 ? `${command.slice(0, 97)}…` : command;
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
  const disabledCount = apps.length - enabledCount;

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
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Windows utility
          </p>
          <h1 className="font-serif text-3xl text-white">Startup Apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Control programs that launch automatically when Windows starts.
            Changes are reversible and apply to Registry Run entries and Startup
            folders.
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

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111109] p-4">
          <div className="mb-3 flex items-center gap-2 text-white/40">
            <ToggleRight size={16} /> Detected entries
          </div>
          <p className="text-2xl font-semibold text-white">{apps.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-emerald-200/60">
            <Power size={16} /> Enabled
          </div>
          <p className="text-2xl font-semibold text-emerald-100">
            {enabledCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-200/60">
            <ShieldAlert size={16} /> Disabled
          </div>
          <p className="text-2xl font-semibold text-amber-100">
            {disabledCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111109]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              All startup entries
            </h2>
            <p className="mt-1 text-xs text-white/35">
              Use the toggle to enable or disable an entry.
            </p>
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-black/10 px-3 py-2 sm:w-72">
            <Search size={15} className="shrink-0 text-white/30" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search startup apps"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-white/40">
            <Loader2 size={17} className="animate-spin" /> Reading Windows
            startup entries…
          </div>
        ) : !filteredApps.length ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
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
          <div className="divide-y divide-white/[0.06]">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${app.enabled ? "bg-emerald-400" : "bg-white/25"}`}
                    />
                    <h3 className="truncate text-sm font-medium text-white">
                      {app.name}
                    </h3>
                    {app.requiresAdmin && (
                      <span title="Changing this entry may require administrator permission">
                        <ShieldAlert
                          size={13}
                          className="shrink-0 text-amber-300/60"
                        />
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 truncate pl-4 text-xs text-white/35"
                    title={app.command}
                  >
                    {commandLabel(app.command)}
                  </p>
                  <p className="mt-1 pl-4 text-[10px] uppercase tracking-wide text-white/25">
                    {locationLabel(app)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 pl-4 sm:pl-0">
                  <span
                    className={`text-xs ${app.enabled ? "text-emerald-200/60" : "text-white/35"}`}
                  >
                    {app.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Toggle
                    checked={app.enabled}
                    disabled={changingId === app.id}
                    onChange={(enabled) => void changeState(app, enabled)}
                    label=""
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-white/30">
        Startup entries are read from Windows Registry Run keys and the
        user/common Startup folders. System-wide entries may require
        administrator permission to change.
      </p>
    </div>
  );
}
