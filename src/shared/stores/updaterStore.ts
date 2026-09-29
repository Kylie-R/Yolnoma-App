/**
 * Global Tauri updater state and lifecycle.
 *
 * The updater engine remains Tauri's signed updater. This store only coordinates
 * the compact prompt, fullscreen progress view, and post-restart changelog.
 */

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage, reportError } from "@/shared/lib/errors";
import {
  getChangelogEntry,
  getLatestChangelogEntry,
  type ChangelogEntry,
} from "@/shared/lib/changelog";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "update-available"
  | "preparing"
  | "downloading"
  | "installing"
  | "complete"
  | "up-to-date"
  | "error";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

export type DevPreviewStage =
  | "update-available"
  | "preparing"
  | "downloading"
  | "installing"
  | "complete"
  | "error";

interface UpdatePreparation {
  stoppedIdlingGames: number;
  killedSteamUtilityProcesses: number;
}

interface UpdaterState {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  progress: number;
  downloadedBytes: number;
  totalBytes: number | null;
  error: string | null;
  modalOpen: boolean;
  fullscreenOpen: boolean;
  changelogOpen: boolean;
  changelogEntry: ChangelogEntry | null;
  lastChecked: Date | null;
  devPreview: boolean;

  checkForUpdates: (options?: { silent?: boolean }) => Promise<boolean>;
  checkForSuccessfulUpdate: () => Promise<boolean>;
  downloadAndInstall: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  closeFullscreen: () => void;
  closeChangelog: () => void;
  previewUpdate: () => void;
  previewUpdaterStage: (stage: DevPreviewStage) => void;
  previewChangelog: () => void;
  reset: () => void;
}

const FAILED_TARGET_KEY = "yolnoma.updater.failed-target";
const PENDING_SUCCESS_KEY = "yolnoma.updater.pending-success";
const SEEN_CHANGELOG_KEY = "yolnoma.updater.seen-changelog";

function getStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted test webviews.
  }
}

function removeStorageValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted test webviews.
  }
}

let activeUpdate: Update | null = null;
let isChecking = false;
let isInstalling = false;

const DEV_UPDATE_INFO: UpdateInfo = {
  version: "1.0.24-preview",
  currentVersion: "1.0.23",
  date: "2026-09-22",
  body: "Preview mode: test the updater experience without installing anything.",
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  status: "idle",
  updateInfo: null,
  progress: 0,
  downloadedBytes: 0,
  totalBytes: null,
  error: null,
  modalOpen: false,
  fullscreenOpen: false,
  changelogOpen: false,
  changelogEntry: null,
  lastChecked: null,
  devPreview: false,

  checkForUpdates: async (options = { silent: false }) => {
    const { silent } = options;
    if (import.meta.env.DEV) {
      activeUpdate = null;
      set({
        status: "up-to-date",
        updateInfo: null,
        error: null,
        lastChecked: new Date(),
      });
      if (!silent)
        toast.info("Updates are checked in the installed production build.");
      return false;
    }

    const currentStatus = get().status;
    if (
      isChecking ||
      isInstalling ||
      currentStatus === "checking" ||
      currentStatus === "preparing" ||
      currentStatus === "downloading" ||
      currentStatus === "installing" ||
      currentStatus === "complete"
    ) {
      return false;
    }

    isChecking = true;
    set({ status: "checking", error: null });

    let currentVersion: string;
    try {
      currentVersion = await getVersion();
    } catch (err: unknown) {
      reportError("AutoUpdater:GetVersion", err);
      const msg = getErrorMessage(
        err,
        "Could not determine current application version.",
      );
      set({ status: "error", error: msg });
      if (!silent) toast.error(msg);
      isChecking = false;
      return false;
    }

    if (!currentVersion || typeof currentVersion !== "string") {
      const msg = "Current application version is unavailable.";
      set({ status: "error", error: msg });
      if (!silent) toast.error(msg);
      isChecking = false;
      return false;
    }

    const failedTarget = getStorageValue(FAILED_TARGET_KEY);
    if (failedTarget && failedTarget === currentVersion)
      removeStorageValue(FAILED_TARGET_KEY);

    try {
      const update = await check();
      set({ lastChecked: new Date() });

      if (update && update.available) {
        const currentFailedTarget = getStorageValue(FAILED_TARGET_KEY);
        if (currentFailedTarget && update.version === currentFailedTarget) {
          activeUpdate = null;
          const skipMsg = `Update to v${update.version} previously failed. It will not be offered again until a newer version is released.`;
          set({ status: "error", error: skipMsg });
          if (!silent)
            toast.error(
              `Update v${update.version} failed on last attempt. Waiting for a newer release.`,
            );
          isChecking = false;
          return false;
        }

        activeUpdate = update;
        set({
          status: "update-available",
          updateInfo: {
            version: update.version,
            currentVersion,
            date: update.date,
            body: update.body,
          },
          modalOpen: true,
          fullscreenOpen: false,
          error: null,
        });
        isChecking = false;
        return true;
      }

      activeUpdate = null;
      set({ status: "up-to-date", updateInfo: null, error: null });
      if (!silent)
        toast.success(`You are on the latest version (v${currentVersion}).`);
      isChecking = false;
      return false;
    } catch (err: unknown) {
      reportError("AutoUpdater", err);
      const msg = getErrorMessage(err, "Could not check for updates.");
      set({ status: "error", error: msg });
      if (!silent) toast.error(msg);
      isChecking = false;
      return false;
    }
  },

  checkForSuccessfulUpdate: async () => {
    if (import.meta.env.DEV) return false;
    const pendingVersion = getStorageValue(PENDING_SUCCESS_KEY);
    if (!pendingVersion) return false;

    try {
      const currentVersion = await getVersion();
      if (currentVersion !== pendingVersion) return false;
      removeStorageValue(PENDING_SUCCESS_KEY);
      if (getStorageValue(SEEN_CHANGELOG_KEY) === currentVersion) return false;

      const entry = getChangelogEntry(currentVersion);
      if (!entry) {
        reportError(
          "AutoUpdater:Changelog",
          new Error(
            `Changelog entry for version ${currentVersion} is missing.`,
          ),
        );
        return false;
      }
      set({ changelogEntry: entry, changelogOpen: true });
      return true;
    } catch (err: unknown) {
      reportError("AutoUpdater:SuccessfulUpdate", err);
      return false;
    }
  },

  downloadAndInstall: async () => {
    const { status } = get();
    if (
      isInstalling ||
      status === "preparing" ||
      status === "downloading" ||
      status === "installing"
    )
      return;

    if (get().devPreview) {
      isInstalling = true;
      set({
        status: "preparing",
        progress: 0,
        error: null,
        modalOpen: false,
        fullscreenOpen: true,
      });
      await wait(900);
      set({ status: "downloading", progress: 8 });
      for (const progress of [22, 44, 67, 88, 100]) {
        await wait(280);
        set({ progress });
      }
      set({ status: "installing", progress: 100 });
      await wait(900);
      set({ status: "complete", progress: 100 });
      isInstalling = false;
      return;
    }

    if (!activeUpdate) {
      toast.error(
        "No update package is currently loaded. Please check for updates again.",
      );
      return;
    }

    isInstalling = true;
    set({
      status: "preparing",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: null,
      error: null,
      modalOpen: false,
      fullscreenOpen: true,
    });

    try {
      const preparation = await invoke<UpdatePreparation>("prepare_for_update");
      console.info("[AutoUpdater:Preparation]", preparation);

      setStorageValue(FAILED_TARGET_KEY, activeUpdate.version);
      set({ status: "downloading" });

      let downloaded = 0;
      let total: number | null = null;
      await activeUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? null;
            set({ totalBytes: total, progress: 0 });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            set({
              downloadedBytes: downloaded,
              totalBytes: total,
              progress:
                total && total > 0
                  ? Math.min(100, Math.round((downloaded / total) * 100))
                  : 0,
            });
            break;
          case "Finished":
            set({ status: "installing", progress: 100 });
            break;
        }
      });

      setStorageValue(PENDING_SUCCESS_KEY, activeUpdate.version);
      set({ status: "complete", progress: 100 });
      await wait(900);
      await relaunch();
    } catch (err: unknown) {
      reportError("AutoUpdater:Download", err);
      const msg = getErrorMessage(
        err,
        "Failed to prepare, download, or install the update.",
      );
      isInstalling = false;
      set({ status: "error", error: msg, fullscreenOpen: true });
      toast.error(msg);
    }
  },

  openModal: () => set({ modalOpen: true, fullscreenOpen: false }),
  closeModal: () => {
    const { status } = get();
    if (
      status === "preparing" ||
      status === "downloading" ||
      status === "installing" ||
      status === "complete"
    )
      return;
    set({ modalOpen: false });
  },
  closeFullscreen: () => {
    const { status } = get();
    if (
      status === "preparing" ||
      status === "downloading" ||
      status === "installing" ||
      status === "complete"
    )
      return;
    set({ fullscreenOpen: false, modalOpen: status === "error" });
  },
  closeChangelog: () => {
    const entry = get().changelogEntry;
    if (entry) setStorageValue(SEEN_CHANGELOG_KEY, entry.version);
    set({ changelogOpen: false });
  },

  previewUpdate: () => {
    if (!import.meta.env.DEV) return;
    activeUpdate = null;
    set({
      devPreview: true,
      status: "update-available",
      updateInfo: DEV_UPDATE_INFO,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 128 * 1024 * 1024,
      error: null,
      modalOpen: true,
      fullscreenOpen: false,
      changelogOpen: false,
    });
  },

  previewUpdaterStage: (stage) => {
    if (!import.meta.env.DEV) return;
    set({
      devPreview: true,
      status: stage,
      updateInfo: DEV_UPDATE_INFO,
      modalOpen: stage === "update-available",
      fullscreenOpen: stage !== "update-available",
      error:
        stage === "error"
          ? "Preview error: the signed package could not be applied. You can safely retry."
          : null,
      progress:
        stage === "downloading"
          ? 58
          : stage === "installing" || stage === "complete"
            ? 100
            : 0,
    });
  },

  previewChangelog: () => {
    if (!import.meta.env.DEV) return;
    const entry = getLatestChangelogEntry();
    if (entry) set({ changelogEntry: entry, changelogOpen: true });
  },

  reset: () => {
    activeUpdate = null;
    isChecking = false;
    isInstalling = false;
    set({
      status: "idle",
      updateInfo: null,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: null,
      error: null,
      modalOpen: false,
      fullscreenOpen: false,
      changelogOpen: false,
      changelogEntry: null,
      devPreview: false,
    });
  },
}));
