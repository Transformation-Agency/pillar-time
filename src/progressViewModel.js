export function generationProgressViewModel(runState = {}, { slowStep = false, labels = {} } = {}) {
  const status = runState?.status || "running";
  const steps = runState?.steps?.length ? runState.steps : [{ key: "run", name: "Generating brief" }];
  const activeIndex = steps.findIndex((step) => step.status === "active");
  const doneCount = steps.filter((step) => step.status === "done").length;
  const fallbackIndex = status === "done" ? steps.length - 1 : runState?.stepIndex ?? doneCount;
  const currentIndex = Math.max(0, Math.min(steps.length - 1, activeIndex >= 0 ? activeIndex : fallbackIndex));
  const current = steps[currentIndex] || steps[0] || { key: "run", name: "Generating brief" };
  const progress = status === "done" ? 100 : Math.round(((currentIndex + 0.35) / steps.length) * 100);
  const fallbackLabel = labels[current.key] || current.name || "working";
  const runningDetail = current.output || String(fallbackLabel).toLowerCase();
  const runningSentence = `${runningDetail}${/[.!?…]$/.test(runningDetail) ? "" : "."}`;
  const message = status === "error"
    ? runState?.error || "Something went wrong while generating the brief."
    : status === "done"
      ? "The new brief was saved and sent to Telegram."
      : `Step ${currentIndex + 1} of ${steps.length}: ${runningSentence}`;

  return {
    status,
    steps,
    current,
    currentIndex,
    progress,
    badgeTone: status === "error" ? "warn" : status === "done" ? "ok" : "muted",
    badgeLabel: status === "error" ? "Needs attention" : status === "done" ? "Delivered" : "Generating",
    title: status === "error" ? "Brief generation stopped." : status === "done" ? "Brief delivered." : current.name,
    message,
    detail: status === "running" ? current.detail || "" : "",
    progressClassName: slowStep ? "main-progress working" : "main-progress",
    stepClasses: steps.map((step) => (
      step.status === "done" || status === "done"
        ? "done"
        : step.status === "active" && status !== "error"
          ? "active"
          : step.status === "error"
            ? "error"
            : ""
    )),
  };
}
