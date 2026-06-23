const busyStatuses = new Set(["checking", "checking-silent", "installing"]);

function errorMessage(error) {
  return error?.message || "Update check failed.";
}

export function desktopUpdateCheckingState(current = {}, { silent = false } = {}) {
  return {
    ...current,
    isDesktop: true,
    status: silent ? "checking-silent" : "checking",
    message: silent ? current.message || "" : "Checking for updates...",
    progress: "",
  };
}

export function desktopUpdateResultState(current = {}, { version = "", update = null } = {}) {
  return {
    ...current,
    isDesktop: true,
    version,
    status: update ? "available" : "current",
    update,
    message: update ? `Version ${update.version} is ready to install.` : "Pillar Time is up to date.",
    progress: "",
  };
}

export function desktopUpdateCheckErrorState(current = {}, error, { silent = false } = {}) {
  return {
    ...current,
    isDesktop: true,
    status: silent ? "idle" : "error",
    message: silent ? current.message || "" : errorMessage(error),
    progress: "",
  };
}

export function desktopUpdateInstallStartState(current = {}) {
  return {
    ...current,
    status: "installing",
    message: `Downloading version ${current.update?.version || "update"}...`,
    progress: "",
  };
}

export function desktopUpdateInstalledState(current = {}) {
  return {
    ...current,
    status: "installed",
    message: "Update installed. Restart Pillar Time to finish.",
    progress: "",
  };
}

export function desktopUpdateInstallErrorState(current = {}, error) {
  return {
    ...current,
    status: "error",
    message: errorMessage(error),
    progress: "",
  };
}

export function desktopUpdateDownloadProgress(event, downloaded = 0) {
  if (event?.event === "Started") {
    const totalMb = event.data?.contentLength ? Math.round(event.data.contentLength / 1024 / 1024) : 0;
    return {
      downloaded: 0,
      progress: totalMb ? `0 of ${totalMb} MB` : "Download started",
    };
  }
  if (event?.event === "Progress") {
    const nextDownloaded = downloaded + (event.data?.chunkLength || 0);
    return {
      downloaded: nextDownloaded,
      progress: `${Math.max(1, Math.round(nextDownloaded / 1024 / 1024))} MB downloaded`,
    };
  }
  if (event?.event === "Finished") {
    return {
      downloaded,
      progress: "Download complete",
    };
  }
  return { downloaded, progress: "" };
}

export function desktopUpdateIsBusy(updateState = {}) {
  return busyStatuses.has(updateState.status);
}

export function desktopUpdateBannerVisible(updateState = {}) {
  return !!updateState.isDesktop && ["available", "installed"].includes(updateState.status);
}

export function desktopUpdateStatusText(updateState = {}) {
  if (updateState.status === "available") {
    return updateState.update?.version ? `Update v${updateState.update.version} available` : "Update available";
  }
  if (updateState.status === "installed") return "Restart to finish updating";
  if (updateState.status === "current") return "Pillar Time is up to date";
  if (updateState.status === "error") return "Update check failed";
  return "Check for signed desktop updates";
}

export function desktopUpdateHelpMessage(updateState = {}) {
  if (!updateState.isDesktop) return "Updates are available in the desktop app.";
  return updateState.progress || updateState.message || desktopUpdateStatusText(updateState);
}

export function desktopUpdateStatusIcon(updateState = {}) {
  if (updateState.status === "available") return "download";
  if (updateState.status === "installed") return "restart";
  if (updateState.status === "error") return "x";
  return "check";
}

export function desktopUpdateSettingsTone(updateState = {}) {
  if (updateState.status === "current" || updateState.status === "installed") return "ok";
  if (updateState.status === "error") return "warn";
  return "muted";
}

export function desktopUpdateSettingsLabel(updateState = {}) {
  if (updateState.status === "available") return "Update available";
  if (updateState.status === "installing") return "Installing";
  if (updateState.status === "installed") return "Restart required";
  if (updateState.status === "current") return "Up to date";
  return "Desktop only";
}

export function desktopUpdateSettingsNoticeTitle(updateState = {}) {
  if (updateState.status === "available") return "A signed update is ready";
  if (updateState.status === "installed") return "Restart to finish updating";
  return "Automatic update checks are enabled";
}
