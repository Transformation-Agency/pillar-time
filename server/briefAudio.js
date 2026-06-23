import path from "node:path";

export function briefAudioTextFromArtifact(artifact = {}, renderFallback = () => "") {
  const text = String(artifact.onePageBrief || renderFallback(artifact) || "")
    .replace(/^#\s+/gm, "")
    .replace(/^Generated:.*$/gm, "")
    .replace(/^##\s+/gm, "\n")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 9000);
}

export function storedBriefAudio(artifact = {}) {
  const audio = artifact?.audio || {};
  return audio.url && audio.fileName ? audio : null;
}

export function briefAudioGenerationPlan(workflowRun, renderFallback = () => "") {
  if (!workflowRun) return { status: "not-found", error: "Workflow run not found" };
  const cachedAudio = storedBriefAudio(workflowRun.artifact);
  if (cachedAudio) return { status: "cached", audio: cachedAudio };
  return {
    status: "generate",
    text: briefAudioTextFromArtifact(workflowRun.artifact, renderFallback),
    filenamePrefix: `brief-${workflowRun.id}`,
  };
}

export function briefAudioArtifact(artifact = {}, audio = {}) {
  return { ...(artifact || {}), audio };
}

export function briefAudioFilePath({ audioDir = "", fileName = "", exists = () => false, pathApi = path } = {}) {
  const safeName = pathApi.basename(String(fileName || ""));
  if (!safeName.endsWith(".mp3")) return null;
  const filePath = pathApi.join(audioDir, safeName);
  return exists(filePath) ? { fileName: safeName, filePath } : null;
}
