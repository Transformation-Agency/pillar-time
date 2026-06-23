import test from "node:test";
import assert from "node:assert/strict";

import {
  desktopUpdateBannerVisible,
  desktopUpdateCheckErrorState,
  desktopUpdateCheckingState,
  desktopUpdateDownloadProgress,
  desktopUpdateHelpMessage,
  desktopUpdateInstalledState,
  desktopUpdateInstallErrorState,
  desktopUpdateInstallStartState,
  desktopUpdateIsBusy,
  desktopUpdateResultState,
  desktopUpdateSettingsLabel,
  desktopUpdateSettingsNoticeTitle,
  desktopUpdateSettingsTone,
  desktopUpdateStatusIcon,
  desktopUpdateStatusText,
} from "../src/desktopUpdates.js";

test("desktop update startup check preserves existing message when silent", () => {
  assert.deepEqual(desktopUpdateCheckingState({
    isDesktop: true,
    status: "current",
    message: "Pillar Time is up to date.",
    progress: "old progress",
  }, { silent: true }), {
    isDesktop: true,
    status: "checking-silent",
    message: "Pillar Time is up to date.",
    progress: "",
  });

  assert.deepEqual(desktopUpdateCheckingState({}, { silent: false }), {
    isDesktop: true,
    status: "checking",
    message: "Checking for updates...",
    progress: "",
  });
});

test("desktop update result states describe current and available releases", () => {
  const update = { version: "0.1.4", currentVersion: "0.1.3" };
  assert.deepEqual(desktopUpdateResultState({ status: "checking" }, { version: "0.1.3", update }), {
    isDesktop: true,
    version: "0.1.3",
    status: "available",
    update,
    message: "Version 0.1.4 is ready to install.",
    progress: "",
  });

  assert.deepEqual(desktopUpdateResultState({ update }, { version: "0.1.3", update: null }), {
    isDesktop: true,
    version: "0.1.3",
    status: "current",
    update: null,
    message: "Pillar Time is up to date.",
    progress: "",
  });
});

test("desktop update errors keep silent startup checks unobtrusive", () => {
  assert.deepEqual(desktopUpdateCheckErrorState({
    isDesktop: true,
    status: "checking-silent",
    message: "Last known update status",
  }, new Error("network unavailable"), { silent: true }), {
    isDesktop: true,
    status: "idle",
    message: "Last known update status",
    progress: "",
  });

  assert.deepEqual(desktopUpdateCheckErrorState({}, new Error("signature rejected")), {
    isDesktop: true,
    status: "error",
    message: "signature rejected",
    progress: "",
  });
});

test("desktop update install states and progress stay deterministic", () => {
  const updateState = { isDesktop: true, update: { version: "0.1.4" }, status: "available" };
  assert.deepEqual(desktopUpdateInstallStartState(updateState), {
    isDesktop: true,
    update: { version: "0.1.4" },
    status: "installing",
    message: "Downloading version 0.1.4...",
    progress: "",
  });

  assert.deepEqual(desktopUpdateDownloadProgress({ event: "Started", data: { contentLength: 5 * 1024 * 1024 } }, 10), {
    downloaded: 0,
    progress: "0 of 5 MB",
  });
  assert.deepEqual(desktopUpdateDownloadProgress({ event: "Progress", data: { chunkLength: 512 * 1024 } }, 0), {
    downloaded: 512 * 1024,
    progress: "1 MB downloaded",
  });
  assert.deepEqual(desktopUpdateDownloadProgress({ event: "Finished" }, 512 * 1024), {
    downloaded: 512 * 1024,
    progress: "Download complete",
  });

  assert.equal(desktopUpdateInstalledState(updateState).message, "Update installed. Restart Pillar Time to finish.");
  assert.deepEqual(desktopUpdateInstallErrorState(updateState, new Error("download failed")), {
    isDesktop: true,
    update: { version: "0.1.4" },
    status: "error",
    message: "download failed",
    progress: "",
  });
});

test("desktop update view helpers cover Help banner and Settings controls", () => {
  const available = { isDesktop: true, status: "available", update: { version: "0.1.4" }, message: "Version 0.1.4 is ready to install." };
  assert.equal(desktopUpdateBannerVisible(available), true);
  assert.equal(desktopUpdateIsBusy({ status: "checking-silent" }), true);
  assert.equal(desktopUpdateStatusText(available), "Update v0.1.4 available");
  assert.equal(desktopUpdateHelpMessage(available), "Version 0.1.4 is ready to install.");
  assert.equal(desktopUpdateStatusIcon(available), "download");
  assert.equal(desktopUpdateSettingsTone(available), "muted");
  assert.equal(desktopUpdateSettingsLabel(available), "Update available");
  assert.equal(desktopUpdateSettingsNoticeTitle(available), "A signed update is ready");

  const installed = { isDesktop: true, status: "installed", progress: "Download complete" };
  assert.equal(desktopUpdateBannerVisible(installed), true);
  assert.equal(desktopUpdateHelpMessage(installed), "Download complete");
  assert.equal(desktopUpdateStatusIcon(installed), "restart");
  assert.equal(desktopUpdateSettingsTone(installed), "ok");
  assert.equal(desktopUpdateSettingsLabel(installed), "Restart required");
  assert.equal(desktopUpdateSettingsNoticeTitle(installed), "Restart to finish updating");

  assert.equal(desktopUpdateBannerVisible({ isDesktop: false, status: "available" }), false);
  assert.equal(desktopUpdateHelpMessage({ isDesktop: false }), "Updates are available in the desktop app.");
  assert.equal(desktopUpdateStatusIcon({ status: "error" }), "x");
  assert.equal(desktopUpdateSettingsTone({ status: "error" }), "warn");
});
