import React from "react";
import { createRoot } from "react-dom/client";
import { desktopRuntime } from "./desktopRuntime.js";
import {
  BookOpen,
  Bot,
  Box,
  Calendar,
  Check,
  ChevronDown,
  CircleHelp,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  GripVertical,
  Home,
  LayoutTemplate,
  Mail,
  MessageCircle,
  Mic,
  Monitor,
  Pencil,
  Plus,
  PlayCircle,
  QrCode,
  Radio,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Volume2,
  X as XIcon,
} from "lucide-react";
import "./styles.css";

const nav = [
  ["Plan", [["today", "Today"], ["planner", "Planner"], ["reminders", "Reminders"], ["reviews", "Reviews"]]],
  ["Context", [["briefs", "Intelligence"], ["sources", "Sources"], ["documents", "Documents"], ["meetings", "Meetings"], ["linear", "Linear"], ["trustedContext", "Trusted Context"], ["approvals", "Approvals"]]],
  ["Configure", [["briefSetup", "Brief Setup"]]],
  ["System", [["settings", "Settings"]]],
];

const defaultOwnerName = "You";
const defaultOpenAiModel = "gpt-4.1";
const defaultGrokModel = "grok-4.3";
const defaultModelForProvider = (provider) => {
  if (provider === "openai") return defaultOpenAiModel;
  if (provider === "xai") return defaultGrokModel;
  return "";
};

const workflowLabels = {
  fetch: "fetch configured sources",
  normalize: "normalize/dedupe items",
  score: "score relevance/rising signal",
  retrieve: "retrieve saved documents/work product",
  select: "select top issues",
  summaries: "generate summaries",
  "why-care": "explain why it matters",
  implications: "generate future implications",
  impact: "generate doctrine/project impact",
  council: "run analyzers",
  synthesize: "synthesize analyzer output",
  pov: "draft POV",
  render: "render brief",
  save: "save artifact/run outputs",
  telegram: "deliver Telegram brief",
};

function briefDeliveryBadge(run) {
  const delivery = run?.artifact?.telegramDelivery || {};
  const error = String(delivery.error || delivery.warning || "");
  const telegramAmbiguous = !!delivery.pendingAck || /Telegram delivery timed out|Telegram delivery acknowledgement timed out/i.test(error);
  if (run?.status === "running") return { tone: "muted", label: "Generating..." };
  if (run?.status === "failed") return { tone: "err", label: "Failed" };
  if (delivery.ok) return { tone: "ok", label: "Delivered" };
  if (telegramAmbiguous) return { tone: "warn", label: "Check Telegram" };
  return { tone: "muted", label: "Saved" };
}

function briefCompletionCopy(runState) {
  const isExecutiveDay = runState?.runType === "executive_day";
  if (isExecutiveDay) return {
    badge: { tone: "ok", label: "Saved" },
    title: "Day plan saved.",
    body: "The executive day plan was saved in Pillar Time.",
  };
  const deliveryBadge = briefDeliveryBadge(runState);
  if (deliveryBadge.label === "Delivered") return {
    badge: deliveryBadge,
    title: "Brief delivered.",
    body: "The new brief was saved and delivered to Telegram.",
  };
  if (deliveryBadge.label === "Check Telegram") return {
    badge: deliveryBadge,
    title: "Brief saved. Check Telegram.",
    body: "The brief was saved, but Telegram acknowledgement was ambiguous. Check Telegram before sending it again.",
  };
  return {
    badge: deliveryBadge,
    title: "Brief saved.",
    body: "The new brief was saved in Pillar Time.",
  };
}

const sourceDefinitions = {
  Web: {
    credential: "No API key. Use for public pages; the fetch adapter should use readability/extraction.",
    modes: {
      page: { label: "Single page", fields: [["url", "URL", "https://example.com/report"]] },
      search: { label: "Site/topic search", fields: [["url", "Site URL", "https://example.com"], ["query", "Search/topic terms", "AI policy OR compute"]] },
    },
  },
  RSS: {
    credential: "No API key. Watches a feed URL and filters optional keywords.",
    modes: {
      feed: { label: "Feed URL", fields: [["feedUrl", "Feed URL", "https://site.com/feed.xml"], ["keywords", "Optional keywords", "compute, policy, AI"]] },
    },
  },
  Reddit: {
    credential: "No key is usually needed for public subreddit/user/page reads via public web or JSON-style collectors. Reddit OAuth is the more durable path for higher-volume, private, or policy-compliant API use.",
    modes: {
      subreddit: { label: "Public subreddit posts", fields: [["subreddits", "Subreddits", "geopolitics, MachineLearning"], ["sort", "Sort", "new | hot | top"], ["keywords", "Optional keywords", "AI chips OR China"]] },
      user: { label: "Public user posts/comments", fields: [["username", "Username", "spez"], ["include", "Include", "posts | comments | both"]] },
      search: { label: "Public Reddit search", fields: [["query", "Search query", "\"frontier model\" OR compute"], ["scope", "Scope", "all Reddit or subreddit list"], ["sort", "Sort", "relevance | new | top"]] },
    },
  },
  X: {
    credential: "Official X API access requires a token. X sources always run in locked quick mode: max 10 posts, no replies, no retweets, and a 1-hour cache to avoid burning credits.",
    modes: {
      search: { label: "Quick recent search", fields: [["query", "Search query", "(AI OR compute) lang:en"]] },
    },
  },
  YouTube: {
    credential: "No key is needed for channel RSS/public page watching. The YouTube Data API key is useful for official search, richer metadata, playlist details, and quota-managed reliability.",
    modes: {
      channel: { label: "Channel RSS/public uploads", fields: [["channel", "Channel ID or handle", "@lexfridman"], ["keywords", "Optional keywords", "AI, geopolitics"]] },
      playlist: { label: "Public playlist / API playlist", fields: [["playlistId", "Playlist ID", "PL..."]] },
      search: { label: "YouTube keyword search", fields: [["query", "Search query", "AI infrastructure"], ["order", "Order", "date | relevance | viewCount"]] },
    },
  },
  Podcast: {
    credential: "No API key for standard podcast RSS. Spotify links are resolved to the show's public RSS feed when possible; transcription uses local Whisper STT when available or an OpenAI-compatible fallback.",
    modes: {
      feed: { label: "Podcast RSS", fields: [["feedUrl", "RSS feed URL", "https://podcast.com/feed.xml"], ["keywords", "Optional episode keywords", "AI, strategy"]] },
      spotify: { label: "Spotify link → RSS", fields: [["spotifyUrl", "Spotify episode/show URL", "https://open.spotify.com/episode/..."], ["feedUrl", "Resolved RSS feed", "Click Resolve RSS"], ["keywords", "Optional episode keywords", "AI, strategy"]] },
    },
  },
  Calendar: {
    credential: "Requires Google Calendar OAuth. Pillar Time reads today's agenda and can create approved schedule blocks after you reconnect with calendar write scope.",
    modes: {
      google: { label: "Selected Google calendars", fields: [] },
    },
  },
  Newsletter: {
    credential: "Usually RSS/archive URL based. Private inbox newsletters need a separate email integration, not a generic locator.",
    modes: {
      feed: { label: "RSS/archive", fields: [["feedUrl", "Feed or archive URL", "https://newsletter.com/feed"], ["keywords", "Optional keywords", "markets, compute"]] },
      archive: { label: "Public archive page", fields: [["url", "Archive URL", "https://newsletter.com/archive"], ["keywords", "Optional keywords", "China, AI"]] },
    },
  },
  TikTok: {
    credential: "Official TikTok research/content APIs are gated. Public/browser collection may work for visible accounts/search pages, but expect fragility, login walls, and rate limiting.",
    modes: {
      research_search: { label: "Public/API keyword search", fields: [["query", "Search query", "AI regulation"], ["region", "Region", "US | EU"]] },
      account: { label: "Public account watch", fields: [["username", "Username", "@creator"]] },
    },
  },
};

function defaultConfig(type) {
  const mode = Object.keys(sourceDefinitions[type].modes)[0];
  return { mode };
}

function sourceLocator(type, config) {
  const mode = config.mode;
  if (type === "Calendar") return config.calendarId === "primary" ? "primary" : "selected";
  if (type === "Reddit") {
    if (mode === "subreddit") return `subreddits:${config.subreddits || ""}`;
    if (mode === "user") return `u/${config.username || ""}`;
    return `search:${config.query || ""}`;
  }
  if (type === "X") return mode === "search" ? `search:${config.query || ""}` : config.handle || "";
  if (type === "YouTube") return config.channel || config.playlistId || `search:${config.query || ""}`;
  if (type === "Podcast" && mode === "spotify") return config.feedUrl || config.spotifyUrl || "";
  return config.feedUrl || config.url || config.query || config.username || "";
}

function sourcePrerequisites(source, state) {
  const notes = [];
  if (source.type === "Calendar" && state.connectors?.googleCalendar?.status !== "ready") {
    notes.push({
      key: "googleCalendar",
      blocking: true,
      label: "Needs Google Calendar",
      body: "Connect Google Calendar before this source can fetch today's agenda.",
    });
  }
  if (source.type === "X" && state.connectors?.x?.status !== "ready") {
    notes.push({
      key: "x",
      blocking: true,
      label: "Needs X API token",
      body: "Set up an X developer Bearer Token before this source can fetch posts.",
    });
  }
  if (source.type === "Podcast" && source.config?.transcribeNewEpisodes !== false) {
    if (state.runtime?.ffmpeg?.available === false) {
      notes.push({
        key: "ffmpeg",
        blocking: true,
        label: "Needs FFmpeg",
        body: "Install FFmpeg before long podcast audio can be split and converted for transcription.",
      });
    }
    const localSttReady = state.runtime?.stt?.available;
    const transcriptionModelReady = localSttReady || (["openai", "custom"].includes(state.model?.provider) && state.model?.status === "ready");
    if (!transcriptionModelReady) {
      notes.push({
        key: "transcriptionModel",
        blocking: true,
        label: "Needs speech-to-text",
        body: "Podcast transcription needs local Whisper STT or an OpenAI-compatible transcription endpoint.",
      });
    }
  }
  return notes;
}

function sourceReadyForOnboarding(source, state) {
  return sourcePrerequisites(source, state).every((note) => !note.blocking);
}

function encodeMonoWav(chunks, sampleRate) {
  const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const pcm = new Int16Array(totalSamples);
  let offset = 0;
  chunks.forEach((chunk) => {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]));
      pcm[offset + i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    offset += chunk.length;
  });
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const writeString = (position, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(position + i, value.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i += 1) view.setInt16(44 + i * 2, pcm[i], true);
  return new Blob([buffer], { type: "audio/wav" });
}

function sourcePrerequisiteKeys(source, state) {
  return [...new Set(sourcePrerequisites(source, state).filter((note) => note.blocking).map((note) => note.key))];
}

function safeDecodeText(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function searchParamFromUrl(value, param) {
  try {
    return new URL(value).searchParams.get(param) || "";
  } catch {
    return "";
  }
}

function displaySearchText(value) {
  return safeDecodeText(String(value || "").replace(/^search:/i, "")).replace(/\s+/g, " ").trim();
}

function displayXSearchText(value) {
  const raw = searchParamFromUrl(value, "q") || String(value || "").replace(/^search:/i, "");
  return displaySearchText(raw)
    .replace(/\b-is:(retweet|reply|quote)\b/gi, "")
    .replace(/\bmin_(faves|retweets|replies):\d+\b/gi, "")
    .replace(/\blang:[a-z-]+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceDisplayLocator(source) {
  const config = source.config || {};
  if (source.type === "X") {
    return displayXSearchText(config.query || source.locator) || "Quick X search";
  }
  if (source.type === "Reddit") {
    if (config.subreddits) {
      return config.subreddits
        .split(",")
        .map((item) => item.trim().replace(/^r\//i, ""))
        .filter(Boolean)
        .map((item) => `r/${item}`)
        .join(", ");
    }
    if (config.username) return `u/${config.username.replace(/^u\//i, "").replace(/^@/, "")}`;
    if (config.query) return `Search: ${displaySearchText(config.query)}`;
  }
  if (source.type === "Web" && config.mode === "search") return `Search: ${displaySearchText(config.query || source.locator)}`;
  if (source.type === "YouTube" && config.query) return `Search: ${displaySearchText(config.query)}`;
  return displaySearchText(source.locator || config.feedUrl || config.url || config.channel || config.playlistId || config.spotifyUrl || "Configured source");
}

function Icon({ name }) {
  const icons = {
    overview: Home,
    today: Home,
    planner: Calendar,
    reminders: Clock,
    reviews: Check,
    meetings: Users,
    trustedContext: ShieldCheck,
    linear: Box,
    briefs: FileText,
    sources: Database,
    documents: FileText,
    briefSetup: Sparkles,
    lenses: Gauge,
    councils: Users,
    telegram: Send,
    audit: ShieldCheck,
    settings: SettingsIcon,
    plus: Plus,
    run: Sparkles,
    save: Save,
    check: Check,
    x: XIcon,
    RSS: Radio,
    Web: Globe2,
    Reddit: MessageCircle,
    X: XIcon,
    YouTube: PlayCircle,
    Podcast: BookOpen,
    Newsletter: Mail,
    mic: Mic,
    TikTok: Bot,
    upload: Upload,
    box: Box,
    Calendar,
    calendar: Calendar,
    help: CircleHelp,
    clock: Clock,
    monitor: Monitor,
    search: Search,
    grip: GripVertical,
    copy: Copy,
    download: Download,
    volume: Volume2,
    pencil: Pencil,
    trash: Trash2,
    templates: LayoutTemplate,
    external: ExternalLink,
    qr: QrCode,
    restart: RotateCcw,
  };
  const Cmp = icons[name] || Home;
  return <Cmp className="ico" aria-hidden="true" />;
}

function BrandLogo({ name }) {
  const key = String(name || "").toLowerCase();
  if (key.includes("calendar")) return <span className="brand-logo google-calendar-logo" aria-hidden="true"><svg viewBox="0 0 200 200">
    <path fill="#fff" d="M152.632 47.368 105.264 42.105l-57.895 5.263-5.263 52.632 5.263 52.632 52.632 6.579 52.632-6.579 5.263-53.947-5.264-51.317z" />
    <path fill="#1A73E8" d="M68.961 129.026c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c.829 3.158 2.276 5.605 4.342 7.342 2.053 1.737 4.553 2.592 7.474 2.592 2.987 0 5.553-.908 7.697-2.724s3.224-4.132 3.224-6.934c0-2.868-1.132-5.211-3.395-7.026s-5.105-2.724-8.5-2.724h-5.276v-9.039h4.737c2.921 0 5.382-.789 7.382-2.368 2-1.579 3-3.737 3-6.487 0-2.447-.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684 0-4.816.711-6.395 2.145s-2.724 3.197-3.447 5.276l-9.039-3.763c1.197-3.395 3.395-6.395 6.618-8.987 3.224-2.592 7.342-3.895 12.342-3.895 3.697 0 7.026.711 9.974 2.145 2.947 1.434 5.263 3.421 6.934 5.947 1.671 2.539 2.5 5.382 2.5 8.539 0 3.224-.776 5.947-2.329 8.184-1.553 2.237-3.461 3.947-5.724 5.145v.539c2.987 1.25 5.421 3.158 7.342 5.724 1.908 2.566 2.868 5.632 2.868 9.211s-.908 6.776-2.724 9.579c-1.816 2.803-4.329 5.013-7.513 6.618-3.197 1.605-6.789 2.421-10.776 2.421-4.606 0-8.869-1.329-12.803-3.987z" />
    <path fill="#1A73E8" d="m125 83.711-9.974 7.25-5.013-7.605L128 70.382h6.895v61.197H125v-47.868z" />
    <path fill="#EA4335" d="M152.632 200 200 152.632l-23.684-10.526-23.684 10.526-10.526 23.684L152.632 200z" />
    <path fill="#34A853" d="m36.842 176.316 10.526 23.684h105.263v-47.368H47.368l-10.526 23.684z" />
    <path fill="#4285F4" d="M15.789 0C7.066 0 0 7.066 0 15.789v136.842l23.684 10.526 23.684-10.526V47.368h105.263l10.526-23.684L152.632 0H15.789z" />
    <path fill="#188038" d="M0 152.632v31.579C0 192.934 7.066 200 15.789 200h31.579v-47.368H0z" />
    <path fill="#FBBC04" d="M152.632 47.368v105.263H200V47.368l-23.684-10.526-23.684 10.526z" />
    <path fill="#1967D2" d="M200 47.368V15.789C200 7.066 192.934 0 184.211 0h-31.579v47.368H200z" />
  </svg></span>;
  if (key.includes("youtube")) return <span className="brand-logo youtube" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" /></svg></span>;
  if (key.includes("reddit")) return <span className="brand-logo reddit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21.7 10.6a2.5 2.5 0 0 0-4.2-1.8c-1.3-.8-3-1.3-4.8-1.4l.8-3.7 2.6.6a2 2 0 1 0 .3-1.2l-3.3-.7a.7.7 0 0 0-.8.5l-1 4.5c-1.9.1-3.6.6-5 1.4a2.5 2.5 0 1 0-2.7 4.1 4.4 4.4 0 0 0-.1.9c0 3.5 3.8 6.3 8.5 6.3s8.5-2.8 8.5-6.3c0-.3 0-.6-.1-.9.8-.4 1.3-1.3 1.3-2.3ZM8.1 12.7a1.3 1.3 0 1 1 2.6 0 1.3 1.3 0 0 1-2.6 0Zm7.1 4.1c-.9.9-2.6 1-3.2 1s-2.3-.1-3.2-1a.6.6 0 0 1 .8-.9c.5.5 1.6.7 2.4.7.8 0 1.9-.2 2.4-.7a.6.6 0 1 1 .8.9Zm.7-2.8a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" /></svg></span>;
  if (key === "x" || key.includes("twitter")) return <span className="brand-logo x-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18.9 2h3.7l-8.1 9.2L24 22h-7.4l-5.8-6.9L4.2 22H.5l8.6-9.9L0 2h7.6l5.2 6.2L18.9 2Zm-1.3 18.1h2L6.5 3.8H4.3l13.3 16.3Z" /></svg></span>;
  if (key.includes("telegram")) return <span className="brand-logo telegram-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.5 1.1 12c-1.1-.3-1.1-1.1.2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.3Z" /></svg></span>;
  if (key.includes("linear")) return <span className="brand-logo linear-logo" aria-hidden="true">Li</span>;
  if (key.includes("openai")) return <span className="brand-logo openai-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M22 10.5a5.9 5.9 0 0 0-7.7-8.2A5.9 5.9 0 0 0 4.2 6.6a5.9 5.9 0 0 0 1.5 11.2 5.9 5.9 0 0 0 9.9 3.9 5.9 5.9 0 0 0 6.4-11.2Zm-6.5-6.9a4.4 4.4 0 0 1 4.9 6.1l-.2.3-4.8-2.8a1 1 0 0 0-.5-.1H9.4c.5-1.5 1.8-2.8 3.3-3.3.9-.3 1.9-.4 2.8-.2ZM7 4.8a4.4 4.4 0 0 1 5.7-1.2l.3.2-4.8 2.8a1 1 0 0 0-.4.4L5.1 11.7A4.4 4.4 0 0 1 7 4.8Zm-3.1 12a4.4 4.4 0 0 1-.2-7.2l.3-.2v5.5c0 .2 0 .4.2.5l2.7 4.7a4.4 4.4 0 0 1-3-3.3Zm4.6 4.3a4.4 4.4 0 0 1-1.7-.4l-.3-.2 4.8-2.8c.2-.1.3-.2.4-.4l2.8-4.7a4.4 4.4 0 0 1-6 8.5Zm2.3-5.2-2.3-1.3v-2.7l2.3-1.3 2.3 1.3v2.7l-2.3 1.3Zm8.4 3.3a4.4 4.4 0 0 1-2.9 1l-.3-.1 4.8-2.8c.2-.1.3-.2.4-.4l2.7-4.7a4.4 4.4 0 0 1-4.7 7Zm1.8-4.6-2.8 4.7a4.4 4.4 0 0 1-2.7-1.3l-.2-.2 4.8-2.8c.2-.1.3-.2.4-.4l2.7-4.7a4.4 4.4 0 0 1-2.2 4.7Z" /></svg></span>;
  if (key.includes("anthropic")) return <span className="brand-logo anthropic-logo" aria-hidden="true">AI</span>;
  if (key.includes("openrouter")) return <span className="brand-logo openrouter-logo" aria-hidden="true">OR</span>;
  if (key.includes("gemini") || key.includes("google")) return <span className="brand-logo gemini-logo" aria-hidden="true">G</span>;
  if (key.includes("xai") || key.includes("grok")) return <span className="brand-logo xai-logo" aria-hidden="true">xAI</span>;
  return <span className="source-icon-box"><Icon name={name} /></span>;
}

function PillarBriefLockup({ alt = "Pillar Time" }) {
  return <span className="brand-lockup" aria-label={alt}>
    <img className="brand-lockup-icon" src="/assets/pillar-time-app-icon.png" alt="" aria-hidden="true" />
    <span className="brand-wordmark" aria-hidden="true">
      <span className="brand-wordmark-main"><span>P</span><img className="brand-wordmark-pillar" src="/assets/pillar-brief-wordmark-pillar.png" alt="" /><span>LLAR</span></span>
      <span className="brand-wordmark-product">Time</span>
    </span>
  </span>;
}

async function api(path, options) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const text = await res.text();
  let payload = null;
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!res.ok) {
    const error = new Error(payload?.error || text.trim() || res.statusText || "Request failed");
    error.payload = payload;
    throw error;
  }
  if (!payload) throw new Error("The server returned an empty response. Try again.");
  return payload;
}

async function openExternalUrl(url) {
  const showFallback = () => {
    window.dispatchEvent(new CustomEvent("pillar-time:external-link-fallback", {
      detail: { url },
    }));
  };
  const openBrowserFallback = (target) => {
    const popup = window.open(target || url, "_blank", "noopener,noreferrer");
    if (!popup) showFallback();
    return !!popup;
  };
  try {
    const result = await api("/api/runtime/open-url", { method: "POST", body: JSON.stringify({ url }) });
    if (!result.opened) openBrowserFallback(result.url || url);
  } catch {
    openBrowserFallback(url);
  }
}

function useConsoleState() {
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");
  const refresh = React.useCallback(async () => {
    try {
      const nextState = await api("/api/state");
      try {
        const [ffmpegRuntime, sttRuntime] = await Promise.all([
          api("/api/runtime/ffmpeg"),
          api("/api/runtime/stt"),
        ]);
        setState({ ...nextState, runtime: { ...(nextState.runtime || {}), ffmpeg: ffmpegRuntime.ffmpeg, stt: sttRuntime.stt } });
        setError("");
      } catch {
        setState(nextState);
        setError("");
      }
    } catch (e) {
      setError(e.message);
    }
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 3500);
    return () => clearInterval(timer);
  }, [refresh]);
  const mutate = React.useCallback(async (path, body, method = "POST") => {
    const result = await api(path, { method, body: JSON.stringify(body || {}) });
    setState(result.state || result);
    if (result.state) await refresh();
    return result;
  }, [refresh]);
  return { state, setState, error, refresh, mutate };
}

function useDesktopUpdates() {
  const [updateState, setUpdateState] = React.useState({
    isDesktop: false,
    version: "",
    status: "idle",
    update: null,
    message: "",
    progress: "",
    endpoint: "",
    lastCheckedAt: "",
    lastError: "",
  });

  const checkForUpdates = React.useCallback(async ({ silent = false } = {}) => {
    if (!desktopRuntime.isDesktop()) {
      setUpdateState((current) => ({ ...current, isDesktop: false, status: "idle" }));
      return null;
    }
    setUpdateState((current) => ({
      ...current,
      isDesktop: true,
      endpoint: desktopRuntime.updaterEndpoint(),
      status: silent ? "checking-silent" : "checking",
      message: silent ? current.message : "Checking for updates...",
      progress: "",
    }));
    try {
      const [version, update] = await Promise.all([
        desktopRuntime.appVersion(),
        desktopRuntime.checkForUpdates(),
      ]);
      setUpdateState((current) => ({
        ...current,
        isDesktop: true,
        version,
        status: update ? "available" : "current",
        update,
        message: update ? `Version ${update.version} is ready to install.` : "Pillar Time is up to date.",
        progress: "",
        endpoint: desktopRuntime.updaterEndpoint(),
        lastCheckedAt: new Date().toISOString(),
        lastError: "",
      }));
      return update;
    } catch (error) {
      setUpdateState((current) => ({
        ...current,
        isDesktop: true,
        status: silent ? "idle" : "error",
        message: silent ? current.message : error.message,
        progress: "",
        endpoint: desktopRuntime.updaterEndpoint(),
        lastCheckedAt: new Date().toISOString(),
        lastError: error.message || "Update check failed",
      }));
      return null;
    }
  }, []);

  const installUpdate = React.useCallback(async () => {
    if (!updateState.update) return;
    let downloaded = 0;
    setUpdateState((current) => ({
      ...current,
      status: "installing",
      message: `Downloading version ${current.update?.version || "update"}...`,
      progress: "",
    }));
    try {
      await desktopRuntime.downloadAndInstallUpdate(updateState.update, (event) => {
        if (event.event === "Started") {
          downloaded = 0;
          setUpdateState((current) => ({
            ...current,
            progress: event.data?.contentLength ? `0 of ${Math.round(event.data.contentLength / 1024 / 1024)} MB` : "Download started",
          }));
        }
        if (event.event === "Progress") {
          downloaded += event.data?.chunkLength || 0;
          setUpdateState((current) => ({
            ...current,
            progress: `${Math.max(1, Math.round(downloaded / 1024 / 1024))} MB downloaded`,
          }));
        }
        if (event.event === "Finished") {
          setUpdateState((current) => ({ ...current, progress: "Download complete" }));
        }
      });
      setUpdateState((current) => ({
        ...current,
        status: "installed",
        message: "Update installed. Restart Pillar Time to finish.",
        progress: "",
      }));
    } catch (error) {
      setUpdateState((current) => ({
        ...current,
        status: "error",
        message: error.message,
        progress: "",
        lastError: error.message || "Update install failed",
      }));
    }
  }, [updateState.update]);

  const restartApp = React.useCallback(() => {
    const ok = window.confirm("Restart Pillar Time now to finish installing the update? Any unsaved text or in-progress setup will be lost.");
    if (!ok) return;
    desktopRuntime.restartApp();
  }, []);

  React.useEffect(() => {
    if (!desktopRuntime.isDesktop()) return;
    let cancelled = false;
    desktopRuntime.appVersion().then((version) => {
      if (!cancelled) setUpdateState((current) => ({ ...current, isDesktop: true, version, endpoint: desktopRuntime.updaterEndpoint() }));
    }).catch(() => {});
    const timer = setTimeout(() => {
      if (!cancelled) checkForUpdates({ silent: true });
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checkForUpdates]);

  return { ...updateState, checkForUpdates, installUpdate, restartApp };
}

function Shell({ route, setRoute, state, desktopUpdate, children }) {
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [externalLinkNotice, setExternalLinkNotice] = React.useState("");
  const helpRef = React.useRef(null);
  const counts = {};
  const updateVisible = desktopUpdate?.isDesktop && ["available", "installed"].includes(desktopUpdate.status);
  const updateBusy = ["checking", "checking-silent", "installing"].includes(desktopUpdate?.status);
  const updateStatus = desktopUpdate?.status === "available"
    ? `Update ${desktopUpdate.update?.version ? `v${desktopUpdate.update.version}` : ""} available`
    : desktopUpdate?.status === "installed"
      ? "Restart to finish updating"
      : desktopUpdate?.status === "current"
        ? "Pillar Time is up to date"
        : desktopUpdate?.status === "error"
          ? "Update check failed"
          : "Check for signed desktop updates";
  React.useEffect(() => {
    if (!helpOpen) return;
    const onPointerDown = (event) => {
      if (!helpRef.current?.contains(event.target)) setHelpOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [helpOpen]);
  React.useEffect(() => {
    const onExternalLinkFallback = (event) => {
      setExternalLinkNotice(event.detail?.url || "The link could not be opened automatically.");
    };
    window.addEventListener("pillar-time:external-link-fallback", onExternalLinkFallback);
    return () => window.removeEventListener("pillar-time:external-link-fallback", onExternalLinkFallback);
  }, []);
  return <div className="app">
    <header className="app-header">
      <button className="brand" onClick={() => setRoute("today")}>
        <PillarBriefLockup alt={state?.briefConfig?.productName || "Pillar Time"} />
      </button>
      <nav className="nav">
        {nav.flatMap(([, items]) => items).map(([id, label]) => <button key={id} className={`nav-item ${route === id ? "active" : ""}`} title={label} aria-label={label} onClick={() => setRoute(id)}>
            <Icon name={id} /><span>{label}</span>{counts[id] !== undefined && <b>{counts[id]}</b>}
          </button>)}
      </nav>
      <div className="header-actions" ref={helpRef}>
        <button type="button" className={`help-menu-button ${helpOpen ? "active" : ""}`} aria-haspopup="menu" aria-expanded={helpOpen} aria-controls="help-update-menu" onClick={() => setHelpOpen((current) => !current)}>
          <Icon name="help" /><span>Help</span><ChevronDown className="ico tiny" aria-hidden="true" />
        </button>
        {helpOpen && <div id="help-update-menu" className="help-menu" role="menu" aria-label="Help and update actions">
          <div className="help-menu-head">
            <strong>Pillar Time</strong>
            <span>{desktopUpdate?.version ? `Version ${desktopUpdate.version}` : "Desktop app"}</span>
          </div>
          <div className={`help-update-status ${desktopUpdate?.status === "error" ? "warn" : ""}`}>
            <Icon name={desktopUpdate?.status === "available" ? "download" : desktopUpdate?.status === "installed" ? "restart" : desktopUpdate?.status === "error" ? "x" : "check"} />
            <span>{desktopUpdate?.isDesktop ? (desktopUpdate.progress || desktopUpdate.message || updateStatus) : "Updates are available in the desktop app."}</span>
          </div>
          {desktopUpdate?.isDesktop && <div className="help-menu-actions">
            <Button type="button" role="menuitem" icon="run" onClick={() => desktopUpdate.checkForUpdates()} disabled={updateBusy}>{desktopUpdate?.status === "checking" ? "Checking..." : "Check for Updates"}</Button>
            {desktopUpdate.status === "available" && <Button type="button" role="menuitem" icon="download" kind="primary" onClick={desktopUpdate.installUpdate}>Install Update</Button>}
            {desktopUpdate.status === "installed" && <Button type="button" role="menuitem" icon="restart" kind="primary" onClick={desktopUpdate.restartApp}>Restart to Update</Button>}
            <Button type="button" role="menuitem" icon="settings" onClick={() => { setHelpOpen(false); setRoute("settings"); }}>Open Update Settings</Button>
          </div>}
        </div>}
      </div>
    </header>
    <main className="main">
      {updateVisible && <div className="desktop-update-banner">
        <div><strong>{desktopUpdate.status === "installed" ? "Update installed" : "Update available"}</strong><span>{desktopUpdate.message}</span></div>
        <div className="row tight-row">
          <Button type="button" icon="settings" onClick={() => setRoute("settings")}>Settings</Button>
          {desktopUpdate.status === "installed" && <Button type="button" icon="restart" kind="primary" onClick={desktopUpdate.restartApp}>Restart</Button>}
        </div>
      </div>}
      {externalLinkNotice && <div className="desktop-update-banner external-link-fallback">
        <div><strong>Could not open the link automatically</strong><span>Copy this URL and paste it into your browser: {externalLinkNotice}</span></div>
        <div className="row tight-row">
          <Button type="button" icon="x" onClick={() => setExternalLinkNotice("")}>Dismiss</Button>
        </div>
      </div>}
      <section className="scroll">{children}</section>
    </main>
  </div>;
}

function routeLabel(route) {
  return nav.flatMap(([, items]) => items).find(([id]) => id === route)?.[1] || "Overview";
}

function Page({ title, desc, action, children, wide = false }) {
  return <div className={`page ${wide ? "page-wide" : ""}`}>
    <div className="page-head"><div><h1>{title}</h1><p>{desc}</p></div><span />{action}</div>
    {children}
  </div>;
}

function Button({ children, icon, kind = "", className = "", ...props }) {
  return <button className={`btn ${kind} ${className}`.trim()} {...props}>{icon && <Icon name={icon} />}{children}</button>;
}

function Badge({ children, tone = "muted" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Empty({ icon, title, body, action }) {
  return <div className="empty"><Icon name={icon} /><h3>{title}</h3><p>{body}</p>{action}</div>;
}

function formatDeliveryTime(time = "08:00") {
  const [hours = "8", minutes = "00"] = String(time).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseDeliveryTime(time = "08:00") {
  const [rawHours = "8", rawMinutes = "00"] = String(time || "08:00").split(":");
  const hours24 = Math.max(0, Math.min(23, Number(rawHours) || 0));
  const minutes = String(Math.max(0, Math.min(59, Number(rawMinutes) || 0))).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;
  return { hour: String(hour12), minutes, period };
}

function formatDeliveryTimeValue({ hour, minutes, period }) {
  const rawHour = Math.max(1, Math.min(12, Number(hour) || 8));
  const rawMinutes = String(Math.max(0, Math.min(59, Number(minutes) || 0))).padStart(2, "0");
  let hours24 = rawHour % 12;
  if (period === "PM") hours24 += 12;
  return `${String(hours24).padStart(2, "0")}:${rawMinutes}`;
}

const deliveryMinuteOptions = ["00", "15", "30", "45"];

function DeliveryTimeSelect({ value = "08:00", onChange }) {
  const parsed = parseDeliveryTime(value);
  const minuteOptions = deliveryMinuteOptions.includes(parsed.minutes) ? deliveryMinuteOptions : [parsed.minutes, ...deliveryMinuteOptions];
  const update = (patch) => onChange(formatDeliveryTimeValue({ ...parsed, ...patch }));
  return <label className="delivery-field delivery-time-select">
    <Clock className="ico" />
    <select aria-label="Delivery hour" value={parsed.hour} onChange={(event) => update({ hour: event.target.value })}>
      {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
    </select>
    <span>:</span>
    <select aria-label="Delivery minute" value={parsed.minutes} onChange={(event) => update({ minutes: event.target.value })}>
      {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
    </select>
    <select aria-label="AM or PM" value={parsed.period} onChange={(event) => update({ period: event.target.value })}>
      <option>AM</option>
      <option>PM</option>
    </select>
  </label>;
}

const deliveryDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const fallbackTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function isDefaultOwnerName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return !normalized || ["you", "brief owner", "the brief owner"].includes(normalized);
}

function timezoneOptions(current) {
  const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : fallbackTimezones;
  return Array.from(new Set([current, ...supported].filter(Boolean)));
}

function relativeTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function Markdown({ text = "" }) {
  const blocks = [];
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((item, i) => <li key={i}>{item}</li>)}</ul>);
    list = [];
  };
  String(text || "").split("\n").forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
    } else if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push(<h1 key={index}>{trimmed.slice(2)}</h1>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(<h2 key={index}>{trimmed.slice(3)}</h2>);
    } else if (/^[-*]\s+/.test(trimmed)) {
      list.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      list.push(trimmed.replace(/^\d+\.\s+/, ""));
    } else {
      flushList();
      blocks.push(<p key={index}>{trimmed}</p>);
    }
  });
  flushList();
  return <div className="markdown-body">{blocks}</div>;
}

function Overview({ state, setRoute, runWorkflow, mutate }) {
  const lastRun = state.workflowRuns[0];
  const owner = state.briefConfig?.ownerName || defaultOwnerName;
  const ownerGreeting = !isDefaultOwnerName(owner) ? `Welcome, ${owner}.` : "Welcome.";
  const timezone = state.briefConfig.deliveryTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
  const timezones = timezoneOptions(timezone);
  const saveDelivery = (patch) => mutate("/api/brief-config", { ...state.briefConfig, deliveryTimezone: timezone, ...patch }, "PATCH");
  const latestBrief = state.workflowRuns.find((r) => r.status === "completed");
  const latestBriefIsToday = latestBrief && new Date(latestBrief.startedAt).toDateString() === new Date().toDateString();
  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <h1>{ownerGreeting}</h1>
        <p>Plan the day from commitments, calendar context, reminders, and optional intelligence sources.</p>
        {latestBrief && <div className="hero-actions">
          <Button icon="briefs" kind="primary" onClick={() => setRoute("briefs")}>{latestBriefIsToday ? "View today's brief" : "View latest brief"}</Button>
        </div>}
      </div>
      <div className="hero-art"><img src="/assets/desk-brief-hero.png" alt="" /></div>
    </section>

    <section className="home-grid">
      <div className="panel">
        <PanelTitle icon="settings" title="Connect your workspace" sub="Optional connectors bring calendar, project, delivery, and audio context into Pillar Time." />
        <div className="choice-grid">
          <div className={`choice source-choice ${state.connectors?.linear?.status === "ready" ? "selected" : ""}`}><BrandLogo name="Linear" /><span>Linear<small>{state.connectors?.linear?.status === "ready" ? "Connected" : "Optional project connector"}</small></span><Button icon="linear" onClick={() => setRoute("linear")}>Open</Button></div>
          <div className={`choice source-choice ${state.connectors?.googleCalendar?.status === "ready" ? "selected" : ""}`}><BrandLogo name="Calendar" /><span>Google Calendar<small>{state.connectors?.googleCalendar?.status === "ready" ? "Connected" : "Optional agenda context"}</small></span><Button icon="settings" onClick={() => setRoute("settings")}>Set up</Button></div>
          <div className={`choice source-choice ${state.tts?.status === "ready" ? "selected" : ""}`}><Icon name="volume" /><span>Audio briefs<small>{state.tts?.status === "ready" ? "Ready" : "Optional ElevenLabs voice"}</small></span><Button icon="settings" onClick={() => setRoute("settings")}>Set up</Button></div>
          <div className={`choice source-choice ${state.telegram?.enabled ? "selected" : ""}`}><BrandLogo name="Telegram" /><span>Telegram<small>{state.telegram?.enabled ? "Connected" : "Optional delivery"}</small></span><Button icon="telegram" onClick={() => setRoute("telegram")}>Configure</Button></div>
        </div>
      </div>
      <div className="panel">
        <PanelTitle icon="telegram" title="Delivery" sub="Choose when and how your brief is delivered." />
        <div className="delivery-block">
          <strong>Schedule</strong>
          <div className="delivery-row">
            <label className="delivery-field"><Calendar className="ico" /><select aria-label="Delivery frequency" value={state.briefConfig.deliveryFrequency || "Daily"} onChange={(event) => saveDelivery({ deliveryFrequency: event.target.value })}><option>Daily</option><option>Weekly</option></select></label>
            <DeliveryTimeSelect value={state.briefConfig.deliveryTime || "08:00"} onChange={(deliveryTime) => saveDelivery({ deliveryTime })} />
          </div>
          {state.briefConfig.deliveryFrequency === "Weekly" && <label className="delivery-field timezone-field"><Calendar className="ico" /><select aria-label="Delivery day" value={state.briefConfig.deliveryDay || "Monday"} onChange={(event) => saveDelivery({ deliveryDay: event.target.value })}>{deliveryDays.map((day) => <option key={day}>{day}</option>)}</select></label>}
          <label className="delivery-field timezone-field"><Globe2 className="ico" /><select aria-label="Delivery timezone" value={timezone} onChange={(event) => saveDelivery({ deliveryTimezone: event.target.value })}>{timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</select></label>
        </div>
        <div className="delivery-block">
          <strong>Deliver to</strong>
          <div className={`telegram-delivery ${state.telegram.enabled ? "selected" : ""}`}><Icon name="telegram" /><span>Telegram<small>{state.telegram.enabled ? "Connected" : "Add bot token and chat ID"}</small></span><Button onClick={() => setRoute("telegram")}>Configure</Button></div>
        </div>
      </div>
    </section>

    <section className="panel how-panel">
      <PanelTitle icon="briefSetup" title="How it works" sub="" />
      <div className="how-steps">
        <div><b>1</b><strong>Plan the day</strong><span>Tasks, reminders, reviews, and important dates stay local.</span></div>
        <ChevronDown className="how-arrow" />
        <div><b>2</b><strong>Digest signals</strong><span>Analyzers distill what matters.</span></div>
        <ChevronDown className="how-arrow" />
        <div><b>3</b><strong>Receive your plan</strong><span>{state.briefConfig.deliveryFrequency === "Weekly" ? `${state.briefConfig.deliveryDay || "Monday"}s` : "Daily"} at {formatDeliveryTime(state.briefConfig.deliveryTime)} via Telegram.</span></div>
      </div>
    </section>
  </div>;
}

function PanelTitle({ icon, title, sub }) {
  return <div className="panel-title"><span><Icon name={icon} /></span><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div></div>;
}

function Metric({ label, value, sub, alert }) {
  return <div className={`metric ${alert ? "metric-alert" : ""}`}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}

function WorkflowMini() {
  return <div className="mini-steps">{Object.entries(workflowLabels).map(([key, label], i) => <span key={key}><b>{String(i + 1).padStart(2, "0")}</b>{label}</span>)}</div>;
}

function ListRow({ title, sub, right }) {
  return <div className="list-row"><div><strong>{title}</strong><small>{sub}</small></div>{right}</div>;
}

function latestExecutiveArtifact(state) {
  const completed = state.workflowRuns?.find((run) => run.status === "completed" && (run.runType === "executive_day" || run.artifact?.runType === "executive_day") && run.artifact);
  return completed?.artifact || null;
}

function latestCalendarAgenda(state) {
  const completed = latestExecutiveArtifact(state);
  return completed?.calendarAgenda || completed?.calendarFetches?.flatMap((fetch) => fetch.events || []) || [];
}

function todayTime(state) {
  return state.time || { preferences: {}, suggestions: [], commitments: [], tasks: [], reminders: [], reviews: [], importantDates: [], meetings: [], scheduler: {} };
}
function displayCadence(value = "") {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TimeSuggestionCard({ suggestion, mutate }) {
  const [message, setMessage] = React.useState("");
  const accept = async () => {
    setMessage("");
    try {
      await mutate("/api/time/commitments", {
        title: suggestion.title,
        notes: suggestion.reason || suggestion.notes || "",
        sourceSuggestionId: suggestion.feedbackKey || suggestion.id,
      });
      setMessage("Accepted into Today’s Three.");
    } catch (error) {
      setMessage(error.message || "Could not accept this suggestion.");
    }
  };
  const feedback = async (value) => {
    setMessage("");
    try {
      await mutate(`/api/time/suggestions/${encodeURIComponent(suggestion.feedbackKey || suggestion.id || suggestion.title)}/feedback`, { feedback: value });
      setMessage(value === "notToday" ? "Moved out of today." : "Feedback saved.");
    } catch (error) {
      setMessage(error.message || "Could not save suggestion feedback.");
    }
  };
  return <div className="time-card">
    <div className="time-card-head">
      <div><strong>{suggestion.title}</strong><small>{suggestion.whyThis || suggestion.reason || "High-leverage candidate for today."}</small></div>
      <Badge tone="ok">{Math.round(suggestion.score || 0)}</Badge>
    </div>
    {(suggestion.constraintRelieved || suggestion.tradeoff || suggestion.exactNextStep) && <div className="suggestion-explain">
      {suggestion.constraintRelieved && <span><b>Relieves</b>{suggestion.constraintRelieved}</span>}
      {suggestion.tradeoff && <span><b>Displaces</b>{suggestion.tradeoff}</span>}
      {suggestion.exactNextStep && <span><b>Next</b>{suggestion.exactNextStep}</span>}
    </div>}
    <div className="chips"><span>{suggestion.leverageCategory || "admin"}</span><span>{suggestion.source || "manual"}</span>{suggestion.estimateMinutes && <span>{suggestion.estimateMinutes} min</span>}</div>
    <div className="row tight-row">
      <Button icon="check" kind="primary" onClick={accept}>Accept</Button>
      <Button icon="clock" onClick={() => feedback("notToday")}>Not Today</Button>
      <Button icon="x" onClick={() => feedback("incorrect")}>Incorrect</Button>
    </div>
    {message && <p className={message.includes("Could not") ? "warn-text" : "ok-text"}>{message}</p>}
  </div>;
}

function ProposedCalendarTiles({ artifact, approvals = [], mutate, setRoute }) {
  const blocks = artifact?.proposedCalendarBlocks || [];
  const proposalApprovals = approvals.filter((approval) => approval.kind === "calendar.proposed_schedule");
  const artifactApproval = proposalApprovals.find((approval) => approval.payload?.runId === artifact?.runId || approval.runId === artifact?.runId);
  const fallbackApproval = proposalApprovals.find((approval) => approval.status === "pending") || proposalApprovals[0];
  const approval = artifactApproval || fallbackApproval;
  const [message, setMessage] = React.useState("");
  const status = approval?.status || "missing";
  const needsReconnect = /reconnect google calendar/i.test(`${approval?.resolutionNote || ""} ${message || ""}`);
  const actionLabel = status === "pending"
    ? "Approve Calendar"
    : status === "approved"
      ? "Retry Calendar Write"
      : status === "executed"
        ? "Calendar Added"
        : status === "rejected"
          ? "Calendar Rejected"
          : "No Approval Available";
  const canExecute = status === "pending" || status === "approved";
  const approve = async () => {
    if (!approval) {
      setMessage("No pending calendar approval found.");
      return;
    }
    setMessage("");
    try {
      if (approval.status === "pending") await mutate(`/api/approvals/${approval.id}`, { status: "approved" }, "PATCH");
      await mutate(`/api/approvals/${approval.id}/execute`, {}, "POST");
      setMessage("Calendar blocks were added.");
    } catch (error) {
      setMessage(error.message || "Calendar approval failed.");
    }
  };
  if (!blocks.length) return null;
  return <section className="panel proposed-calendar-panel">
    <div className="proposed-calendar-head">
      <PanelTitle icon="calendar" title="Proposed Calendar" sub="Approval-gated blocks built around hard calendar commitments." />
      <Button icon={status === "approved" ? "restart" : "check"} kind="primary" onClick={approve} disabled={!canExecute}>{actionLabel}</Button>
    </div>
    {approval && status !== "pending" && <div className={`approval-state-note ${status === "executed" ? "ok-text" : status === "approved" ? "warn-text" : "muted-text"}`}>
      {status === "approved" ? `Approved, but not written to Google Calendar${approval.resolutionNote ? `: ${approval.resolutionNote}` : "."}` : `Calendar proposal ${status}.`}
      {needsReconnect && setRoute && <Button type="button" icon="settings" onClick={() => setRoute("settings")}>Open Settings</Button>}
    </div>}
    <div className="calendar-tile-row">
      {blocks.map((block) => <div className="calendar-tile" key={block.id || `${block.start}-${block.title}`}>
        <strong>{new Date(block.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong>
        <span>{block.title}</span>
        <small>{block.category} · {block.minutes} min</small>
      </div>)}
    </div>
    {(artifact?.classificationWarnings || []).length > 0 && <div className="context-warning">{artifact.classificationWarnings.join(" ")}</div>}
    {message && <p className={message.includes("approved") ? "ok-text" : "warn-text"}>{message}</p>}
  </section>;
}

function Today({ state, mutate, runWorkflow, setRoute }) {
  const time = todayTime(state);
  const [capture, setCapture] = React.useState("");
  const [contextType, setContextType] = React.useState("todo");
  const [contextText, setContextText] = React.useState("");
  const [contextMessage, setContextMessage] = React.useState("");
  const [captureMessage, setCaptureMessage] = React.useState("");
  const [commitmentMessage, setCommitmentMessage] = React.useState("");
  const latestArtifact = latestExecutiveArtifact(state);
  const agenda = latestCalendarAgenda(state).slice(0, 8);
  const activeCommitments = (time.commitments || []).filter((item) => item.status !== "removed");
  const suggestions = (time.suggestions || []).slice(0, 6);
  const missingDayPlanContext = [
    state.connectors?.googleCalendar?.status === "ready" ? "" : "Calendar",
    state.connectors?.linear?.status === "ready" ? "" : "Linear",
    state.model?.status === "ready" ? "" : "model",
  ].filter(Boolean);
  const dayPlanPreflight = missingDayPlanContext.length
    ? `Generate works with available local context. Missing connectors will be reported: ${missingDayPlanContext.join(", ")}.`
    : "Generate will use Calendar, Linear, model synthesis, and local context.";
  const addTask = async (event) => {
    event.preventDefault();
    if (!capture.trim()) return;
    setCaptureMessage("");
    try {
      await mutate("/api/time/tasks", { title: capture.trim(), source: "quick-capture" });
      setCapture("");
      setCaptureMessage("Captured.");
    } catch (error) {
      setCaptureMessage(error.message || "Could not capture this task.");
    }
  };
  const removeDailyCommitment = async (item) => {
    const title = item.title || "this commitment";
    if (!window.confirm(`Remove "${title}" from Today's Three? It will stop being protected for today, but the underlying task or source item will not be deleted.`)) return;
    setCommitmentMessage("");
    try {
      await mutate(`/api/time/commitments/${item.id}`, { ...item, status: "removed" }, "PATCH");
      setCommitmentMessage(`${title} removed from Today's Three.`);
    } catch (error) {
      setCommitmentMessage(error.message || "Could not remove commitment.");
    }
  };
  const completeDailyCommitment = async (item) => {
    setCommitmentMessage("");
    try {
      await mutate(`/api/time/commitments/${item.id}`, { ...item, status: "done" }, "PATCH");
      setCommitmentMessage(`${item.title || "Commitment"} marked done.`);
    } catch (error) {
      setCommitmentMessage(error.message || "Could not mark commitment done.");
    }
  };
  const importContextFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContextText((current) => [current, text].filter(Boolean).join("\n\n").trim());
    event.target.value = "";
  };
  const saveContext = async (event) => {
    event?.preventDefault?.();
    const value = contextText.trim();
    if (!value) {
      setContextMessage("Add context before saving.");
      return false;
    }
    setContextMessage("");
    try {
      if (contextType === "identity") {
        await mutate("/api/trusted-context/facts", {
          resourceType: "identity.self_statement",
          fieldKey: "selfStatement",
          value,
          partition: "professional",
          visibility: "assistant",
          trustLevel: "verified_canonical_profile",
          verificationStatus: "verified",
          sourceLabel: "Today context intake",
          confidence: 0.95,
        }, "POST");
      } else if (contextType === "standing") {
        await mutate("/api/trusted-context/facts", {
          resourceType: "profile.standing_commitment",
          fieldKey: `standingCommitment.${Date.now()}`,
          value,
          partition: "professional",
          visibility: "assistant",
          trustLevel: "confirmed_historical_decision",
          verificationStatus: "user_confirmed",
          sourceLabel: "Today context intake",
          confidence: 0.9,
        }, "POST");
      } else {
        await mutate("/api/time/tasks", { title: value.split(/\n/)[0].slice(0, 180), notes: value, source: "context-intake", leverageCategory: "deepWork", priority: "normal" }, "POST");
      }
      setContextText("");
      setContextMessage("Saved context.");
      return true;
    } catch (error) {
      setContextMessage(error.message || "Could not save context.");
      return false;
    }
  };
  const regenerateWithContext = async () => {
    if (contextText.trim()) {
      const saved = await saveContext();
      if (!saved) return;
    }
    await runWorkflow();
  };
  return <Page title="Today" desc="A local command center for commitments, time pressure, reminders, calendar prep, and the next honest use of the day." wide action={<div className="row tight-row"><Button icon="briefs" onClick={() => setRoute("briefs")} disabled={!latestArtifact}>View Brief</Button><Button icon="run" kind="accent" onClick={runWorkflow}>Generate Day Plan</Button></div>}>
    <div className={`day-plan-preflight ${missingDayPlanContext.length ? "has-gaps" : ""}`}>
      <Icon name={missingDayPlanContext.length ? "help" : "check"} />
      <span>{dayPlanPreflight}</span>
    </div>
    <ProposedCalendarTiles artifact={latestArtifact} approvals={state.approvals || []} mutate={mutate} setRoute={setRoute} />
    <div className="metric-grid">
      <Metric label="Today" value={time.todayKey || "-"} sub={time.preferences?.timezone || "local"} />
      <Metric label="Today’s Three" value={activeCommitments.filter((item) => item.status === "active").length} sub="accepted commitments" />
      <Metric label="Suggestions" value={suggestions.length} sub="ranked options" />
      <Metric label="Reminders" value={(time.reminders || []).filter((item) => item.enabled).length} sub={time.scheduler?.active ? "scheduler active" : "scheduler idle"} alert={!time.scheduler?.active} />
    </div>
    <div className="time-layout">
      <section className="panel">
        <PanelTitle icon="today" title="Highest Leverage Today" sub="These are offerings, not orders. Change them until they fit the day." />
        <div className="time-card-list">{suggestions.length ? suggestions.map((suggestion) => <TimeSuggestionCard key={suggestion.id || suggestion.feedbackKey || suggestion.title} suggestion={suggestion} mutate={mutate} />) : <Empty icon="planner" title="No ranked suggestions yet" body="Capture a task, add standing commitments, or connect Calendar/Linear." />}</div>
      </section>
      <section className="panel">
        <PanelTitle icon="check" title="Today’s Three" sub="The commitments Pillar Time will protect for this date." />
        {commitmentMessage && <p className={commitmentMessage.includes("Could not") ? "warn-text" : "ok-text"}>{commitmentMessage}</p>}
        {activeCommitments.length ? activeCommitments.map((item) => <ListRow key={item.id} title={item.title} sub={item.notes || item.status} right={<div className="row tight-row"><Button icon="check" onClick={() => completeDailyCommitment(item)}>Done</Button><Button icon="x" onClick={() => removeDailyCommitment(item)}>Remove</Button></div>} />) : <Empty icon="check" title="No commitments selected" body="Accept up to three high-leverage suggestions or add one from Planner." />}
        <form className="quick-capture" onSubmit={addTask}>
          <input aria-label="Quick capture task or obligation" value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Quick capture a task or obligation" />
          <Button icon="plus" kind="primary" disabled={!capture.trim()} title={!capture.trim() ? "Type a task or obligation first" : "Capture task or obligation"}>Capture</Button>
        </form>
        {captureMessage && <p className={captureMessage.includes("Could not") ? "warn-text" : "ok-text"}>{captureMessage}</p>}
      </section>
      <section className="panel">
        <PanelTitle icon="trustedContext" title="Context Intake" sub="Add identity, standing commitments, or running to-do context before regenerating." />
        <form className="form compact-form" onSubmit={saveContext}>
          <Select label="Context category" value={contextType} onChange={setContextType} options={[
            { value: "identity", label: "Identity statement" },
            { value: "standing", label: "Standing commitment" },
            { value: "todo", label: "Running to-do" },
          ]} />
          <TextArea label="Paste or type context" value={contextText} onChange={setContextText} rows={5} placeholder="Paste a statement, commitment list, or task notes here." />
          <label className="file-context-input"><Upload className="ico" /><span>Import text file</span><input type="file" accept=".txt,.md,.csv,.json,.text" onChange={importContextFile} /></label>
          <div className="row tight-row"><Button icon="save" kind="primary">Save Context</Button><Button type="button" icon="run" onClick={regenerateWithContext}>Add Context & Regenerate</Button></div>
        </form>
        {contextMessage && <p className={contextMessage.includes("Saved") ? "ok-text" : "warn-text"}>{contextMessage}</p>}
      </section>
      <section className="panel">
        <PanelTitle icon="calendar" title="Timeline" sub="Calendar context from the latest successful day plan." />
        {agenda.length ? agenda.map((event, index) => {
          const classification = (latestArtifact?.calendarClassifications || []).find((item) => item.id === event.id || item.event?.id === event.id);
          return <ListRow key={`${event.title || event.summary}-${index}`} title={event.title || event.summary || "Calendar event"} sub={[event.time || [event.start, event.end].filter(Boolean).join(" to "), classification?.visibility || "unclassified", classification?.calendarRole].filter(Boolean).join(" · ") || event.when || "Today"} right={<div className="row tight-row">{classification && <Badge tone={classification.visibility === "hardBlock" ? "ok" : classification.visibility === "ignore" ? "muted" : "warn"}>{classification.visibility}</Badge>}{event.calendarUrl && <Button icon="calendar" onClick={() => openExternalUrl(event.calendarUrl)}>Open</Button>}</div>} />;
        }) : <Empty icon="calendar" title="No agenda loaded" body="Connect Google Calendar and generate a day plan to bring today’s events into this view." />}
      </section>
      <section className="panel">
        <PanelTitle icon="reminders" title="Next Reminders" sub="Regular and sporadic nudges, paused by default until you enable them." />
        {(time.reminders || []).slice(0, 6).map((reminder) => <ListRow key={reminder.id} title={reminder.title} sub={reminder.nextOccurrence ? `${reminder.nextOccurrence.dateKey} at ${formatDeliveryTime(reminder.nextOccurrence.localTime)}` : "No next occurrence"} right={<div className="row tight-row"><Badge tone={reminder.enabled ? "ok" : "muted"}>{reminder.enabled ? "On" : "Off"}</Badge><Button icon="settings" onClick={() => setRoute("reminders")}>Edit</Button></div>} />)}
      </section>
    </div>
  </Page>;
}

function Planner({ state, mutate }) {
  const time = todayTime(state);
  const [task, setTask] = React.useState({ title: "", leverageCategory: "deepWork", estimateMinutes: 30, priority: "normal" });
  const [importantDate, setImportantDate] = React.useState({ title: "", startDate: "", endDate: "" });
  const [plannerMessage, setPlannerMessage] = React.useState("");
  const createTask = async (event) => {
    event.preventDefault();
    if (!task.title.trim()) return;
    setPlannerMessage("");
    try {
      await mutate("/api/time/tasks", task);
      setTask({ title: "", leverageCategory: "deepWork", estimateMinutes: 30, priority: "normal" });
      setPlannerMessage("Task added.");
    } catch (error) {
      setPlannerMessage(error.message || "Could not add task.");
    }
  };
  const archiveTask = async (item) => {
    const title = item.title || "this task";
    if (!window.confirm(`Archive "${title}"? It will leave the active planning backlog and stop showing as a Today candidate.`)) return;
    setPlannerMessage("");
    try {
      await mutate(`/api/time/tasks/${item.id}`, { status: "archived" }, "PATCH");
      setPlannerMessage(`${title} archived.`);
    } catch (error) {
      setPlannerMessage(error.message || "Could not archive task.");
    }
  };
  const completeTask = async (item) => {
    setPlannerMessage("");
    try {
      await mutate(`/api/time/tasks/${item.id}`, { status: "done" }, "PATCH");
      setPlannerMessage(`${item.title || "Task"} marked done.`);
    } catch (error) {
      setPlannerMessage(error.message || "Could not mark task done.");
    }
  };
  const createDate = async (event) => {
    event.preventDefault();
    if (!importantDate.title.trim() || !importantDate.startDate) return;
    setPlannerMessage("");
    try {
      await mutate("/api/time/important-dates", importantDate);
      setImportantDate({ title: "", startDate: "", endDate: "" });
      setPlannerMessage("Important date added.");
    } catch (error) {
      setPlannerMessage(error.message || "Could not add important date.");
    }
  };
  return <Page title="Planner" desc="Capture obligations, map leverage, and keep personal dates beside work context." wide>
    {plannerMessage && <p className={plannerMessage.includes("Could not") ? "warn-text" : "ok-text"}>{plannerMessage}</p>}
    <div className="split">
      <section className="panel">
        <PanelTitle icon="planner" title="Add Task" sub="Rankable work that can become a Today suggestion." />
        <form className="form" onSubmit={createTask}>
          <Field label="Title" value={task.title} onChange={(title) => setTask({ ...task, title })} />
          <TextArea label="Notes" value={task.notes || ""} rows={3} onChange={(notes) => setTask({ ...task, notes })} />
          <Select label="Leverage" value={task.leverageCategory} onChange={(leverageCategory) => setTask({ ...task, leverageCategory })} options={["unblock", "launchRevenue", "leadership", "deadline", "healthFamilyRecovery", "deepWork", "admin"]} />
          <div className="row"><Field label="Estimate minutes" value={String(task.estimateMinutes)} onChange={(estimateMinutes) => setTask({ ...task, estimateMinutes })} /><Select label="Priority" value={task.priority} onChange={(priority) => setTask({ ...task, priority })} options={["low", "normal", "high"]} /></div>
          <Button icon="plus" kind="primary" disabled={!task.title.trim()} title={!task.title.trim() ? "Add a task title first" : "Add task"}>Add Task</Button>
        </form>
      </section>
      <section className="panel">
        <PanelTitle icon="check" title="Task Backlog" sub={`${(time.tasks || []).length} captured tasks.`} />
        {(time.tasks || []).length ? time.tasks.map((item) => <ListRow key={item.id} title={item.title} sub={`${item.leverageCategory || "admin"} · ${item.status || "inbox"} · ${item.estimateMinutes || 30} min`} right={<div className="row tight-row"><Button icon="check" onClick={() => completeTask(item)}>Done</Button><Button icon="x" onClick={() => archiveTask(item)}>Archive</Button></div>} />) : <Empty icon="planner" title="No tasks captured" body="Add one task to start giving the ranking engine something real to work with." />}
      </section>
    </div>
    <section className="panel time-section">
      <PanelTitle icon="calendar" title="Important Dates" sub="Birthdays, deadlines, renewals, trips, and rituals that should shape planning." />
      <form className="quick-capture" onSubmit={createDate}>
        <input aria-label="Important date title" value={importantDate.title} onChange={(event) => setImportantDate({ ...importantDate, title: event.target.value })} placeholder="Important date" />
        <input aria-label="Important date start date" type="date" value={importantDate.startDate} onChange={(event) => setImportantDate({ ...importantDate, startDate: event.target.value, endDate: importantDate.endDate || event.target.value })} />
        <input aria-label="Important date end date" type="date" value={importantDate.endDate} onChange={(event) => setImportantDate({ ...importantDate, endDate: event.target.value })} />
        <Button icon="plus" kind="primary" disabled={!importantDate.title.trim() || !importantDate.startDate} title={!importantDate.title.trim() || !importantDate.startDate ? "Add a title and start date first" : "Add important date"}>Add</Button>
      </form>
      {(time.importantDates || []).map((item) => <ListRow key={item.id} title={item.title} sub={[item.startDate === item.endDate ? item.startDate : `${item.startDate} to ${item.endDate}`, item.category].filter(Boolean).join(" · ")} right={<Badge>{item.enabled ? "active" : "off"}</Badge>} />)}
    </section>
  </Page>;
}

function Reminders({ state, mutate }) {
  const time = todayTime(state);
  const prefs = time.preferences || {};
  const masterRemindersOn = !!prefs.reminderMasterEnabled;
  const emptyReminderForm = { title: "", body: "", type: "regular", scheduleType: "daily", localTime: "09:00", enabled: false, channels: { desktopText: true, telegramText: false }, sporadic: { windowStart: "10:00", windowEnd: "16:00", count: 2, minGapMinutes: 120 } };
  const [form, setForm] = React.useState(emptyReminderForm);
  const [reminderMessage, setReminderMessage] = React.useState("");
  const savePrefs = async (patch, label) => {
    setReminderMessage("");
    try {
      await mutate("/api/time/preferences", { ...prefs, ...patch }, "PATCH");
      setReminderMessage(`${label} saved.`);
    } catch (error) {
      setReminderMessage(error.message || "Could not update reminder settings.");
    }
  };
  const createReminder = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setReminderMessage("");
    try {
      await mutate("/api/time/reminders", form);
      setForm(emptyReminderForm);
      setReminderMessage("Reminder created.");
    } catch (error) {
      setReminderMessage(error.message || "Could not create reminder.");
    }
  };
  const archiveReminder = async (reminder) => {
    const title = reminder.title || "this reminder";
    if (!window.confirm(`Archive "${title}"? It will disappear from your active reminder list and stop scheduling future nudges.`)) return;
    setReminderMessage("");
    try {
      await mutate(`/api/time/reminders/${reminder.id}`, { archive: true }, "PATCH");
      setReminderMessage(`${title} archived.`);
    } catch (error) {
      setReminderMessage(error.message || "Could not archive reminder.");
    }
  };
  const updateReminder = async (reminder, patch, successMessage) => {
    setReminderMessage("");
    try {
      await mutate(`/api/time/reminders/${reminder.id}`, patch, "PATCH");
      setReminderMessage(successMessage);
    } catch (error) {
      setReminderMessage(error.message || "Could not update reminder.");
    }
  };
  return <Page title="Reminders" desc="Local-first reminders with explicit channel switches and no surprise delivery." wide>
    <div className="metric-grid">
      <Metric label="Master" value={prefs.reminderMasterEnabled ? "On" : "Off"} sub="global reminder gate" alert={!prefs.reminderMasterEnabled} />
      <Metric label="Regular" value={prefs.regularRemindersEnabled ? "On" : "Off"} sub="scheduled prompts" />
      <Metric label="Sporadic" value={prefs.sporadicRemindersEnabled ? "On" : "Off"} sub="deterministic random windows" />
      <Metric label="Delivery" value={prefs.channels?.telegramText ? "Telegram" : "Desktop"} sub="configured channel" />
    </div>
    {reminderMessage && <p className={reminderMessage.includes("Could not") ? "warn-text" : "ok-text"}>{reminderMessage}</p>}
    <section className="panel">
      <PanelTitle icon="settings" title="Reminder Controls" sub="Everything stays disabled unless the master switch and individual reminder are on." />
      {!masterRemindersOn && <div className="notice notice-warn">
        <strong>Master reminders are off</strong>
        <span>Channel switches are saved as preferences, but no reminder will fire until Master reminders and an individual reminder are both enabled.</span>
      </div>}
      <div className="toggle-grid">
        {[
          ["reminderMasterEnabled", "Master reminders"],
          ["regularRemindersEnabled", "Regular reminders"],
          ["sporadicRemindersEnabled", "Sporadic reminders"],
        ].map(([key, label]) => <label className="switch-row" key={key}><span>{label}</span><label className="switch"><input type="checkbox" checked={!!prefs[key]} onChange={(event) => savePrefs({ [key]: event.target.checked }, label)} /><span /></label></label>)}
        {["desktopText", "desktopAudio", "telegramText", "telegramAudio"].map((key) => <label className={`switch-row ${!masterRemindersOn ? "is-gated" : ""}`} key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><label className="switch"><input type="checkbox" checked={!!prefs.channels?.[key]} onChange={(event) => savePrefs({ channels: { ...(prefs.channels || {}), [key]: event.target.checked } }, key.replace(/([A-Z])/g, " $1"))} /><span /></label></label>)}
      </div>
    </section>
    <div className="split time-section">
      <section className="panel">
        <PanelTitle icon="plus" title="Create Reminder" sub="The new reminder is off unless you enable it." />
        <form className="form" onSubmit={createReminder}>
          <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <TextArea label="Body" value={form.body} rows={3} onChange={(body) => setForm({ ...form, body })} />
          <Select label="Type" value={form.type} onChange={(type) => setForm({ ...form, type, scheduleType: type === "sporadic" ? "sporadic" : form.scheduleType === "sporadic" ? "daily" : form.scheduleType })} options={["regular", "sporadic", "review"]} />
          {form.type === "sporadic" ? <>
            <div className="row">
              <Field label="Window start" value={form.sporadic.windowStart} onChange={(windowStart) => setForm({ ...form, sporadic: { ...form.sporadic, windowStart } })} />
              <Field label="Window end" value={form.sporadic.windowEnd} onChange={(windowEnd) => setForm({ ...form, sporadic: { ...form.sporadic, windowEnd } })} />
            </div>
            <div className="row">
              <Field label="Nudges per day" value={String(form.sporadic.count)} onChange={(count) => setForm({ ...form, sporadic: { ...form.sporadic, count } })} />
              <Field label="Minimum gap minutes" value={String(form.sporadic.minGapMinutes)} onChange={(minGapMinutes) => setForm({ ...form, sporadic: { ...form.sporadic, minGapMinutes } })} />
            </div>
          </> : <>
            <Select label="Schedule" value={form.scheduleType} onChange={(scheduleType) => setForm({ ...form, scheduleType })} options={["once", "daily", "weekday", "weekly", "selected-days", "monthly", "quarterly"]} />
            <Field label="Local time" value={form.localTime} onChange={(localTime) => setForm({ ...form, localTime })} />
          </>}
          <label className="check"><input type="checkbox" checked={!!form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Enable immediately</label>
          <Button icon="plus" kind="primary" disabled={!form.title.trim()} title={!form.title.trim() ? "Add a reminder title first" : "Create reminder"}>Create Reminder</Button>
        </form>
      </section>
      <section className="panel">
        <PanelTitle icon="reminders" title="Reminder List" sub="Pause, enable, disable, or archive any reminder." />
        {(time.reminders || []).map((reminder) => <ListRow key={reminder.id} title={reminder.title} sub={reminder.nextOccurrence ? `${reminder.type === "sporadic" ? "sporadic" : reminder.scheduleType} · next ${reminder.nextOccurrence.dateKey} ${reminder.nextOccurrence.localTime}` : reminder.type === "sporadic" ? "sporadic window" : reminder.scheduleType} right={<div className="row tight-row"><Button icon={reminder.enabled ? "x" : "check"} onClick={() => updateReminder(reminder, { enabled: !reminder.enabled }, `${reminder.title} ${reminder.enabled ? "disabled" : "enabled"}.`)}>{reminder.enabled ? "Disable" : "Enable"}</Button><Button icon="clock" onClick={() => updateReminder(reminder, { pausedUntil: new Date(Date.now() + 86400000).toISOString() }, `${reminder.title} paused until tomorrow.`)}>Pause</Button><Button icon="x" onClick={() => archiveReminder(reminder)}>Archive</Button></div>} />)}
      </section>
    </div>
  </Page>;
}

function Reviews({ state, mutate }) {
  const time = todayTime(state);
  const [reviewMessage, setReviewMessage] = React.useState("");
  const toggleReview = async (review) => {
    setReviewMessage("");
    try {
      await mutate(`/api/time/reviews/${review.id}`, { enabled: !review.enabled }, "PATCH");
      setReviewMessage(`${review.title} ${review.enabled ? "disabled" : "enabled"}.`);
    } catch (error) {
      setReviewMessage(error.message || "Could not update review.");
    }
  };
  return <Page title="Reviews" desc="Morning, midday, weekly, monthly, quarterly, and annual review templates." wide>
    <section className="panel">
      <PanelTitle icon="reviews" title="Review Templates" sub="Turn templates on when you are ready for Pillar Time to schedule them." />
      {reviewMessage && <p className={reviewMessage.includes("enabled") || reviewMessage.includes("disabled") ? "ok-text" : "warn-text"}>{reviewMessage}</p>}
      <div className="review-grid">{(time.reviews || []).map((review) => <div className="time-card" key={review.id}>
        <div className="time-card-head"><div><strong>{review.title}</strong><small>{displayCadence(review.cadence)}{review.description ? ` · ${review.description}` : ""}</small></div><Badge tone={review.enabled ? "ok" : "muted"}>{review.enabled ? "On" : "Off"}</Badge></div>
        <Markdown text={(review.prompts || []).map((question) => `- ${question}`).join("\n")} />
        <Button icon={review.enabled ? "x" : "check"} onClick={() => toggleReview(review)}>{review.enabled ? "Disable" : "Enable"}</Button>
      </div>)}</div>
    </section>
  </Page>;
}

function Meetings({ state, mutate }) {
  const time = todayTime(state);
  const [form, setForm] = React.useState({ title: "", startsAt: "", notes: "" });
  const [meetingMessage, setMeetingMessage] = React.useState("");
  const createMeeting = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setMeetingMessage("");
    try {
      await mutate("/api/time/meetings", form);
      setForm({ title: "", startsAt: "", notes: "" });
      setMeetingMessage("Meeting saved.");
    } catch (error) {
      setMeetingMessage(error.message || "Could not save meeting.");
    }
  };
  return <Page title="Meetings" desc="Capture meeting intent, notes, decisions, and follow-ups for planning context." wide>
    <div className="split">
      <section className="panel">
        <PanelTitle icon="meetings" title="Record Meeting" sub="Use this for prep notes or after-action notes." />
        {meetingMessage && <p className={meetingMessage.includes("saved") ? "ok-text" : "warn-text"}>{meetingMessage}</p>}
        <form className="form" onSubmit={createMeeting}>
          <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <Field label="Start time" value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })} />
          <TextArea label="Notes" value={form.notes} rows={5} onChange={(notes) => setForm({ ...form, notes })} />
          <Button icon="plus" kind="primary" disabled={!form.title.trim()} title={!form.title.trim() ? "Add a meeting title first" : "Save meeting"}>Save Meeting</Button>
        </form>
      </section>
      <section className="panel">
        <PanelTitle icon="meetings" title="Meeting Records" sub={`${(time.meetings || []).length} saved records.`} />
        {(time.meetings || []).length ? time.meetings.map((meeting) => <ListRow key={meeting.id} title={meeting.title} sub={[meeting.objective, meeting.prepNotes].filter(Boolean).join(" · ")} right={<Badge>{meeting.calendarEventId ? "calendar" : "manual"}</Badge>} />) : <Empty icon="meetings" title="No meeting records" body="Add prep or notes here; future suggestions can use them as planning context." />}
      </section>
    </div>
  </Page>;
}

function TrustedContext({ state, mutate }) {
  const context = state.trustedContext || {};
  const health = context.health || {};
  const [factForm, setFactForm] = React.useState({
    resourceType: "identity.profile",
    fieldKey: "preferredName",
    value: "",
    partition: "professional",
    visibility: "assistant",
    trustLevel: "verified_canonical_profile",
    verificationStatus: "verified",
  });
  const [previewRequest, setPreviewRequest] = React.useState({
    mode: "speaking_to_subject",
    partition: "professional",
    task: "daily planning",
    externalVisibility: "none",
  });
  const [preview, setPreview] = React.useState(context.envelopePreview);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => setPreview(context.envelopePreview), [context.envelopePreview]);
  const saveFact = async (event) => {
    event.preventDefault();
    const requiredMissing = !factForm.resourceType.trim() || !factForm.fieldKey.trim() || !String(factForm.value || "").trim();
    if (requiredMissing) {
      setMessage("Add a resource type, field key, and value before saving.");
      return;
    }
    setMessage("");
    try {
      await mutate("/api/trusted-context/facts", factForm, "POST");
      setFactForm((current) => ({ ...current, value: "" }));
      setMessage("Fact saved.");
    } catch (error) {
      setMessage(error.message || "Could not save profile fact.");
    }
  };
  const previewEnvelope = async () => {
    setMessage("");
    try {
      const result = await api("/api/trusted-context/envelope-preview", {
        method: "POST",
        body: JSON.stringify(previewRequest),
      });
      setPreview(result.envelope);
      setMessage("Envelope refreshed.");
    } catch (error) {
      setMessage(error.message || "Could not refresh envelope.");
    }
  };
  const updateProposal = async (proposal, status) => {
    setMessage("");
    try {
      await mutate(`/api/trusted-context/proposals/${proposal.id}`, { status }, "PATCH");
      setMessage(`Proposal ${status}.`);
    } catch (error) {
      setMessage(error.message || `Could not ${status} proposal.`);
    }
  };
  const toneForVisibility = (visibility) => visibility === "private" ? "warn" : visibility === "public" ? "ok" : "muted";
  return <Page
    title="Trusted Context"
    desc="Profile facts, source authority, memory proposals, and context envelopes used by Pillar Time."
    wide
    action={<Button icon="run" kind="primary" onClick={previewEnvelope}>Preview envelope</Button>}
  >
    <div className="metric-row">
      <Metric label="Profile facts" value={health.factCount || 0} sub={`${health.verifiedIdentityFacts || 0} verified identity`} />
      <Metric label="Proposals" value={health.proposedUpdates || 0} sub="awaiting review" />
      <Metric label="Live snapshots" value={health.liveSnapshotCount || 0} sub={(health.staleSources || []).length ? `${health.staleSources.length} stale` : "freshness tracked"} />
    </div>
    {!!(health.warnings || []).length && <section className="panel warning-panel">
      <PanelTitle icon="trustedContext" title="Context Health" sub={`${health.warnings.length} warning${health.warnings.length === 1 ? "" : "s"}`} />
      <div className="compact-list">{health.warnings.map((warning, index) => <ListRow key={`${warning}-${index}`} title={warning} sub="Quality warning" right={<Badge tone="warn">Review</Badge>} />)}</div>
    </section>}
    <div className="split">
      <section className="panel">
        <PanelTitle icon="trustedContext" title="Identity Kernel" sub="Highest-trust identity facts included in consequential context." />
        {preview?.identityKernel && Object.keys(preview.identityKernel).length ? Object.entries(preview.identityKernel).map(([key, fact]) => (
          <ListRow key={key} title={key} sub={`${fact.value} · ${fact.trustLevel}`} right={<Badge tone={fact.verified ? "ok" : "warn"}>{fact.verified ? "verified" : "unverified"}</Badge>} />
        )) : <Empty icon="trustedContext" title="No identity kernel" body="Add a verified identity fact to make context envelopes stronger." />}
      </section>
      <section className="panel">
        <PanelTitle icon="trustedContext" title="Envelope Preview" sub={preview?.quality?.ok ? "Quality checks passed." : "Quality warnings available."} />
        <div className="form compact-form">
          <Select label="Mode" value={previewRequest.mode} onChange={(mode) => setPreviewRequest({ ...previewRequest, mode })} options={["speaking_to_subject", "speaking_for_subject", "speaking_about_subject", "internal_administrative_action"].map((value) => ({ value, label: value }))} />
          <Select label="Partition" value={previewRequest.partition} onChange={(partition) => setPreviewRequest({ ...previewRequest, partition })} options={["professional", "personal", "shared"].map((value) => ({ value, label: value }))} />
          <Select label="External visibility" value={previewRequest.externalVisibility} onChange={(externalVisibility) => setPreviewRequest({ ...previewRequest, externalVisibility })} options={["none", "internal", "external"].map((value) => ({ value, label: value }))} />
          <Field label="Task" value={previewRequest.task} onChange={(task) => setPreviewRequest({ ...previewRequest, task })} />
        </div>
        <details className="raw-json" open><summary>Envelope JSON</summary><pre>{JSON.stringify(preview, null, 2)}</pre></details>
      </section>
    </div>
    <div className="split">
      <section className="panel">
        <PanelTitle icon="plus" title="Add Profile Fact" sub="Facts stay separate from proposals and live state." />
        <form className="form" onSubmit={saveFact}>
          <Field label="Resource type" value={factForm.resourceType} onChange={(resourceType) => setFactForm({ ...factForm, resourceType })} />
          <Field label="Field key" value={factForm.fieldKey} onChange={(fieldKey) => setFactForm({ ...factForm, fieldKey })} />
          <TextArea label="Value" value={factForm.value} rows={3} onChange={(value) => setFactForm({ ...factForm, value })} />
          <div className="form-grid">
            <Select label="Partition" value={factForm.partition} onChange={(partition) => setFactForm({ ...factForm, partition })} options={["professional", "personal", "shared"].map((value) => ({ value, label: value }))} />
            <Select label="Visibility" value={factForm.visibility} onChange={(visibility) => setFactForm({ ...factForm, visibility })} options={["private", "subject", "assistant", "workspace", "public"].map((value) => ({ value, label: value }))} />
          </div>
          <div className="form-grid">
            <Select label="Trust level" value={factForm.trustLevel} onChange={(trustLevel) => setFactForm({ ...factForm, trustLevel })} options={Object.keys(health.trustLevels || { verified_canonical_profile: 6, imported_unverified: 9 }).map((value) => ({ value, label: value }))} />
            <Select label="Verification" value={factForm.verificationStatus} onChange={(verificationStatus) => setFactForm({ ...factForm, verificationStatus })} options={["verified", "user_confirmed", "source_verified", "system_verified", "unverified", "observed", "inferred"].map((value) => ({ value, label: value }))} />
          </div>
          <Button icon="save" kind="primary" disabled={!factForm.resourceType.trim() || !factForm.fieldKey.trim() || !String(factForm.value || "").trim()} title={!factForm.resourceType.trim() || !factForm.fieldKey.trim() || !String(factForm.value || "").trim() ? "Add resource type, field key, and value first" : "Save fact"}>Save fact</Button>
        </form>
        {message && <p className={message.includes("saved") || message.includes("refreshed") || message.includes("approved") || message.includes("rejected") ? "ok-text" : "warn-text"}>{message}</p>}
      </section>
      <section className="panel">
        <PanelTitle icon="trustedContext" title="Memory Proposals" sub={`${(context.proposals || []).filter((item) => item.status === "proposed").length} proposed`} />
        {(context.proposals || []).length ? <div className="compact-list">{context.proposals.map((proposal) => <ListRow
          key={proposal.id}
          title={`${proposal.fieldKey}: ${proposal.proposedValue}`}
          sub={`${proposal.resourceType} · ${proposal.source} · confidence ${Math.round((proposal.confidence || 0) * 100)}%`}
          right={<div className="row tight-row"><Badge tone={proposal.status === "approved" ? "ok" : proposal.status === "rejected" ? "warn" : "muted"}>{proposal.status}</Badge>{proposal.status === "proposed" && <><Button icon="check" onClick={() => updateProposal(proposal, "approved")}>Approve</Button><Button icon="x" onClick={() => updateProposal(proposal, "rejected")}>Reject</Button></>}</div>}
        />)}</div> : <Empty icon="trustedContext" title="No proposals" body="Learned observations will wait here until you approve them." />}
      </section>
    </div>
    <section className="panel">
      <PanelTitle icon="trustedContext" title="Profile Facts" sub={`${(context.facts || []).length} stored facts`} />
      {(context.facts || []).length ? <table className="source-table simplified"><thead><tr><th>Field</th><th>Value</th><th>Trust</th><th>Scope</th><th>Status</th></tr></thead><tbody>{context.facts.map((fact) => <tr key={fact.id}>
        <td><strong>{fact.fieldKey}</strong><small>{fact.resourceType}</small></td>
        <td>{String(fact.value || "").slice(0, 140)}</td>
        <td>{fact.trustLevel}</td>
        <td><Badge tone={toneForVisibility(fact.visibility)}>{fact.partition} · {fact.visibility}</Badge></td>
        <td><Badge tone={fact.verificationStatus === "verified" ? "ok" : "muted"}>{fact.status}</Badge></td>
      </tr>)}</tbody></table> : <Empty icon="trustedContext" title="No facts yet" body="Add a profile fact to seed Trusted Context." />}
    </section>
    <section className="panel">
      <PanelTitle icon="trustedContext" title="Workspace Constitution" sub={`Version ${context.constitution?.version || 0}`} />
      <details className="raw-json"><summary>Current constitution</summary><pre>{JSON.stringify(context.constitution?.body || {}, null, 2)}</pre></details>
    </section>
  </Page>;
}

function Sources({ state, mutate }) {
  const [form, setForm] = React.useState({ name: "", type: "RSS", config: defaultConfig("RSS") });
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [editingSource, setEditingSource] = React.useState(null);
  const [spotifyResolve, setSpotifyResolve] = React.useState({ loading: false, message: "", tone: "muted" });
  const [transcribing, setTranscribing] = React.useState({});
  const [transcribeMessage, setTranscribeMessage] = React.useState("");
  const [sourceMessage, setSourceMessage] = React.useState("");
  const ffmpeg = state.runtime?.ffmpeg;
  const stt = state.runtime?.stt;
  const cloudTranscriptionReady = ["openai", "custom"].includes(state.model?.provider) && state.model?.status === "ready";
  const transcriptionAvailable = ffmpeg?.available !== false && (stt?.available || cloudTranscriptionReady);
  const definition = sourceDefinitions[form.type];
  const mode = definition.modes[form.config.mode] ? form.config.mode : Object.keys(definition.modes)[0];
  const modeDefinition = definition.modes[mode];
  const updateType = (type) => setForm({ ...form, type, config: defaultConfig(type) });
  const updateConfig = (key, value) => setForm({ ...form, config: { ...form.config, mode, [key]: value } });
  const resetSourceForm = () => {
    setForm({ name: "", type: "RSS", config: defaultConfig("RSS") });
    setAdding(false);
    setEditingSource(null);
    setSpotifyResolve({ loading: false, message: "", tone: "muted" });
  };
  const openAddSource = () => {
    setForm({ name: "", type: "RSS", config: defaultConfig("RSS") });
    setEditingSource(null);
    setAdding(true);
    setSpotifyResolve({ loading: false, message: "", tone: "muted" });
  };
  const openEditSource = (source) => {
    const config = { ...defaultConfig(source.type), ...(source.config || {}) };
    setForm({
      id: source.id,
      name: source.name || "",
      type: source.type || "RSS",
      config,
      cadence: source.cadence || "Daily",
      status: source.status || "active",
      approvalStatus: source.approvalStatus || "approved",
      credentialsStatus: source.credentialsStatus || sourceCredentialStatus(source.type || "Web"),
      note: source.note || "",
    });
    setEditingSource(source);
    setAdding(true);
    setSpotifyResolve({ loading: false, message: "", tone: "muted" });
  };
  React.useEffect(() => {
    const pending = sessionStorage.getItem("pendingSourceType");
    if (!pending || !sourceDefinitions[pending]) return;
    setForm({ name: "", type: pending, config: defaultConfig(pending) });
    setAdding(true);
    sessionStorage.removeItem("pendingSourceType");
  }, []);
  const resolveSpotify = async () => {
    setSpotifyResolve({ loading: true, message: "Resolving Spotify link...", tone: "muted" });
    try {
      const result = await api("/api/podcast/resolve-spotify", {
        method: "POST",
        body: JSON.stringify({ spotifyUrl: form.config.spotifyUrl }),
      });
      if (!result.ok) {
        setSpotifyResolve({ loading: false, message: result.error || "Could not resolve RSS feed.", tone: "warn" });
        return;
      }
      setForm((current) => ({
        ...current,
        name: current.name || result.podcastTitle || "",
        config: {
          ...current.config,
          mode: "spotify",
          feedUrl: result.feedUrl,
          podcastTitle: result.podcastTitle,
          podcastAuthor: result.author,
          spotifyTitle: result.spotifyTitle,
          resolverConfidence: result.confidence,
          transcribeNewEpisodes: current.config.transcribeNewEpisodes ?? true,
        },
      }));
      setSpotifyResolve({ loading: false, message: `Resolved ${result.podcastTitle} RSS feed (${result.confidence} confidence).`, tone: "ok" });
    } catch (error) {
      setSpotifyResolve({ loading: false, message: error.message, tone: "warn" });
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    const locator = sourceLocator(form.type, { ...form.config, mode });
    const payload = { ...form, locator, config: { ...form.config, mode } };
    const endpoint = editingSource ? `/api/sources/${editingSource.id}` : "/api/sources";
    const method = editingSource ? "PATCH" : "POST";
    setSourceMessage("");
    try {
      await mutate(endpoint, payload, method);
      const action = editingSource ? "updated" : "added";
      const name = form.name || "Source";
      resetSourceForm();
      setSourceMessage(`${name} ${action}.`);
    } catch (error) {
      setSourceMessage(error.message || "Could not save source.");
    }
  };
  const updateSourceStatus = async (source, active) => {
    setSourceMessage("");
    try {
      await mutate(`/api/sources/${source.id}`, { status: active ? "paused" : "active" }, "PATCH");
      setSourceMessage(`${source.name || "Source"} ${active ? "paused" : "activated"}.`);
    } catch (error) {
      setSourceMessage(error.message || "Could not update source.");
    }
  };
  const deleteSource = async (source) => {
    if (!window.confirm(`Delete source "${source.name}"? This removes it from future runs.`)) return;
    setSourceMessage("");
    try {
      await mutate(`/api/sources/${source.id}`, {}, "DELETE");
      setSourceMessage(`${source.name || "Source"} deleted.`);
    } catch (error) {
      setSourceMessage(error.message || "Could not delete source.");
    }
  };
  const transcribeSource = async (sourceId, mode) => {
    setTranscribing((current) => ({ ...current, [sourceId]: true }));
    setTranscribeMessage("");
    try {
      const result = await mutate(`/api/sources/${sourceId}/transcribe`, { mode });
      const payload = result.result;
      if (!payload.transcribed) {
        setTranscribeMessage(payload.reason || "No new episode was transcribed.");
      } else {
        setTranscribeMessage(`Transcribed "${payload.episode.title}" for future briefs (${payload.words} words, ${payload.chunks} audio chunk${payload.chunks === 1 ? "" : "s"}).`);
      }
    } catch (error) {
      setTranscribeMessage(error.message);
    } finally {
      setTranscribing((current) => ({ ...current, [sourceId]: false }));
    }
  };
  const sourceCredentialLabel = (source) => {
    if (source.type === "X" && state.connectors?.x?.apiKeySaved) return "configured";
    if (source.type === "Calendar" && state.connectors?.googleCalendar?.status === "ready") return "configured";
    return source.credentialsStatus;
  };
  const sourceTypeChoices = [
    ["RSS", "RSS / Feed"],
    ["Web", "Web search"],
    ["X", "X (Twitter)"],
    ["YouTube", "YouTube"],
    ["Newsletter", "Journal / Library"],
    ["Podcast", "Podcast"],
    ["Reddit", "Reddit"],
    ["Calendar", "Calendar"],
  ];
  const filteredSources = state.sources.filter((source) => {
    const text = `${source.name} ${source.type} ${source.locator} ${sourceDisplayLocator(source)}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });
  return <Page
    title="Sources"
    desc="Add and manage the feeds, accounts, and searches your brief monitors. External fetches stay disabled until credentials or adapter support are present."
    action={<Button icon="plus" kind="primary" onClick={openAddSource}>Add source</Button>}
    wide
  >
    <div className="sources-workspace">
      <section className="panel sources-table-card">
        <div className="table-title-row"><h2>Your sources</h2><label className="table-search"><Icon name="search" /><input aria-label="Search sources" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources..." /></label></div>
        {sourceMessage && <p className={sourceMessage.includes("Could not") ? "warn-text" : "ok-text"}>{sourceMessage}</p>}
        {transcribeMessage && <div className="notice source-transcribe-message"><span>{transcribeMessage}</span></div>}
        {state.sources.length ? <table className="source-table simplified"><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Credentials</th><th></th></tr></thead><tbody>{filteredSources.map((s) => {
        const credential = sourceCredentialLabel(s);
        const displayLocator = sourceDisplayLocator(s);
        const active = s.status === "active";
        return <tr key={s.id}>
          <td><div className="source-name-cell"><BrandLogo name={s.type} /><div><strong>{s.name}</strong><small title={displayLocator}>{displayLocator}</small></div></div></td>
          <td>{s.type === "Newsletter" ? "Journal / Library" : s.type}</td>
          <td><button type="button" className={`source-toggle ${active ? "active" : "paused"}`} onClick={() => updateSourceStatus(s, active)} aria-pressed={active}><span></span>{active ? "Active" : "Paused"}</button></td>
          <td><Badge tone={["configured", "not required"].includes(credential) ? "ok" : credential === "optional" ? "muted" : "warn"}>{credential}</Badge></td>
          <td><div className="source-actions"><button type="button" onClick={() => openEditSource(s)}><Icon name="pencil" />Edit</button><button className="danger" type="button" onClick={() => deleteSource(s)}><Icon name="trash" />Delete</button></div></td>
        </tr>;
      })}</tbody></table> : <Empty icon="sources" title="No sources yet" body="Add the first real source. The workflow will not invent feed data." />}
        {state.sources.length > 0 && filteredSources.length === 0 && <Empty icon="search" title="No matching sources" body="Clear the search to see all configured sources." />}
      </section>
      <div className="source-tip"><Icon name="settings" /><strong>Tip:</strong><span>Sources are checked on your schedule. Adjust cadence and recency in brief settings.</span><Button icon="briefSetup" onClick={() => { location.hash = "briefSetup"; }}>Brief settings</Button></div>
    </div>
    {adding && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) resetSourceForm(); }}>
      <form className="modal-card source-modal form" role="dialog" aria-modal="true" aria-label={editingSource ? "Edit source" : "Add source"} onSubmit={submit}>
        <div className="modal-head"><div><h2>{editingSource ? "Edit source" : "Add source"}</h2><p>{editingSource ? "Update the source details your brief should monitor." : "Select a source type, then add the locator your brief should monitor."}</p></div><button type="button" aria-label="Close source editor" onClick={resetSourceForm}><Icon name="x" /></button></div>
        <div className="source-type-label">Source type</div>
        <div className="source-type-grid">
          {sourceTypeChoices.map(([type, label]) => <button type="button" key={label} className={`source-type-tile ${form.type === type ? "selected" : ""}`} onClick={() => updateType(type)}>
            <BrandLogo name={type} /><span>{label}</span>
          </button>)}
        </div>
        <Field name="source-display-name" label="Display name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="E.g., Reuters World News" required />
        <div className="source-config open">
          <div className="source-config-title"><BrandLogo name={form.type} />Source details</div>
          <div className="notice"><strong>Credential posture</strong><span>{definition.credential}</span></div>
          <Select label="Watch mode" value={mode} onChange={(nextMode) => setForm({ ...form, config: { mode: nextMode } })} options={Object.entries(definition.modes).map(([key, value]) => ({ value: key, label: value.label }))} />
          {form.type === "X" && <div className="notice"><strong>Locked quick mode</strong><span>Each run reads at most 10 posts, excludes retweets and replies, and reuses a 1-hour cache. Spend controls are intentionally not configurable.</span></div>}
          {modeDefinition.fields.map(([key, label, placeholder]) => <Field key={key} label={label} value={form.config[key] || ""} onChange={(value) => updateConfig(key, value)} placeholder={placeholder} required={key !== "keywords" && key !== "region" && key !== "include" && key !== "sort" && key !== "order" && key !== "scope"} />)}
          {form.type === "Calendar" && <div className={`notice ${state.connectors?.googleCalendar?.status === "ready" ? "" : "notice-warn"}`}>
            <strong>{state.connectors?.googleCalendar?.status === "ready" ? "Google Calendar connected" : "Google Calendar required"}</strong>
            <span>Use <span className="mono">primary</span> for the signed-in user's primary calendar. Connect Google Calendar in Settings before this source can fetch events.</span>
          </div>}
          {form.type === "Calendar" && <label className="check"><input type="checkbox" checked={form.config.includeAttendees !== false} onChange={(event) => updateConfig("includeAttendees", event.target.checked)} /> Include attendee names in brief context</label>}
          {form.type === "Calendar" && <label className="check"><input type="checkbox" checked={form.config.includeDescriptions === true} onChange={(event) => updateConfig("includeDescriptions", event.target.checked)} /> Include event descriptions</label>}
          {form.type === "Podcast" && mode === "spotify" && <div className="row">
            <Button type="button" icon="run" onClick={resolveSpotify} disabled={!form.config.spotifyUrl || spotifyResolve.loading}>{spotifyResolve.loading ? "Resolving..." : "Resolve RSS"}</Button>
            {spotifyResolve.message && <Badge tone={spotifyResolve.tone}>{spotifyResolve.message}</Badge>}
          </div>}
          {form.type === "Podcast" && <div className={`notice ${transcriptionAvailable ? "" : "notice-warn"}`}>
            <strong>{transcriptionAvailable ? "Podcast transcription available" : "Podcast transcription unavailable"}</strong>
            <span>{transcriptionAvailable ? "Podcast audio can be split with FFmpeg and transcribed with local Whisper or your configured cloud fallback." : "Set up FFmpeg plus local Whisper STT or an OpenAI-compatible transcription endpoint before podcast audio can be transcribed."}</span>
          </div>}
          {form.type === "Podcast" && <label className="check"><input type="checkbox" checked={form.config.transcribeNewEpisodes !== false && transcriptionAvailable} disabled={!transcriptionAvailable} onChange={(event) => updateConfig("transcribeNewEpisodes", event.target.checked)} /> Transcribe new episodes for briefs</label>}
        </div>
        <div className="modal-actions"><Button type="button" onClick={resetSourceForm}>Cancel</Button><Button icon={editingSource ? "save" : "plus"} kind="primary">{editingSource ? "Save source" : "Add source"}</Button></div>
      </form>
    </div>}
  </Page>;
}

function Lenses({ state, mutate }) {
  const [query, setQuery] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [lenses, setLenses] = React.useState(state.briefConfig?.perspectiveLenses || []);
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    if (!dirty) setLenses(state.briefConfig?.perspectiveLenses || []);
  }, [state.briefConfig?.perspectiveLenses, dirty]);
  const editLenses = (updater) => {
    setDirty(true);
    setMessage("Unsaved changes.");
    setLenses(updater);
  };
  const updateLens = (index, patch) => editLenses((current) => current.map((lens, i) => i === index ? { ...lens, ...patch } : lens));
  const addLens = () => editLenses((current) => [...current, { id: `perspective-${Date.now()}`, name: "New Perspective", role: "Point of view", description: "", instructions: "Read the saved brief from this perspective and name what it notices, worries about, and would do next.", enabled: true }]);
  const removeLens = (index) => editLenses((current) => current.filter((_, i) => i !== index));
  const save = async () => {
    setMessage("");
    try {
      await mutate("/api/brief-config", { ...state.briefConfig, perspectiveLenses: lenses }, "PATCH");
      setDirty(false);
      setMessage("Perspective lenses saved.");
    } catch (error) {
      setMessage(error.message || "Could not save perspective lenses.");
    }
  };
  const filtered = lenses.filter((lens) => `${lens.name} ${lens.role} ${lens.description}`.toLowerCase().includes(query.toLowerCase()));
  return <Page
    title="Perspective Lenses"
    desc="Optional viewpoints used only when you deliberate a saved brief."
    action={<Button icon="plus" kind="primary" onClick={addLens}>Add lens</Button>}
    wide
  >
    <section className="panel perspective-panel">
      <div className="builder-head"><div><h2>Deliberation lenses</h2><p>These do not shape normal brief generation. They run when you click Deliberate Brief.</p></div><div className="builder-actions"><label className="mini-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lenses..." /></label><Button icon="save" kind="primary" onClick={save}>Save lenses</Button></div></div>
      <div className="analyzer-list">
        {filtered.map((lens) => {
          const index = lenses.findIndex((item) => item.id === lens.id);
          return <div className={`analyzer-card ${lens.enabled === false ? "disabled" : ""}`} key={lens.id}>
            <label className="switch"><input type="checkbox" checked={lens.enabled !== false} onChange={(event) => updateLens(index, { enabled: event.target.checked })} /><span /></label>
            <Field label="Name" value={lens.name || ""} onChange={(name) => updateLens(index, { name })} />
            <Field label="Role" value={lens.role || ""} onChange={(role) => updateLens(index, { role })} />
            <TextArea label="Description" value={lens.description || ""} onChange={(description) => updateLens(index, { description })} rows={2} />
            <TextArea label="Instructions" value={lens.instructions || ""} onChange={(instructions) => updateLens(index, { instructions })} rows={3} />
            <Button type="button" icon="trash" onClick={() => removeLens(index)}>Remove</Button>
          </div>;
        })}
      </div>
      {!filtered.length && <Empty icon="lenses" title="No perspective lenses" body="Add lenses here, or generate them during onboarding from natural language." />}
      {message && <p className={message.includes("saved") ? "ok-text" : message.includes("Unsaved") ? "hint" : "warn-text"}>{message}</p>}
    </section>
  </Page>;
}

function Linear({ state, refresh }) {
  const connector = state.connectors?.linear || {};
  const ready = connector.status === "ready";
  const [bootstrap, setBootstrap] = React.useState({ viewer: null, teams: [], projects: [], workflowStates: [] });
  const [issuesPayload, setIssuesPayload] = React.useState({ issues: [], groups: [] });
  const [filters, setFilters] = React.useState({ teamKey: connector.teamKey || "TRA", assignee: "me", stateTypes: "backlog,unstarted,started", projectId: "" });
  const [newIssue, setNewIssue] = React.useState({ title: "", description: "", teamId: "", projectId: "", stateId: "", priority: "" });
  const [commentDrafts, setCommentDrafts] = React.useState({});
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const selectedTeam = bootstrap.teams.find((team) => team.key === filters.teamKey) || bootstrap.teams[0];
  const stateOptions = bootstrap.workflowStates
    .filter((item) => !selectedTeam?.key || item.team?.key === selectedTeam.key)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const projectOptions = bootstrap.projects;
  const linearCreateDisabledReason = !newIssue.title.trim()
    ? "Add an issue title first"
    : !newIssue.teamId
      ? "Choose a Linear team first"
      : "";

  const loadBootstrap = React.useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ teamKey: filters.teamKey || "TRA" });
      const result = await api(`/api/linear/bootstrap?${params}`);
      setBootstrap({ viewer: result.viewer, teams: result.teams || [], projects: result.projects || [], workflowStates: result.workflowStates || [] });
      await refresh();
    } catch (error) {
      setMessage(error.message || "Linear setup failed.");
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [filters.teamKey, ready, refresh]);

  const loadIssues = React.useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        teamKey: filters.teamKey || "TRA",
        assignee: filters.assignee,
        stateTypes: filters.stateTypes,
        first: "50",
        pages: "3",
      });
      if (filters.projectId) params.set("projectId", filters.projectId);
      const result = await api(`/api/linear/issues?${params}`);
      setIssuesPayload({ issues: result.issues || [], groups: result.groups || [] });
      await refresh();
    } catch (error) {
      setMessage(error.message || "Could not load Linear issues.");
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [filters, ready, refresh]);

  React.useEffect(() => { loadBootstrap(); }, [loadBootstrap]);
  React.useEffect(() => { loadIssues(); }, [loadIssues]);
  React.useEffect(() => {
    if (newIssue.teamId || !selectedTeam?.id) return;
    setNewIssue((current) => ({ ...current, teamId: selectedTeam.id }));
  }, [newIssue.teamId, selectedTeam?.id]);

  const patchIssue = async (issue, patch) => {
    setMessage("");
    try {
      await api(`/api/linear/issues/${issue.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setMessage(`${issue.identifier} updated.`);
      await loadIssues();
    } catch (error) {
      setMessage(error.message || "Linear update failed.");
    }
  };

  const createIssue = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const result = await api("/api/linear/issues", { method: "POST", body: JSON.stringify(newIssue) });
      setMessage(`${result.issue?.identifier || "Issue"} created.`);
      setNewIssue({ title: "", description: "", teamId: selectedTeam?.id || "", projectId: "", stateId: "", priority: "" });
      await loadIssues();
    } catch (error) {
      setMessage(error.message || "Linear create failed.");
    }
  };

  const addComment = async (issue) => {
    const body = String(commentDrafts[issue.id] || "").trim();
    if (!body) return;
    setMessage("");
    try {
      await api(`/api/linear/issues/${issue.id}/comments`, { method: "POST", body: JSON.stringify({ body }) });
      setCommentDrafts((current) => ({ ...current, [issue.id]: "" }));
      setMessage(`Comment added to ${issue.identifier}.`);
    } catch (error) {
      setMessage(error.message || "Linear comment failed.");
    }
  };

  if (!ready) {
    return <Page
      title="Linear"
      desc="Connect Pillar Time to Linear tasks, projects, workflow states, and comments."
      action={<Button icon="settings" onClick={() => { location.hash = "settings"; }}>Settings</Button>}
      wide
    >
      <section className="panel">
        <PanelTitle icon="linear" title="Linear connector" sub={connector.status || "Not configured"} />
        <div className="notice notice-warn">
          <strong>{connector.credentialStatus === "missing" ? "Linear API key is missing" : "Linear is disabled"}</strong>
          <span>{connector.lastError || "Open Settings, paste a Linear personal API key, then test and save the connector."}</span>
        </div>
      </section>
    </Page>;
  }

  return <Page
    title="Linear"
    desc="Review and update Transformation Agency work without leaving Pillar Time."
    action={<div className="page-actions"><Button icon="run" onClick={loadIssues} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button></div>}
    wide
  >
    <div className="settings-dashboard">
      <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon blue"><BrandLogo name="Linear" /></span><div><h2>Linear Workspace</h2><p>{bootstrap.viewer ? `Connected as ${bootstrap.viewer.displayName || bootstrap.viewer.name}` : connector.workspaceHint || "Transformation Agency"}</p></div></div>
          <Badge tone="ok">Ready</Badge>
        </div>
        <div className="row">
          <Select label="Team" value={filters.teamKey} onChange={(teamKey) => setFilters({ ...filters, teamKey, projectId: "" })} options={(bootstrap.teams.length ? bootstrap.teams : [{ key: "TRA", name: "Transformation Agency" }]).map((team) => ({ value: team.key, label: `${team.key} · ${team.name}` }))} />
          <Select label="Assignee" value={filters.assignee} onChange={(assignee) => setFilters({ ...filters, assignee })} options={[{ value: "me", label: "Assigned to me" }, { value: "all", label: "All assignees" }]} />
          <Select label="States" value={filters.stateTypes} onChange={(stateTypes) => setFilters({ ...filters, stateTypes })} options={[{ value: "backlog,unstarted,started", label: "Open" }, { value: "started", label: "Started" }, { value: "backlog,unstarted", label: "Not started" }, { value: "all", label: "All states" }]} />
          <Select label="Project" value={filters.projectId} onChange={(projectId) => setFilters({ ...filters, projectId })} options={[{ value: "", label: "All projects" }, ...projectOptions.map((project) => ({ value: project.id, label: project.name }))]} />
        </div>
        {message && <p className={message.includes("failed") || message.includes("Could not") || message.includes("missing") ? "warn-text" : "ok-text"}>{message}</p>}
      </section>

      <section className="panel">
        <PanelTitle icon="linear" title="Issues by project" sub={`${issuesPayload.issues.length} loaded`} />
        {issuesPayload.groups.length ? issuesPayload.groups.map((group) => <div className="source-config open" key={group.id}>
          <div className="source-config-title"><Icon name="box" />{group.name}<Badge>{group.issues.length}</Badge></div>
          <table className="source-table simplified"><thead><tr><th>Issue</th><th>State</th><th>Priority</th><th>Due</th><th>Comment</th><th></th></tr></thead><tbody>{group.issues.map((issue) => <tr key={issue.id}>
            <td><div className="source-name-cell"><BrandLogo name="Linear" /><div><strong>{issue.identifier} · {issue.title}</strong><small>{issue.assignee?.displayName || issue.assignee?.name || "Unassigned"} · {issue.updatedAt ? relativeTime(issue.updatedAt) : "No update"}</small></div></div></td>
            <td><select aria-label={`State for ${issue.identifier || issue.title}`} value={issue.state?.id || ""} onChange={(event) => patchIssue(issue, { stateId: event.target.value })}>{stateOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
            <td><Badge>{issue.priorityLabel || issue.priority || "No priority"}</Badge></td>
            <td>{issue.dueDate || "-"}</td>
            <td><input aria-label={`Comment on ${issue.identifier || issue.title}`} value={commentDrafts[issue.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [issue.id]: event.target.value }))} placeholder="Add comment..." /></td>
            <td><div className="source-actions"><button type="button" onClick={() => addComment(issue)} disabled={!String(commentDrafts[issue.id] || "").trim()} title={!String(commentDrafts[issue.id] || "").trim() ? "Type a comment first" : `Add comment to ${issue.identifier || issue.title}`}><Icon name="send" />Comment</button>{issue.url && <button type="button" onClick={() => openExternalUrl(issue.url)}><Icon name="external" />Open</button>}</div></td>
          </tr>)}</tbody></table>
        </div>) : <Empty icon="linear" title={loading ? "Loading Linear issues" : "No matching issues"} body={loading ? "Fetching current work from Linear." : "Adjust filters or create a new issue below."} />}
      </section>

      <section className="panel">
        <PanelTitle icon="plus" title="Create Linear issue" sub="Adds an issue to the selected workspace." />
        <form className="form" onSubmit={createIssue}>
          <div className="row">
            <Field label="Title" value={newIssue.title} onChange={(title) => setNewIssue({ ...newIssue, title })} required />
            <Select label="Team" value={newIssue.teamId} onChange={(teamId) => setNewIssue({ ...newIssue, teamId })} options={bootstrap.teams.map((team) => ({ value: team.id, label: `${team.key} · ${team.name}` }))} />
          </div>
          <TextArea label="Description" value={newIssue.description} onChange={(description) => setNewIssue({ ...newIssue, description })} rows={4} />
          <div className="row">
            <Select label="Project" value={newIssue.projectId} onChange={(projectId) => setNewIssue({ ...newIssue, projectId })} options={[{ value: "", label: "No project" }, ...projectOptions.map((project) => ({ value: project.id, label: project.name }))]} />
            <Select label="State" value={newIssue.stateId} onChange={(stateId) => setNewIssue({ ...newIssue, stateId })} options={[{ value: "", label: "Default" }, ...stateOptions.map((item) => ({ value: item.id, label: item.name }))]} />
            <Select label="Priority" value={newIssue.priority} onChange={(priority) => setNewIssue({ ...newIssue, priority })} options={[{ value: "", label: "Default" }, { value: "0", label: "No priority" }, { value: "1", label: "Urgent" }, { value: "2", label: "High" }, { value: "3", label: "Medium" }, { value: "4", label: "Low" }]} />
          </div>
          <div className="modal-actions"><Button icon="plus" kind="primary" disabled={!!linearCreateDisabledReason} title={linearCreateDisabledReason || "Create Linear issue"}>Create issue</Button></div>
        </form>
      </section>
    </div>
  </Page>;
}

function BriefSetup({ state, mutate }) {
  const [form, setForm] = React.useState(state.briefConfig);
  const [dragIndex, setDragIndex] = React.useState(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [saveState, setSaveState] = React.useState("saved");
  const [saveError, setSaveError] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    if (!dirty) setForm(state.briefConfig);
  }, [state.briefConfig, dirty]);
  React.useEffect(() => {
    window.__pillarBriefUnsavedBriefSetup = dirty;
    const beforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.__pillarBriefUnsavedBriefSetup = false;
    };
  }, [dirty]);
  const markForm = (updater) => {
    setSaveState("unsaved");
    setSaveError("");
    setDirty(true);
    setForm(updater);
  };
  const updateSection = (index, patch) => markForm((current) => ({
    ...current,
    sections: current.sections.map((section, i) => i === index ? { ...section, ...patch } : section),
  }));
  const moveSection = (index, direction) => markForm((current) => {
    const next = [...current.sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, sections: next };
  });
  const removeBriefSection = (index) => {
    const section = form.sections[index] || {};
    const label = section.label || `section ${index + 1}`;
    if (!window.confirm(`Remove "${label}" from this brief setup? This section will stop appearing in future generated briefs until you add it again.`)) return;
    markForm((current) => ({
      ...current,
      sections: current.sections.filter((_, i) => i !== index),
    }));
  };
  const copyBriefSection = (index) => markForm((current) => {
    const section = current.sections[index];
    if (!section) return current;
    const copy = {
      ...section,
      key: `${section.key || "section"}-copy-${Date.now()}`,
      label: `${section.label || `Section ${index + 1}`} Copy`,
    };
    const sections = [...current.sections];
    sections.splice(index + 1, 0, copy);
    return { ...current, sections };
  });
  const dropSection = (target) => markForm((current) => {
    if (dragIndex === null || dragIndex === target) return current;
    const next = [...current.sections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    return { ...current, sections: next };
  });
  const addSection = () => markForm((current) => ({
    ...current,
    sections: [...current.sections, { key: `custom-${Date.now()}`, label: "Watchlist", enabled: true, instruction: "3-5 items to monitor next." }],
  }));
  const updateAnalyzer = (index, patch) => markForm((current) => ({
    ...current,
    analyzers: (current.analyzers || []).map((analyzer, i) => i === index ? { ...analyzer, ...patch } : analyzer),
  }));
  const addAnalyzer = () => markForm((current) => ({
    ...current,
    analyzers: [...(current.analyzers || []), { id: `analyzer-${Date.now()}`, name: "New Analyzer", role: "Analysis role", description: "", instructions: "Evaluate the selected source items from this analysis angle and name what changes the read.", enabled: true }],
  }));
  const removeAnalyzer = (index) => markForm((current) => ({
    ...current,
    analyzers: (current.analyzers || []).filter((_, i) => i !== index),
  }));
  const save = (event) => {
    event?.preventDefault?.();
    setSaveState("saving");
    setSaveError("");
    mutate("/api/brief-config", form, "PATCH")
      .then(() => {
        setDirty(false);
        setSaveState("saved");
      })
      .catch((error) => {
        setSaveState("error");
        setSaveError(error.message || "Could not save brief setup.");
      });
  };
  if (!form) return null;
  const enabledSections = form.sections.filter((section) => section.enabled !== false);
  return <Page title="Brief setup" desc="Define the owner, voice, and section flow for every brief." wide action={<Badge tone={saveState === "error" ? "warn" : saveState === "unsaved" ? "warn" : saveState === "saved" ? "ok" : "muted"}>{saveState === "saving" ? "Saving..." : saveState === "error" ? "Save failed" : saveState === "unsaved" ? "Unsaved changes" : "Saved"}</Badge>}>
    {saveError && <p className="warn-text">Could not save brief setup: {saveError}</p>}
    <div className="setup-layout">
      <form className="panel form setup-profile" onSubmit={save}>
        <h2>Profile</h2>
        <div className="profile-grid">
          <Field label="Brief owner" value={form.ownerName} onChange={(ownerName) => markForm({ ...form, ownerName })} />
          <Field label="Product name" value={form.productName} onChange={(productName) => markForm({ ...form, productName })} />
          <TextArea label="Audience context" value={form.audienceContext} onChange={(audienceContext) => markForm({ ...form, audienceContext })} rows={4} />
          <TextArea label="Voice rules" value={form.voiceRules} onChange={(voiceRules) => markForm({ ...form, voiceRules })} rows={4} />
        </div>
        <Button icon="save" kind="primary">{saveState === "saving" ? "Saving..." : "Save now"}</Button>
      </form>
      <section className="panel analyzer-builder">
        <div className="builder-head"><div><h2>Analyzers</h2><p>These shape every generated brief through the master prompt.</p></div><div className="builder-actions"><Button type="button" icon="plus" onClick={addAnalyzer}>Add analyzer</Button><Button type="button" icon="save" kind="primary" onClick={save}>{saveState === "saving" ? "Saving..." : "Save now"}</Button></div></div>
        <TextArea label="Analyzer behavior" value={form.analyzerBehavior || ""} onChange={(analyzerBehavior) => markForm({ ...form, analyzerBehavior })} rows={4} />
        <div className="analyzer-list">
          {(form.analyzers || []).map((analyzer, index) => <div className={`analyzer-card ${analyzer.enabled === false ? "disabled" : ""}`} key={analyzer.id || index}>
            <label className="switch"><input type="checkbox" checked={analyzer.enabled !== false} onChange={(event) => updateAnalyzer(index, { enabled: event.target.checked })} /><span /></label>
            <Field label="Name" value={analyzer.name || ""} onChange={(name) => updateAnalyzer(index, { name })} />
            <Field label="Role" value={analyzer.role || ""} onChange={(role) => updateAnalyzer(index, { role })} />
            <TextArea label="Description" value={analyzer.description || ""} onChange={(description) => updateAnalyzer(index, { description })} rows={2} />
            <TextArea label="Instructions" value={analyzer.instructions || ""} onChange={(instructions) => updateAnalyzer(index, { instructions })} rows={3} />
            <Button type="button" icon="trash" onClick={() => removeAnalyzer(index)} disabled={(form.analyzers || []).length <= 1}>Remove</Button>
          </div>)}
        </div>
      </section>
      <section className="panel structure-builder">
        <div className="builder-head"><div><h2>Structure builder</h2><p>Add, edit, and reorder sections for your daily brief.</p></div><div className="builder-actions"><Button type="button" icon="save" kind="primary" onClick={save}>{saveState === "saving" ? "Saving..." : "Save now"}</Button><Button type="button" icon="briefs" onClick={() => setPreviewOpen(true)}>Live preview</Button></div></div>
        <button className="add-section" type="button" onClick={addSection}><Plus className="ico" />Add section</button>
        <div className="section-list">
          {form.sections.map((section, index) => <div
            className={`section-editor ${section.enabled === false ? "disabled" : ""}`}
            key={section.key}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropSection(index)}
            onDragEnd={() => setDragIndex(null)}
          >
            <GripVertical className="drag-handle" />
            <label className="switch"><input type="checkbox" checked={section.enabled !== false} onChange={(event) => updateSection(index, { enabled: event.target.checked })} /><span /></label>
            <input className="section-title-input" value={section.label} onChange={(event) => updateSection(index, { label: event.target.value })} />
            <div className="section-target-controls"><span className="section-target-select">Standard prompt</span></div>
            <div className="section-actions">
              <Button type="button" icon="copy" aria-label={`Copy ${section.label || "section"}`} title={`Copy ${section.label || "section"}`} onClick={() => copyBriefSection(index)} />
              <Button type="button" icon="trash" aria-label={`Remove ${section.label || "section"}`} title={`Remove ${section.label || "section"}`} onClick={() => removeBriefSection(index)} />
              <Button type="button" aria-label={`Move ${section.label || "section"} up`} title={`Move ${section.label || "section"} up`} onClick={() => moveSection(index, -1)} disabled={index === 0}>↑</Button>
              <Button type="button" aria-label={`Move ${section.label || "section"} down`} title={`Move ${section.label || "section"} down`} onClick={() => moveSection(index, 1)} disabled={index === form.sections.length - 1}>↓</Button>
            </div>
            <textarea value={section.instruction || ""} onChange={(event) => updateSection(index, { instruction: event.target.value })} rows={2} />
          </div>)}
        </div>
        <div className="setup-tip"><Sparkles className="ico" />Tip: keep the structure short and decision-oriented.</div>
      </section>
    </div>
    {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
      <div className="modal-card live-preview-modal" role="dialog" aria-modal="true" aria-label="Live preview">
        <div className="modal-head"><div><h2>Live preview</h2><p>This is how your brief will flow.</p></div><button type="button" aria-label="Close live preview" onClick={() => setPreviewOpen(false)}><Icon name="x" /></button></div>
        <div className="preview-card">{enabledSections.slice(0, 8).map((section, index) => <div className="preview-section" key={section.key}>
          <b>{index + 1}</b><div><strong>{section.label}</strong><p>{section.instruction || "Section guidance appears here."}</p><small>Standard brief section</small><span /><span /></div>
        </div>)}</div>
        <div className="preview-chips"><Badge>{enabledSections.length} sections</Badge><Badge>{form.deliveryFrequency || "Daily"} brief</Badge><Badge>{form.ownerName} voice</Badge></div>
      </div>
    </div>}
  </Page>;
}

function Documents({ state, mutate }) {
  const [form, setForm] = React.useState({ title: "", type: "Note", visibility: "private", tags: "", body: "" });
  const [documentMessage, setDocumentMessage] = React.useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setDocumentMessage("");
    try {
      await mutate("/api/documents", { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      setForm({ title: "", type: "Note", visibility: "private", tags: "", body: "" });
      setDocumentMessage("Document created.");
    } catch (error) {
      setDocumentMessage(error.message || "Could not create document.");
    }
  };
  const updateDocumentStatus = async (document) => {
    const nextStatus = document.status === "active" ? "archived" : "active";
    setDocumentMessage("");
    try {
      await mutate(`/api/documents/${document.id}`, { status: nextStatus }, "PATCH");
      setDocumentMessage(`${document.title || "Document"} ${nextStatus === "active" ? "reactivated" : "archived"}.`);
    } catch (error) {
      setDocumentMessage(error.message || "Could not update document.");
    }
  };
  return <Page title="Documents" desc="Saved work product and doctrine corpus. Records are real SQLite documents and optional chunks." wide>
    {documentMessage && <p className={documentMessage.includes("Could not") ? "warn-text" : "ok-text"}>{documentMessage}</p>}
    <div className="split">
      <form className="card form" onSubmit={submit}><h2>Create document</h2><Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} required /><Select label="Type" value={form.type} onChange={(type) => setForm({ ...form, type })} options={["Doctrine", "Memo", "Project", "Note", "Transcript", "Post"]} /><Select label="Visibility" value={form.visibility} onChange={(visibility) => setForm({ ...form, visibility })} options={["private", "team", "public"]} /><Field label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="doctrine, q2" /><TextArea label="Body" value={form.body} onChange={(body) => setForm({ ...form, body })} rows={9} /><Button icon="plus" kind="primary" disabled={!form.title.trim()} title={!form.title.trim() ? "Add a document title first" : "Create document"}>Create Document</Button></form>
      <div className="card table-card"><h2>Corpus</h2>{state.documents.length ? state.documents.map((d) => <ListRow key={d.id} title={d.title} sub={`${d.type} · ${d.wordCount} words · ${d.visibility}`} right={<Button icon={d.status === "active" ? "x" : "check"} onClick={() => updateDocumentStatus(d)}>{d.status === "active" ? "Archive" : "Reactivate"}</Button>} />) : <Empty icon="documents" title="No documents yet" body="Create or upload a real document before retrieval can affect workflow output." />}</div>
    </div>
  </Page>;
}

function Workflow({ state, runWorkflow }) {
  const [selectedId, setSelectedId] = React.useState(state.workflowRuns[0]?.id);
  React.useEffect(() => { if (state.workflowRuns[0] && !selectedId) setSelectedId(state.workflowRuns[0].id); }, [state.workflowRuns, selectedId]);
  const run = state.workflowRuns.find((r) => r.id === selectedId) || state.workflowRuns[0];
  return <Page title="Workflow Runs" desc="Every run executes the fixed product-spec sequence and stores inspectable outputs." wide action={<Button icon="run" kind="accent" onClick={runWorkflow}>Run Brief</Button>}>
    <div className="wf-layout">
      <div className="card">{state.workflowRuns.length ? state.workflowRuns.map((r) => <button key={r.id} className={`run-row ${run?.id === r.id ? "on" : ""}`} onClick={() => setSelectedId(r.id)}><strong>{r.label}</strong><small>{new Date(r.startedAt).toLocaleString()}</small><Badge tone="ok">{r.status}</Badge></button>) : <Empty icon="workflow" title="No workflow runs" body="Trigger Run Brief to create the first persisted run." />}</div>
      <div className="card">{run ? <><h2>{run.label} <span className="mono">{run.id}</span></h2><div className="step-grid">{run.steps.map((s) => <div key={s.key} className="step"><b>{String(s.n).padStart(2, "0")}</b><strong>{s.name}</strong><small>{s.output}</small></div>)}</div><BriefArtifact run={run} /><details className="raw-json"><summary>Raw artifact JSON</summary><pre>{JSON.stringify(run.artifact, null, 2)}</pre></details></> : <WorkflowMini />}</div>
    </div>
  </Page>;
}

function Approvals({ state, mutate }) {
  const [approvalMessage, setApprovalMessage] = React.useState("");
  const updateApprovalStatus = async (approval, status) => {
    setApprovalMessage("");
    try {
      await mutate(`/api/approvals/${approval.id}`, { status }, "PATCH");
      setApprovalMessage(`${approval.title || "Approval"} ${status}.`);
    } catch (error) {
      setApprovalMessage(error.message || `Could not ${status} approval.`);
    }
  };
  return <Page title="Approvals" desc="Human review is the center of the console. No public posting or document mutation happens automatically." wide>
    {approvalMessage && <p className={approvalMessage.includes("Could not") ? "warn-text" : "ok-text"}>{approvalMessage}</p>}
    <div className="card table-card">{state.approvals.length ? <table><thead><tr><th>Item</th><th>Risk</th><th>Status</th><th>Run</th><th></th></tr></thead><tbody>{state.approvals.map((a) => <tr key={a.id}><td><strong>{a.title}</strong><small>{a.kind}</small></td><td><Badge tone={a.risk === "high" ? "err" : a.risk === "medium" ? "warn" : "muted"}>{a.risk}</Badge></td><td><Badge tone={a.status === "approved" ? "ok" : a.status === "rejected" ? "err" : "warn"}>{a.status}</Badge></td><td className="mono">{a.runId || "manual"}</td><td>{a.status === "pending" && <div className="row"><Button icon="check" onClick={() => updateApprovalStatus(a, "approved")}>Approve</Button><Button icon="x" onClick={() => updateApprovalStatus(a, "rejected")}>Reject</Button></div>}</td></tr>)}</tbody></table> : <Empty icon="approvals" title="No approvals yet" body="Run the workflow or submit state-changing Telegram requests to create reviewable items." />}</div>
  </Page>;
}

function briefDisplayTitle(run) {
  const markdown = run.artifact?.onePageBrief || "";
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] || run.artifact?.strategicBrief?.headline || run.artifact?.title;
  if (title) return title;
  return run.status === "running" ? "Generating today's brief" : "Daily Brief";
}

function BriefGenerationProgress({ run }) {
  const steps = run.steps || [];
  const doneCount = steps.filter((step) => step.status === "done").length;
  return <div className="generating-inline">
    <Badge tone="muted">Generating</Badge>
    <h2>Generating today's brief</h2>
    <p>This brief is running in the background{steps.length ? ` (step ${Math.min(doneCount + 1, steps.length)} of ${steps.length})` : ""}. It will appear here automatically when it is ready.</p>
    {!!steps.length && <div className="step-grid">{steps.map((step) => <div key={step.key} className="step">
      <b>{String(step.n).padStart(2, "0")}</b>
      <strong>{step.name}</strong>
      <small>{step.status === "done" ? step.output || "Done" : step.status === "active" ? step.output || "Working..." : "Pending"}</small>
    </div>)}</div>}
  </div>;
}

function Briefs({ state, runWorkflow, refresh }) {
  const [selectedId, setSelectedId] = React.useState(state.workflowRuns[0]?.id || "");
  const [query, setQuery] = React.useState("");
  const [audioBusy, setAudioBusy] = React.useState(false);
  const [audioMessage, setAudioMessage] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("");
  const [audioPlaying, setAudioPlaying] = React.useState(false);
  const audioRef = React.useRef(null);
  React.useEffect(() => {
    if (!selectedId && state.workflowRuns[0]) setSelectedId(state.workflowRuns[0].id);
  }, [state.workflowRuns, selectedId]);
  const filtered = state.workflowRuns.filter((run) => briefDisplayTitle(run).toLowerCase().includes(query.toLowerCase()));
  const selected = state.workflowRuns.find((run) => run.id === selectedId) || filtered[0] || state.workflowRuns[0];
  React.useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setAudioUrl(selected?.artifact?.audio?.url || "");
    setAudioMessage("");
    setAudioPlaying(false);
  }, [selected?.id, selected?.artifact?.audio?.url]);
  React.useEffect(() => () => audioRef.current?.pause(), []);
  const verifyAudioUrl = async (url) => {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!response.ok) throw new Error(`Audio file is not reachable yet (${response.status}).`);
  };
  const playAudioUrl = async (url) => {
    await verifyAudioUrl(url);
    if (!audioRef.current || audioRef.current.src !== new URL(url, window.location.href).href) {
      audioRef.current?.pause();
      const audio = new Audio(url);
      audio.addEventListener("ended", () => setAudioPlaying(false));
      audio.addEventListener("pause", () => setAudioPlaying(false));
      audio.addEventListener("play", () => setAudioPlaying(true));
      audioRef.current = audio;
    }
    await audioRef.current.play();
  };
  const playBriefAudio = async () => {
    if (!selected) return;
    if (audioUrl) {
      if (audioPlaying) {
        audioRef.current?.pause();
      } else {
        playAudioUrl(audioUrl).catch((error) => setAudioMessage(error.message || "Could not play audio."));
      }
      return;
    }
    setAudioBusy(true);
    setAudioMessage("");
    try {
      const result = await api(`/api/workflow-runs/${selected.id}/audio`, { method: "POST", body: JSON.stringify({}) });
      setAudioUrl(result.audio.url);
      await playAudioUrl(result.audio.url);
      setAudioMessage("Audio brief generated and ready to play.");
      await refresh?.();
    } catch (error) {
      setAudioMessage(error.message || "Audio generated, but playback could not start.");
    } finally {
      setAudioBusy(false);
    }
  };
  const restartBriefAudio = () => {
    if (!audioUrl) return;
    if (audioRef.current) audioRef.current.currentTime = 0;
    playAudioUrl(audioUrl).catch((error) => setAudioMessage(error.message || "Could not restart audio."));
  };
  const avgSignals = state.workflowRuns.length
    ? Math.round(state.workflowRuns.reduce((sum, run) => sum + (run.artifact?.selectedIssues?.length || 0), 0) / state.workflowRuns.length)
    : 0;
  return <Page title="Your briefs" desc="Review past briefings, open a full digest, or generate a fresh one." wide action={<Button icon="run" kind="accent" onClick={runWorkflow}>Generate brief</Button>}>
    {state.workflowRuns.length ? <div className="briefs-layout">
      <aside className="panel recent-briefs">
        <h2>Recent Briefs</h2>
        <label className="search-box"><Search className="ico" /><input aria-label="Search briefs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search briefs" /></label>
        <div className="brief-list">{filtered.map((run) => {
          const selectedRun = selected?.id === run.id;
          const date = new Date(run.startedAt);
          const deliveryBadge = briefDeliveryBadge(run);
          return <button key={run.id} className={`brief-list-item ${selectedRun ? "active" : ""}`} onClick={() => setSelectedId(run.id)}>
            <span className="date-icon"><Calendar className="ico" /></span>
            <span><small>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small><strong>{briefDisplayTitle(run)}</strong><em>{(run.artifact?.selectedIssues || []).slice(0, 3).map((issue) => issue.sourceType || "Signal").join(" · ") || (run.status === "running" ? "In progress" : "Brief")}</em></span>
            <Badge tone={deliveryBadge.tone}>{deliveryBadge.label}</Badge>
          </button>;
        })}</div>
      </aside>
      <section className="panel brief-reader">
        {selected ? selected.status === "running" ? <BriefGenerationProgress run={selected} /> : <>
          <div className="brief-reader-actions">
            <Button icon="volume" onClick={playBriefAudio} disabled={audioBusy || state.tts?.status !== "ready"}>{audioBusy ? "Generating..." : audioPlaying ? "Pause" : audioUrl ? "Play audio" : "Generate audio"}</Button>
            {audioUrl && <Button icon="restart" onClick={restartBriefAudio} disabled={audioBusy || state.tts?.status !== "ready"}>Restart</Button>}
            {state.tts?.status !== "ready" && <span>Set up ElevenLabs in Settings to play briefs aloud.</span>}
          </div>
          {audioMessage && <p className={audioMessage.includes("generated") ? "ok-text" : "warn-text"}>{audioMessage}</p>}
          <Markdown text={selected.artifact?.onePageBrief || ""} />
        </> : <Empty icon="briefs" title="No brief selected" body="Choose a brief from the list." />}
      </section>
      <div className="brief-stat-bar">
        <Metric label="Briefs this week" value={state.workflowRuns.length} sub="stored locally" />
        <Metric label="Avg signals" value={avgSignals} sub="per brief" />
        <Metric label="Next delivery" value={formatDeliveryTime(state.briefConfig.deliveryTime)} sub={`${state.briefConfig.deliveryFrequency} brief`} />
      </div>
    </div> : <div className="panel"><Empty icon="briefs" title="No briefs rendered" body="Generate a fresh brief from your connected sources." action={<Button icon="run" kind="accent" onClick={runWorkflow}>Generate brief</Button>} /></div>}
  </Page>;
}

function DeliberationPanel({ deliberation, onRegenerate, busy }) {
  return <section className="deliberation-panel">
    <div className="builder-head"><div><h2>Perspective deliberation</h2><p>{deliberation.generatedAt ? new Date(deliberation.generatedAt).toLocaleString() : "Saved result"}</p></div><Button icon="restart" onClick={onRegenerate} disabled={busy}>{busy ? "Regenerating..." : "Regenerate deliberation"}</Button></div>
    <div className="deliberation-grid">
      {(deliberation.perspectives || []).map((item, index) => <div className="deliberation-card" key={`${item.name}-${index}`}>
        <strong>{item.name}</strong>
        {item.role && <small>{item.role}</small>}
        <p>{item.take}</p>
        {item.implication && <span>{item.implication}</span>}
      </div>)}
    </div>
    {deliberation.synthesis && <div className="deliberation-synthesis"><strong>Synthesis</strong><p>{deliberation.synthesis}</p></div>}
  </section>;
}

function GeneratingBrief({ runState }) {
  const status = runState?.status || "running";
  const steps = runState?.steps?.length ? runState.steps : [{ key: "run", name: "Generating brief" }];
  const isExecutiveDay = runState?.runType === "executive_day";
  const [slowStep, setSlowStep] = React.useState(false);
  const activeIndex = steps.findIndex((step) => step.status === "active");
  const doneCount = steps.filter((step) => step.status === "done").length;
  const currentIndex = Math.max(0, Math.min(steps.length - 1, activeIndex >= 0 ? activeIndex : status === "done" ? steps.length - 1 : runState?.stepIndex ?? doneCount));
  const current = steps[currentIndex];
  const progress = status === "done" ? 100 : Math.round(((currentIndex + 0.35) / steps.length) * 100);
  const completion = status === "done" ? briefCompletionCopy(runState) : null;
  React.useEffect(() => {
    setSlowStep(false);
    if (status !== "running") return undefined;
    const timer = setTimeout(() => setSlowStep(true), 2000);
    return () => clearTimeout(timer);
  }, [currentIndex, status]);
  return <div className="generating-screen">
    <div className="generating-panel">
      <Badge tone={status === "error" ? "warn" : completion ? completion.badge.tone : "muted"}>{status === "error" ? "Needs attention" : completion ? completion.badge.label : "Generating"}</Badge>
      <h1>{status === "error" ? "Generation stopped." : completion ? completion.title : current.name}</h1>
      <p>{status === "error" ? runState?.error || "Something went wrong while generating." : completion ? completion.body : `Step ${currentIndex + 1} of ${steps.length}: ${current.output || (workflowLabels[current.key] || current.name || "working").toLowerCase()}.`}</p>
      {status === "running" && current.detail && <p className="generating-detail">{current.detail}</p>}
      <div className={`main-progress ${slowStep ? "working" : ""}`} aria-label="Brief generation progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="generation-step-list">
        {steps.map((step, index) => <div key={step.key} className={step.status === "done" || status === "done" ? "done" : step.status === "active" && status !== "error" ? "active" : step.status === "error" ? "error" : ""}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          <span>{step.name}</span>
        </div>)}
      </div>
    </div>
  </div>;
}

function BriefArtifact({ run, compact = false }) {
  const artifact = run.artifact || {};
  const issues = artifact.selectedIssues || [];
  const owner = artifact.briefConfig?.ownerName || "";
  const xFetches = artifact.xFetches || [];
  const rssFetches = artifact.rssFetches || [];
  const redditFetches = artifact.redditFetches || [];
  const webFetches = artifact.webFetches || [];
  const calendarFetches = artifact.calendarFetches || [];
  const podcasts = artifact.podcastTranscriptions || [];
  return <article className={`brief-artifact ${compact ? "compact" : ""}`}>
    <div className="brief-headline">
      <div>
        <h2>{artifact.title || run.label}</h2>
        <p>{artifact.generatedAt ? new Date(artifact.generatedAt).toLocaleString() : new Date(run.startedAt).toLocaleString()}</p>
      </div>
      <Badge tone={issues.length ? "ok" : "warn"}>{issues.length ? `${issues.length} selected` : "no selected issues"}</Badge>
    </div>
    {artifact.onePageBrief && <section className="brief-section"><h3>One-Page Brief</h3><Markdown text={artifact.onePageBrief} /></section>}
    {!compact && <details className="raw-json"><summary>Source diagnostics</summary><div className="brief-section">{xFetches.map((result) => <div className="brief-note" key={`${result.sourceId}-${result.sourceName}`}><strong>{result.sourceName}</strong><span>{result.ok === false ? result.error : result.skipped ? result.reason : `Quick mode: ${result.seen || 0} posts fetched, ${result.inserted || 0} new, est. cost $${Number(result.estimatedCostUsd || 0).toFixed(3)}.`}</span></div>)}{[...rssFetches, ...redditFetches, ...webFetches].map((result) => <div className="brief-note" key={`${result.sourceId}-${result.sourceName}`}><strong>{result.sourceName}</strong><span>{result.ok === false ? result.error : result.skipped ? result.reason : `${result.seen || 0} fetched, ${result.inserted || 0} new.`}</span></div>)}{calendarFetches.map((result) => <div className="brief-note" key={`${result.sourceId}-${result.sourceName}`}><strong>{result.sourceName}</strong><span>{result.ok === false ? result.error : result.skipped ? result.reason : `${result.today || result.seen || 0} calendar event${Number(result.today || result.seen || 0) === 1 ? "" : "s"} found.`}</span></div>)}{podcasts.map((result) => <div className="brief-note" key={`${result.sourceId}-${result.sourceName}`}><strong>{result.sourceName}</strong><span>{result.transcribed ? `Transcribed ${result.episode?.title || "episode"}` : result.reason || result.error || "No transcript created."}</span></div>)}</div></details>}
    <section className="brief-section">
      <h3>Selected Issues</h3>
      {issues.length ? <div className="issue-list">{issues.map((issue) => <a className="issue" key={issue.id || issue.url || issue.title} href={issue.url} target="_blank" rel="noreferrer">
        <div><strong>{issue.title}</strong><small>{issue.sourceName}{issue.publishedAt ? ` · ${new Date(issue.publishedAt).toLocaleString()}` : ""}</small></div>
        <p>{issue.summary || issue.whyJackShouldCare}</p>
        <span>Relevance {Math.round((issue.relevanceScore || 0) * 100)} · Rising {Math.round((issue.risingScore || 0) * 100)}</span>
      </a>)}</div> : <Empty icon="briefs" title="No issues selected" body="The run completed, but no normalized source items were available for selection." />}
    </section>
    {!compact && <div className="brief-columns">
      <section className="brief-section"><h3>{owner && owner !== "You" ? `Why ${owner} Should Care` : "Why It Matters"}</h3>{artifact.whyJackShouldCare ? <p className="brief-copy">{artifact.whyJackShouldCare}</p> : <p className="muted-copy">Pending source signal or model synthesis.</p>}</section>
      <section className="brief-section"><h3>Analyzer Synthesis</h3><p className="brief-copy">{artifact.analyzer?.synthesis || artifact.council?.synthesis || "No analyzer synthesis yet."}</p><div className="chips">{(artifact.analyzer?.members || artifact.council?.members || []).map((member) => <span key={member}>{member}</span>)}</div></section>
      <section className="brief-section"><h3>{owner && owner !== "You" ? `${owner} POV` : "POV"}</h3><p className="brief-copy">{artifact.jackPov || "Pending approval-ready draft."}</p></section>
    </div>}
  </article>;
}

const modelProviderRows = [
  {
    provider: "openai",
    name: "OpenAI",
    logo: "openai",
    sub: "GPT models for brief generation",
    keyUrl: "https://platform.openai.com/api-keys",
    docsUrl: "https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key",
    helper: "Create a project API key in the OpenAI Platform. OpenAI is also supported for local podcast transcription.",
  },
  {
    provider: "anthropic",
    name: "Anthropic",
    logo: "anthropic",
    sub: "Claude models for analysis",
    keyUrl: "https://console.anthropic.com/settings/keys",
    docsUrl: "https://docs.anthropic.com/en/api/overview",
    helper: "Create an Anthropic Console API key, then validate it here to discover available Claude models.",
  },
  {
    provider: "openrouter",
    name: "OpenRouter",
    logo: "openrouter",
    sub: "Route through multiple hosted models",
    keyUrl: "https://openrouter.ai/settings/keys",
    docsUrl: "https://openrouter.ai/docs/api-reference/authentication",
    helper: "Create an OpenRouter key, optionally set a spend limit, then use any supported routed model.",
  },
  {
    provider: "gemini",
    name: "Gemini",
    logo: "gemini",
    sub: "Google Gemini models for brief generation",
    keyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models",
    helper: "Create a Gemini API key in Google AI Studio. Available models are detected directly from Google after the key is saved or pasted.",
  },
  {
    provider: "xai",
    name: "Grok",
    logo: "xai",
    sub: "xAI Grok models for brief generation",
    keyUrl: "https://console.x.ai/",
    docsUrl: "https://docs.x.ai/docs/models",
    helper: "Create an xAI API key, add credits in the xAI Console if needed, then validate it here to discover Grok models.",
  },
];

const setupLinks = {
  x: {
    keyUrl: "https://developer.x.com/en/portal/dashboard",
    docsUrl: "https://docs.x.com/x-api/getting-started/getting-access",
    helper: "Create or open an X developer app and copy its Bearer Token. Pillar Time uses locked quick search to keep usage small.",
  },
  ffmpeg: {
    keyUrl: "https://brew.sh",
    docsUrl: "https://formulae.brew.sh/formula/ffmpeg",
    helper: "FFmpeg is a host-installed command-line tool. On macOS the one-click action uses Homebrew to install the ffmpeg formula.",
  },
  elevenlabs: {
    keyUrl: "https://elevenlabs.io/app/settings/api-keys",
    docsUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech/stream",
    helper: "Optional. Add ElevenLabs to listen to briefs in the app and, if Telegram is connected, auto-send an MP3 after the text brief.",
  },
};

function TelegramPairingFlow({ state, refresh, initialToken = "", onPaired }) {
  const [botToken, setBotToken] = React.useState(initialToken || state.telegram.botToken || "");
  const [session, setSession] = React.useState(null);
  const [bot, setBot] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const paired = session?.status === "paired" || (state.telegram.enabled && state.telegram.chatId && state.telegram.botToken);
  React.useEffect(() => {
    if (!session?.id || session.status !== "waiting") return;
    const timer = setInterval(async () => {
      try {
        const result = await api(`/api/telegram/pairing/${session.id}/poll`, { method: "POST", body: JSON.stringify({}) });
        setSession(result.session);
        if (result.session?.status === "paired") {
          setMessage("Paired. Telegram delivery is ready.");
          await refresh();
          onPaired?.();
        }
        if (["failed", "expired"].includes(result.session?.status)) setMessage(result.session.error || "Pairing stopped. Start a new code.");
      } catch (error) {
        if (error.payload?.session) setSession(error.payload.session);
        setMessage(error.message);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [session?.id, session?.status, refresh, onPaired]);
  const startPairing = async (event) => {
    event?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const validation = await api("/api/telegram/token/validate", { method: "POST", body: JSON.stringify({ botToken }) });
      setBot(validation.botUsername);
      const result = await api("/api/telegram/pairing/start", { method: "POST", body: JSON.stringify({ botToken }) });
      setSession(result.session);
      setMessage("Pairing code is live. In Telegram, chat with your bot, send /start, then reply with the code shown here.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="telegram-pairing">
    <div className="botfather-card">
      <div className="botfather-copy">
        <BrandLogo name="Telegram" />
        <div>
          <h3>Create the bot</h3>
          <p>Follow Telegram's BotFather tutorial to create a bot and copy the API token. Then paste that token here.</p>
        </div>
      </div>
      <Button type="button" icon="external" kind="primary" onClick={() => openExternalUrl("https://core.telegram.org/bots/tutorial#obtain-your-bot-token")}>Open bot setup guide</Button>
    </div>
    <form className="pair-token-row" onSubmit={startPairing}>
      <Field label="BotFather API token" type="password" value={botToken} onChange={setBotToken} placeholder={state.telegram.botToken ? "Saved. Paste a new token to replace it." : "123456:ABC..."} />
      <Button icon="telegram" kind="primary" disabled={busy || !botToken}>{busy ? "Checking..." : "Create pairing link"}</Button>
    </form>
    {(session || paired) && <div className={`pair-status ${paired ? "paired" : session?.status || "waiting"}`}>
      <div className="pair-status-head">
        <div><strong>{paired ? "Telegram paired" : session?.status === "waiting" ? "Waiting for Telegram" : "Pairing status"}</strong><span>{bot || session?.botUsername ? `@${bot || session?.botUsername}` : "Telegram bot"}</span></div>
        <Badge tone={paired ? "ok" : session?.status === "failed" || session?.status === "expired" ? "warn" : "muted"}>{paired ? "Connected" : session?.status || "waiting"}</Badge>
      </div>
      {!paired && session?.deepLink && <div className="pair-grid">
        <div className="pair-actions">
          <p>In Telegram, open a chat with <strong>@{bot || session.botUsername}</strong> and send <span className="mono">/start</span>. The bot will ask for this pairing code:</p>
          <div className="pair-code">{session.code}</div>
          <p>Reply to the bot with the code exactly as shown. When it matches, this screen will mark Telegram as paired.</p>
          <small>Expires {new Date(session.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>
        </div>
        <div className="qr-card">
          <img src={session.qrUrl} alt="Telegram pairing QR code" />
          <span><Icon name="qr" />Scan with your phone</span>
        </div>
      </div>}
    </div>}
    {message && <p className={message.includes("ready") || message.includes("live") || message.includes("Paired") ? "ok-text" : "warn-text"}>{message}</p>}
  </div>;
}

function OnboardingLoading({ title, body }) {
  return <div className="onboarding-loading-card">
    <span className="onboarding-spinner" />
    <div>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  </div>;
}

function localPreferenceHints(briefPrompt = "") {
  const lower = String(briefPrompt || "").toLowerCase();
  const hints = [];
  if (/\bright[-\s]?wing\b|\bconservative\b|\bgop\b|\brepublican\b/.test(lower)) hints.push("preserve the right-leaning/conservative frame");
  if (/\bleft[-\s]?wing\b|\bprogressive\b|\bdemocrat(ic)?\b|\bdems\b/.test(lower)) hints.push("preserve stated political-party or ideological preferences");
  if (/\bprefer\b|\balign\b|\bavoid\b|\bdon't\b|\bnot just\b|\bmainly\b|\bfocus\b|\blook mainly\b/.test(lower)) hints.push("carry over explicit preferences, exclusions, and source priorities");
  if (/\blameness\b|\blame\b|\babsurd\b|\bfailure\b|\bweakness\b/.test(lower)) hints.push("preserve critique angles as source-grounded sentiment/framing");
  if (/\bx\b|\btwitter\b|\breddit\b/.test(lower)) hints.push("prioritize requested X/Reddit sentiment");
  return hints;
}

function defaultCalendarBriefSection() {
  return {
    key: "calendarAgenda",
    label: "Today's Calendar",
    enabled: true,
    instruction: "Use today's connected calendar events to prepare me for the day: meetings, schedule shape, likely prep needs, conflicts, sequencing, focus blocks, and follow-up reminders. Treat calendar entries as private schedule context, not news.",
    promptTarget: "standard",
    promptRefId: "",
  };
}

function putCalendarBriefSectionFirst(sections = [], addIfConnected = false) {
  const usableSections = Array.isArray(sections) ? sections.filter(Boolean) : [];
  const existing = usableSections.find((section) => section?.key === "calendarAgenda");
  if (!existing && !addIfConnected) return usableSections;
  const calendarSection = existing ? { ...defaultCalendarBriefSection(), ...existing, key: "calendarAgenda" } : defaultCalendarBriefSection();
  return [calendarSection, ...usableSections.filter((section) => section?.key !== "calendarAgenda")];
}

function localBriefSetupDraft(briefPrompt = "", current = {}) {
  const owner = current.ownerName || defaultOwnerName;
  const prompt = String(briefPrompt || "").toLowerCase();
  const preferenceHints = localPreferenceHints(briefPrompt);
  const preferenceText = preferenceHints.length ? ` Preserve these preferences: ${preferenceHints.join("; ")}.` : "";
  const topics = [];
  if (prompt.includes("crypto")) topics.push("crypto");
  if (prompt.includes("ai")) topics.push("AI");
  if (prompt.includes("politic")) topics.push("politics");
  if (prompt.includes("movie") || prompt.includes("hollywood")) topics.push("movies/Hollywood");
  if (prompt.includes("market")) topics.push("markets");
  if (prompt.includes("reddit")) topics.push("Reddit sentiment");
  if (prompt.includes("x ") || prompt.includes("twitter")) topics.push("X sentiment");
  const topicText = topics.length ? topics.join(", ") : "the topics in the brief request";
  return {
    ...current,
    ownerName: owner,
    productName: current.productName || "Pillar Time",
    audienceContext: `A private daily brief for ${owner} focused on ${topicText}. Use only source items published today, with enough context to understand why they matter.${preferenceText}`,
    voiceRules: `Natural, direct, and useful. Prefer plain English, sharp bullets, and concrete takeaways. Avoid corporate stiffness, filler, fake certainty, and false-balance flattening of stated preferences.${preferenceHints.length ? " Keep stated worldview/taste/source preferences visible when source evidence supports them." : ""}`,
    sections: putCalendarBriefSectionFirst([
      { key: "topSignals", label: "Top Signals", enabled: true, instruction: "Lead with the most important items published today. Keep each item clear, specific, and tied to why it matters.", promptTarget: "standard", promptRefId: "" },
      { key: "sentimentRead", label: "Sentiment Read", enabled: true, instruction: `Summarize what people seem to be reacting to on X, Reddit, and other configured sources. Separate real signal from noise.${preferenceHints.length ? " Preserve the user's stated worldview/source preferences in the read when grounded in today's sources." : ""}`, promptTarget: "standard", promptRefId: "" },
      { key: "politicalRace", label: "Political Race", enabled: prompt.includes("politic") || prompt.includes("race"), instruction: `Cover meaningful political-race developments, polling signals, campaign moves, and narrative shifts from today.${preferenceHints.length ? " Keep explicit political framing preferences intact instead of smoothing them into generic neutrality." : ""}`, promptTarget: "standard", promptRefId: "" },
      { key: "industryMotion", label: "Industry Motion", enabled: true, instruction: "Explain production, market, industry, or business implications behind the day’s items, not just gossip or surface chatter.", promptTarget: "standard", promptRefId: "" },
      { key: "marketImpact", label: "Market Impact", enabled: prompt.includes("market") || prompt.includes("crypto"), instruction: "Call out how the day’s events may affect markets, risk appetite, crypto, AI, or broader sentiment.", promptTarget: "standard", promptRefId: "" },
      { key: "whatToWatch", label: "What To Watch Next", enabled: true, instruction: "End with the next developments, questions, or indicators worth watching over the next 24-72 hours.", promptTarget: "standard", promptRefId: "" },
      { key: "sourceEvidence", label: "Source Evidence", enabled: true, instruction: "List the source items used, with links where available. Only include items published today.", promptTarget: "standard", promptRefId: "" },
    ], current.calendarConnected),
  };
}

function ElevenLabsSetup({ state, mutate, refresh, compact = false, onSkip, onSaved }) {
  const [apiKey, setApiKey] = React.useState("");
  const [voices, setVoices] = React.useState(state.tts?.voiceId ? [{ id: state.tts.voiceId, name: state.tts.voiceName || state.tts.voiceId }] : []);
  const [voiceId, setVoiceId] = React.useState(state.tts?.voiceId || "");
  const [modelId, setModelId] = React.useState(state.tts?.modelId || "eleven_multilingual_v2");
  const [telegramAutoSend, setTelegramAutoSend] = React.useState(!!state.tts?.telegramAutoSend);
  const [enabled, setEnabled] = React.useState(!!state.tts?.enabled);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const selectedVoice = voices.find((voice) => voice.id === voiceId);
  const detectVoicesDisabledReason = busy
    ? "Audio setup is busy"
    : !apiKey && !state.tts?.apiKeySaved
      ? "Paste an ElevenLabs API key first"
      : "";
  const previewDisabledReason = busy
    ? "Audio setup is busy"
    : !voiceId
      ? "Choose or detect a voice first"
      : "";
  const saveAudioDisabledReason = busy
    ? "Audio setup is busy"
    : !voiceId && !apiKey && !state.tts?.apiKeySaved
      ? "Paste an API key or choose a voice before saving"
      : "";
  const fetchVoices = async () => {
    const result = await api("/api/tts/voices", { method: "POST", body: JSON.stringify({ apiKey }) });
    const nextVoices = result.voices || [];
    setVoices(nextVoices);
    const nextVoiceId = nextVoices.some((voice) => voice.id === voiceId) ? voiceId : nextVoices[0]?.id || "";
    if (nextVoiceId) setVoiceId(nextVoiceId);
    await refresh?.();
    return { voices: nextVoices, voiceId: nextVoiceId };
  };
  const detectVoices = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await fetchVoices();
      setMessage(result.voices.length ? `Detected ${result.voices.length} voice${result.voices.length === 1 ? "" : "s"}.` : "No voices returned for this account.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async (event) => {
    event?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      let nextVoiceId = voiceId;
      let nextVoiceName = selectedVoice?.name || state.tts?.voiceName || "";
      if (!nextVoiceId && (apiKey || state.tts?.apiKeySaved)) {
        const detected = await fetchVoices();
        const detectedVoice = detected.voices.find((voice) => voice.id === detected.voiceId);
        nextVoiceId = detected.voiceId;
        nextVoiceName = detectedVoice?.name || nextVoiceName;
      }
      if (!nextVoiceId) throw new Error("Choose a voice or detect voices before saving ElevenLabs audio.");
      await mutate("/api/tts", {
        apiKey,
        voiceId: nextVoiceId,
        voiceName: nextVoiceName,
        modelId,
        telegramAutoSend,
        enabled: enabled || !!nextVoiceId,
      }, "PATCH");
      setApiKey("");
      setMessage("ElevenLabs audio saved.");
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const preview = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await api("/api/tts/preview", {
        method: "POST",
        body: JSON.stringify({
          apiKey,
          voiceId,
          modelId,
          text: "This is your Pillar Time audio preview. Your daily brief can be read aloud with this ElevenLabs voice.",
        }),
      });
      setPreviewUrl(result.audio.url);
      new Audio(result.audio.url).play().catch(() => {});
      setMessage("Preview generated.");
      await refresh?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return <form className={`setup-card form ${compact ? "compact" : ""}`} onSubmit={save}>
    <div className="setup-card-head">
      <span className="source-icon-box"><Icon name="volume" /></span>
      <div><h3>ElevenLabs audio</h3><p>{setupLinks.elevenlabs.helper}</p></div>
      <Badge tone={state.tts?.status === "ready" ? "ok" : "muted"}>{state.tts?.status === "ready" ? "Ready" : "Optional"}</Badge>
    </div>
    <div className="setup-link-row">
      <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.elevenlabs.keyUrl)}>Get API key</Button>
      <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.elevenlabs.docsUrl)}>TTS docs</Button>
    </div>
    <Field label="ElevenLabs API key" type="password" value={apiKey} onChange={setApiKey} placeholder={state.tts?.apiKeySaved ? "Saved. Paste a new key to replace it." : "Paste ElevenLabs API key"} />
    <div className="row">
      <Button type="button" icon="search" onClick={detectVoices} disabled={!!detectVoicesDisabledReason} title={detectVoicesDisabledReason || "Detect ElevenLabs voices"}>{busy ? "Checking..." : "Detect voices"}</Button>
      <label className="check"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Enable audio brief</label>
    </div>
    {voices.length > 0 && <Select label="Voice" value={voiceId} onChange={setVoiceId} options={voices.map((voice) => ({ value: voice.id, label: `${voice.name}${voice.category ? ` · ${voice.category}` : ""}` }))} />}
    <Select label="Model" value={modelId} onChange={setModelId} options={[
      { value: "eleven_multilingual_v2", label: "Multilingual v2" },
      { value: "eleven_turbo_v2_5", label: "Turbo v2.5" },
      { value: "eleven_flash_v2_5", label: "Flash v2.5" },
      { value: "eleven_v3", label: "Eleven v3" },
    ]} />
    <label className="check"><input type="checkbox" checked={telegramAutoSend} onChange={(event) => setTelegramAutoSend(event.target.checked)} /> Auto-send audio after Telegram text brief</label>
    {previewUrl && <audio controls src={previewUrl} className="audio-preview" />}
    {message && <p className={message.includes("saved") || message.includes("Detected") || message.includes("Preview") ? "ok-text" : "warn-text"}>{message}</p>}
    <div className="row">
      {onSkip && <Button type="button" onClick={onSkip}>Skip audio</Button>}
      <Button type="button" icon="volume" onClick={preview} disabled={!!previewDisabledReason} title={previewDisabledReason || "Play audio preview"}>Play preview</Button>
      <Button icon="save" kind="primary" disabled={!!saveAudioDisabledReason} title={saveAudioDisabledReason || "Save audio settings"}>{busy ? "Saving..." : "Save audio"}</Button>
    </div>
  </form>;
}

function Onboarding({ state, mutate, refresh }) {
  const steps = ["welcome", "profile", "today", "reminders", "reviews", "model", "intent", "setup", "linear", "calendar", "audio", "telegram", "schedule", "review"];
  const readiness = state.onboarding.readiness || {};
  const savedOwnerName = state.briefConfig?.ownerName || "";
  const hasSavedFirstName = !isDefaultOwnerName(savedOwnerName);
  const initialIncomplete = () => {
    if (!hasSavedFirstName) return "welcome";
    if (!readiness.scheduleSet) return "schedule";
    return "review";
  };
  const normalizeOnboardingStep = (value) => {
    if (value === "sources" || value === "access" || value === "perspectives") return "linear";
    return steps.includes(value) ? value : "welcome";
  };
  const [step, setStep] = React.useState(!hasSavedFirstName ? "welcome" : state.onboarding.currentStep === "complete" ? initialIncomplete() : normalizeOnboardingStep(state.onboarding.currentStep || "welcome"));
  const [model, setModel] = React.useState({ enabled: true, provider: state.model.provider || "openai", model: state.model.model || defaultModelForProvider(state.model.provider || "openai"), apiKey: "", baseUrl: state.model.baseUrl || "" });
  const [modelOptions, setModelOptions] = React.useState(state.model.model ? [state.model.model] : []);
  const [modelOptionsProvider, setModelOptionsProvider] = React.useState(state.model.provider || "openai");
  const [modelMessage, setModelMessage] = React.useState("");
  const [detecting, setDetecting] = React.useState(false);
  const [returnAfterModel, setReturnAfterModel] = React.useState("");
  const [firstName, setFirstName] = React.useState(hasSavedFirstName ? savedOwnerName : "");
  const firstNameReady = !isDefaultOwnerName(firstName.trim() || savedOwnerName);
  const reviewReadiness = { ...readiness, ownerNameReady: firstNameReady };
  const canComplete = reviewReadiness.ownerNameReady && reviewReadiness.scheduleSet;
  const firstIncomplete = () => {
    if (!reviewReadiness.ownerNameReady) return "welcome";
    if (!reviewReadiness.scheduleSet) return "schedule";
    return "review";
  };
  const [nameMessage, setNameMessage] = React.useState("");
  const [savingFirstName, setSavingFirstName] = React.useState(false);
  const [operatingManual, setOperatingManual] = React.useState(state.time?.preferences?.operatingManual || "");
  const [starterCommitment, setStarterCommitment] = React.useState("");
  const [starterMessage, setStarterMessage] = React.useState("");
  const [reviewMessage, setReviewMessage] = React.useState("");
  const [onboardingActionMessage, setOnboardingActionMessage] = React.useState("");
  const [briefPrompt, setBriefPrompt] = React.useState(state.onboarding.briefPrompt || "");
  const [briefDraft, setBriefDraft] = React.useState({ ...(state.onboarding.briefConfigDraft || state.briefConfig), ownerName: hasSavedFirstName ? savedOwnerName : "" });
  const [draftingBriefSetup, setDraftingBriefSetup] = React.useState(false);
  const [briefDraftMessage, setBriefDraftMessage] = React.useState("");
  const [suggestions, setSuggestions] = React.useState(state.onboarding.sourceSuggestions || []);
  const [selected, setSelected] = React.useState(() => new Set((state.onboarding.sourceSuggestions || []).map((s) => s.id)));
  const [pendingSourceIds, setPendingSourceIds] = React.useState(new Set());
  const [sourceMessage, setSourceMessage] = React.useState("");
  const [suggestingSources, setSuggestingSources] = React.useState(false);
  const [sourceLoadingText, setSourceLoadingText] = React.useState("Gathering possible sources...");
  const [sourceFoundCount, setSourceFoundCount] = React.useState(0);
  const [savingSources, setSavingSources] = React.useState(false);
  const [xConnector, setXConnector] = React.useState({ enabled: true, apiKey: "" });
  const [xMessage, setXMessage] = React.useState("");
  const [ffmpegStatus, setFfmpegStatus] = React.useState(state.runtime?.ffmpeg || null);
  const [ffmpegBusy, setFfmpegBusy] = React.useState(false);
  const [ffmpegMessage, setFfmpegMessage] = React.useState("");
  const [sttStatus, setSttStatus] = React.useState(state.runtime?.stt || null);
  const [sttBusy, setSttBusy] = React.useState(false);
  const [sttMessage, setSttMessage] = React.useState("");
  const [calendarMessage, setCalendarMessage] = React.useState("");
  const [linearConnector, setLinearConnector] = React.useState({ enabled: true, apiKey: "" });
  const [linearMessage, setLinearMessage] = React.useState("");
  const [perspectivePrompt, setPerspectivePrompt] = React.useState("");
  const [perspectiveDrafts, setPerspectiveDrafts] = React.useState(state.briefConfig?.perspectiveLenses || []);
  const [perspectiveMessage, setPerspectiveMessage] = React.useState("");
  const [generatingPerspectives, setGeneratingPerspectives] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const audioContextRef = React.useRef(null);
  const sourceRef = React.useRef(null);
  const processorRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const stopRecorderRef = React.useRef(null);
  const timezone = state.briefConfig.deliveryTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";
  const timezones = timezoneOptions(timezone);
  const googleCalendarConnected = state.connectors?.googleCalendar?.status === "ready";
  const linearConnected = state.connectors?.linear?.status === "ready";
  const briefPromptTooShort = briefPrompt.trim().length < 20;
  const generateBriefSetupDisabledReason = draftingBriefSetup
    ? "Brief setup draft is already being generated"
    : briefPromptTooShort
      ? "Describe your brief request in at least 20 characters"
      : "";
  const applyBriefSetupDisabledReason = draftingBriefSetup
    ? "Wait for the draft to finish"
    : !(briefDraft?.sections || []).length
      ? "Generate a brief setup draft first"
      : "";
  const suggestSourcesDisabledReason = suggestingSources
    ? "Source suggestions are already being gathered"
    : briefPromptTooShort
      ? "Describe your brief request in at least 20 characters"
      : "";
  const addSelectedSourcesDisabledReason = savingSources
    ? "Sources are being added"
    : suggestingSources
      ? "Wait for source suggestions to finish"
      : !suggestions.length
        ? "Generate source suggestions first"
        : "";
  const perspectivePromptTooShort = perspectivePrompt.trim().length < 8;
  const generatePerspectivesDisabledReason = generatingPerspectives
    ? "Perspective lenses are already being generated"
    : perspectivePromptTooShort
      ? "Describe the perspectives you want in at least 8 characters"
      : "";
  const savePerspectivesDisabledReason = generatingPerspectives
    ? "Wait for perspective generation to finish"
    : !perspectiveDrafts.length
      ? "Generate or add perspective lenses first"
      : "";
  const go = async (next) => {
    const normalized = normalizeOnboardingStep(next);
    setStep(normalized);
    await mutate("/api/onboarding", { currentStep: normalized, briefPrompt, sourceSuggestions: suggestions, briefConfigDraft: briefDraft }, "PATCH");
  };
  React.useEffect(() => {
    setFfmpegStatus(state.runtime?.ffmpeg || null);
  }, [state.runtime?.ffmpeg]);
  React.useEffect(() => {
    setSttStatus(state.runtime?.stt || null);
  }, [state.runtime?.stt]);
  React.useEffect(() => {
    setSttStatus(state.runtime?.stt || null);
  }, [state.runtime?.stt]);
  React.useEffect(() => {
    setSttStatus(state.runtime?.stt || null);
  }, [state.runtime?.stt]);
  React.useEffect(() => {
    if (googleCalendarConnected && calendarMessage.includes("consent opened")) {
      setCalendarMessage("Google Calendar is connected.");
    }
  }, [calendarMessage, googleCalendarConnected]);
  const saveFirstName = async () => {
    const ownerName = firstName.trim();
    if (!ownerName) {
      setNameMessage("Enter your first name to personalize the brief.");
      return false;
    }
    setSavingFirstName(true);
    setNameMessage("");
    try {
      const nextConfig = { ...state.briefConfig, ownerName };
      await mutate("/api/brief-config", nextConfig, "PATCH");
      const nextDraft = { ...(briefDraft || nextConfig), ownerName };
      setBriefDraft(nextDraft);
      await mutate("/api/onboarding", { currentStep: "model", briefPrompt, sourceSuggestions: suggestions, briefConfigDraft: nextDraft }, "PATCH");
      return true;
    } catch (error) {
      setNameMessage(error.message || "Could not save your first name.");
      return false;
    } finally {
      setSavingFirstName(false);
    }
  };
  const saveExecutiveProfile = async (event) => {
    event.preventDefault();
    const ownerName = firstName.trim();
    if (!ownerName) {
      setNameMessage("Enter the executive's first name before continuing.");
      return;
    }
    setSavingFirstName(true);
    setNameMessage("");
    try {
      await mutate("/api/brief-config", {
        ...state.briefConfig,
        ownerName,
        audienceContext: state.briefConfig.audienceContext || `A private executive operating system for ${ownerName}, focused on commitments, calendar pressure, preparation, reminders, reviews, and source-grounded intelligence.`,
        voiceRules: state.briefConfig.voiceRules || "Be concise, explicit about uncertainty, and distinguish facts, commitments, suggestions, and approvals.",
      }, "PATCH");
      await mutate("/api/time/preferences", {
        ...(state.time?.preferences || {}),
        operatingManual,
      }, "PATCH");
      await go("today");
    } catch (error) {
      setNameMessage(error.message || "Could not save executive profile.");
    } finally {
      setSavingFirstName(false);
    }
  };
  const addStarterCommitment = async (event) => {
    event.preventDefault();
    if (!starterCommitment.trim()) {
      setStarterMessage("Write one commitment or priority first.");
      return;
    }
    setStarterMessage("");
    try {
      const title = starterCommitment.trim();
      await api("/api/time/tasks", { method: "POST", body: JSON.stringify({ title, source: "onboarding", leverageCategory: "deepWork", priority: "high" }) });
      await api("/api/time/commitments", { method: "POST", body: JSON.stringify({ title, notes: "Added during onboarding.", rank: Math.min(3, (state.time?.commitments || []).length + 1) }) });
      setStarterCommitment("");
      setStarterMessage("Added to Planner and Today’s Three.");
      await refresh();
    } catch (error) {
      setStarterMessage(error.message || "Could not add commitment.");
    }
  };
  const saveReminderDefaults = async (patch = {}) => {
    try {
      await mutate("/api/time/preferences", {
        ...(state.time?.preferences || {}),
        ...patch,
      }, "PATCH");
    } catch (error) {
      setStarterMessage(error.message || "Could not save reminder settings.");
    }
  };
  const toggleReview = async (review) => {
    setReviewMessage("");
    try {
      await mutate(`/api/time/reviews/${review.id}`, { enabled: !review.enabled }, "PATCH");
      setReviewMessage(`${review.title} ${review.enabled ? "disabled" : "enabled"}.`);
    } catch (error) {
      setReviewMessage(error.message || "Could not update review.");
    }
  };
  const detectModels = async () => {
    setDetecting(true);
    setModelMessage("");
    try {
      const providerCredential = state.model.providerCredentials?.[model.provider]?.credentialStatus || (model.provider === state.model.provider ? state.model.credentialStatus : "missing");
      if (!model.apiKey && providerCredential === "missing") {
        setModelMessage("Enter an API key to discover models for this provider.");
        return;
      }
      const requestProvider = model.provider;
      const result = await api("/api/model/models", { method: "POST", body: JSON.stringify({ ...model, provider: requestProvider }) });
      if (result.provider && result.provider !== requestProvider) return;
      setModelOptions(result.models || []);
      setModelOptionsProvider(requestProvider);
      if (result.models?.length) {
        setModel((current) => ({ ...current, model: current.provider === requestProvider && current.model ? current.model : defaultModelForProvider(requestProvider) || result.models[0] }));
        setModelMessage("Key works. Choose a model and save.");
      } else {
        setModelMessage(result.error || "No models returned. Enter a model name manually.");
      }
    } catch (error) {
      setModelMessage(error.message);
    } finally {
      setDetecting(false);
    }
  };
  React.useEffect(() => {
    if (step !== "model" || !model.apiKey || model.apiKey.length < 12) return;
    const timer = setTimeout(() => detectModels(), 700);
    return () => clearTimeout(timer);
  }, [step, model.provider, model.apiKey]);
  const saveModel = async (event) => {
    event.preventDefault();
    setModelMessage("");
    try {
      await mutate("/api/model", { ...model, enabled: true }, "PATCH");
      setModelMessage("Model saved.");
      if (returnAfterModel) {
        const next = returnAfterModel;
        setReturnAfterModel("");
        await go(next);
      } else {
        await go("intent");
      }
    } catch (error) {
      setModelMessage(error.message);
    }
  };
  const updateDraftSection = (index, patch) => {
    setBriefDraft((current) => ({
      ...current,
      sections: (current.sections || []).map((section, i) => i === index ? { ...section, ...patch } : section),
    }));
  };
  const generateBriefSetupDraft = async () => {
    setDraftingBriefSetup(true);
    setBriefDraftMessage("Building a brief setup draft...");
    try {
      await mutate("/api/onboarding", { currentStep: "setup", briefPrompt, sourceSuggestions: suggestions, briefConfigDraft: briefDraft }, "PATCH");
      setStep("setup");
      const result = await api("/api/onboarding/brief-setup-draft", { method: "POST", body: JSON.stringify({ briefPrompt, ownerName: firstName.trim() || state.briefConfig.ownerName }) });
      setBriefDraft(result.draft || state.briefConfig);
      setBriefDraftMessage(result.fallback
        ? `Built a starter setup because the model draft was incomplete. Review and apply ${(result.draft?.sections || []).length} sections.`
        : `Drafted ${(result.draft?.sections || []).length} brief sections. Review and apply them.`);
      await refresh();
    } catch (error) {
      if (/not found|cannot\s+(post|get)|404/i.test(error.message || "")) {
        const draft = localBriefSetupDraft(briefPrompt, { ...state.briefConfig, ownerName: firstName.trim() || state.briefConfig.ownerName, calendarConnected: googleCalendarConnected });
        setBriefDraft(draft);
        setBriefDraftMessage(`Built a starter setup locally. Review and apply ${draft.sections.length} sections.`);
      } else {
        setBriefDraftMessage(error.message);
      }
    } finally {
      setDraftingBriefSetup(false);
    }
  };
  const applyBriefSetupDraft = async () => {
    setBriefDraftMessage("");
    const savedOwner = firstName.trim() || state.briefConfig.ownerName;
    const draftToApply = {
      ...briefDraft,
      ownerName: !isDefaultOwnerName(savedOwner) ? savedOwner : briefDraft?.ownerName,
    };
    try {
      await api("/api/onboarding/brief-setup-apply", { method: "POST", body: JSON.stringify({ draft: draftToApply }) });
      setBriefDraft(draftToApply);
      await refresh();
      setBriefDraftMessage("Brief setup saved.");
      await go("linear");
    } catch (error) {
      if (/not found|cannot\s+(post|get)|404/i.test(error.message || "")) {
        try {
          await mutate("/api/brief-config", draftToApply, "PATCH");
          await mutate("/api/onboarding", { currentStep: "linear", briefPrompt, sourceSuggestions: [], briefConfigDraft: draftToApply }, "PATCH");
          setBriefDraftMessage("Brief setup saved.");
          await go("linear");
        } catch (fallbackError) {
          setBriefDraftMessage(fallbackError.message);
        }
      } else {
        setBriefDraftMessage(error.message);
      }
    }
  };
  const suggestSources = async () => {
    setStep("sources");
    setSuggestingSources(true);
    setSourceMessage("");
    setSourceFoundCount(0);
    const loadingPhrases = [
      "Gathering possible sources...",
      "Checking source types...",
      "Matching sources to the brief...",
      "Scoring useful candidates...",
    ];
    let phraseIndex = 0;
    const phraseTimer = setInterval(() => {
      phraseIndex = Math.min(loadingPhrases.length - 1, phraseIndex + 1);
      setSourceLoadingText(loadingPhrases[phraseIndex]);
    }, 1400);
    try {
      await mutate("/api/onboarding", { currentStep: "sources", briefPrompt, sourceSuggestions: suggestions, briefConfigDraft: briefDraft }, "PATCH");
      const result = await api("/api/onboarding/source-suggestions", { method: "POST", body: JSON.stringify({ briefPrompt }) });
      const nextSuggestions = result.suggestions || [];
      const suggestionState = result.state || state;
      const blockedCount = nextSuggestions.filter((source) => !sourceReadyForOnboarding(source, suggestionState)).length;
      setSuggestions(nextSuggestions);
      setSelected(new Set(nextSuggestions.map((s) => s.id)));
      setSourceLoadingText("Sources found.");
      await new Promise((resolve) => {
        let count = 0;
        const countTimer = setInterval(() => {
          count += 1;
          setSourceFoundCount(Math.min(count, nextSuggestions.length));
          if (count >= nextSuggestions.length) {
            clearInterval(countTimer);
            resolve();
          }
        }, 180);
      });
      setSourceMessage(`Found ${nextSuggestions.length} source${nextSuggestions.length === 1 ? "" : "s"}. ${blockedCount ? `${blockedCount} will walk you through setup before they are added.` : "Review the suggestions, then add the ones you want."}`);
      await refresh();
    } catch (error) {
      setSourceMessage(error.message);
    } finally {
      clearInterval(phraseTimer);
      setSuggestingSources(false);
    }
  };
  const speechSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && !!(window.AudioContext || window.webkitAudioContext);
  React.useEffect(() => () => {
    stopRecorderRef.current?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    audioContextRef.current?.close?.();
  }, []);
  const listenForPerspectivePrompt = async () => {
    if (listening) {
      stopRecorderRef.current?.();
      return;
    }
    if (!speechSupported) {
      setPerspectiveMessage("Voice input is not available in this WebView. You can type the perspectives instead.");
      return;
    }
    setPerspectiveMessage("Listening. Click Stop when you are done.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      sourceRef.current = source;
      processorRef.current = processor;
      processor.onaudioprocess = (event) => {
        chunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      stopRecorderRef.current = async () => {
        const stopCurrent = stopRecorderRef.current;
        stopRecorderRef.current = null;
        if (!stopCurrent) return;
        processor.disconnect();
        source.disconnect();
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        await audioContext.close().catch(() => {});
        audioContextRef.current = null;
        const blob = encodeMonoWav(chunksRef.current, audioContext.sampleRate);
        chunksRef.current = [];
        if (!blob.size) {
          setPerspectiveMessage("No audio was recorded. You can try again or type the request.");
          return;
        }
        setPerspectiveMessage("Transcribing voice input...");
        try {
          const response = await fetch("/api/audio/transcribe", { method: "POST", headers: { "Content-Type": "audio/wav" }, body: blob });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || "Could not transcribe voice input.");
          const transcript = String(payload.transcript || "").trim();
          if (!transcript) throw new Error("Transcription returned no text. You can try again or type the request.");
          setPerspectivePrompt((current) => `${current ? `${current} ` : ""}${transcript}`.trim());
          setPerspectiveMessage("Voice input added.");
        } catch (error) {
          setPerspectiveMessage(error.message || "Voice input stopped. You can keep typing instead.");
        }
      };
      setListening(true);
    } catch (error) {
      setListening(false);
      setPerspectiveMessage(error?.name === "NotAllowedError" ? "Microphone permission was denied. You can enable it in macOS Privacy settings or type the request." : error.message || "Voice input stopped. You can keep typing instead.");
    }
  };
  const updatePerspectiveDraft = (index, patch) => setPerspectiveDrafts((current) => current.map((lens, i) => i === index ? { ...lens, ...patch } : lens));
  const generatePerspectives = async () => {
    setGeneratingPerspectives(true);
    setPerspectiveMessage("");
    try {
      const result = await api("/api/perspective-lenses/generate", { method: "POST", body: JSON.stringify({ prompt: perspectivePrompt }) });
      setPerspectiveDrafts(result.lenses || []);
      setPerspectiveMessage(`Generated ${(result.lenses || []).length} perspective lens${(result.lenses || []).length === 1 ? "" : "es"}.`);
    } catch (error) {
      setPerspectiveMessage(error.message || "Could not generate perspective lenses.");
    } finally {
      setGeneratingPerspectives(false);
    }
  };
  const savePerspectives = async (nextStep = "sources") => {
    try {
      await mutate("/api/brief-config", { ...state.briefConfig, perspectiveLenses: perspectiveDrafts }, "PATCH");
      setPerspectiveMessage("Perspective lenses saved.");
      if (nextStep === "sources") await suggestSources();
      else await go(nextStep);
    } catch (error) {
      setPerspectiveMessage(error.message || "Could not save perspective lenses.");
    }
  };
  const addSelectedSources = async () => {
    const chosen = suggestions.filter((source) => selected.has(source.id));
    if (!chosen.length) {
      setSourceMessage("Select at least one source.");
      return;
    }
    const blocked = chosen.filter((source) => !sourceReadyForOnboarding(source, state));
    if (blocked.length) {
      setPendingSourceIds(new Set(chosen.map((source) => source.id)));
      setSourceMessage(`${blocked.length} selected source${blocked.length === 1 ? "" : "s"} need setup first.`);
      await go("access");
      return;
    }
    await saveChosenSources(chosen);
  };
  const saveChosenSources = async (chosen) => {
    setSavingSources(true);
    setSourceMessage("");
    try {
      for (const source of chosen) {
        await api("/api/sources", { method: "POST", body: JSON.stringify({
          ...source,
          config: source.config,
        }) });
      }
      await refresh();
      setSourceMessage(`${chosen.length} source${chosen.length === 1 ? "" : "s"} added.`);
      setPendingSourceIds(new Set());
      await go("calendar");
    } catch (error) {
      setSourceMessage(error.message);
    } finally {
      setSavingSources(false);
    }
  };
  const pendingSources = suggestions.filter((source) => pendingSourceIds.has(source.id));
  const pendingPrereqKeys = [...new Set(pendingSources.flatMap((source) => sourcePrerequisiteKeys(source, state)))];
  const blockedPendingSources = pendingSources.filter((source) => !sourceReadyForOnboarding(source, state));
  const saveXAccess = async (event) => {
    event?.preventDefault();
    setXMessage("");
    try {
      await mutate("/api/connectors/x", { ...xConnector, enabled: true }, "PATCH");
      setXConnector({ enabled: true, apiKey: "" });
      setXMessage("X API token saved.");
    } catch (error) {
      setXMessage(error.message || "Could not save X API token.");
    }
  };
  const testLinearAccess = async () => {
    setLinearMessage("");
    try {
      const result = await api("/api/linear/test", { method: "POST", body: JSON.stringify({ apiKey: linearConnector.apiKey }) });
      setLinearConnector({ enabled: true, apiKey: "" });
      setLinearMessage(`Linear is ready${result.viewer?.displayName || result.viewer?.name ? ` for ${result.viewer.displayName || result.viewer.name}` : ""}.`);
      await refresh();
    } catch (error) {
      setLinearMessage(error.message || "Linear test failed.");
      await refresh();
    }
  };
  const saveLinearAccess = async () => {
    setLinearMessage("");
    if (!linearConnector.apiKey && !state.connectors?.linear?.apiKeySaved && state.connectors?.linear?.credentialStatus !== "env") {
      setLinearMessage("Paste a Linear personal API key, or skip Linear for now.");
      return;
    }
    try {
      await mutate("/api/connectors/linear", { ...linearConnector, enabled: true }, "PATCH");
      setLinearConnector({ enabled: true, apiKey: "" });
      setLinearMessage("Linear connector saved.");
    } catch (error) {
      setLinearMessage(error.message || "Could not save Linear connector.");
    }
  };
  const checkFfmpeg = async () => {
    setFfmpegBusy(true);
    setFfmpegMessage("");
    try {
      const result = await api("/api/runtime/ffmpeg");
      setFfmpegStatus(result.ffmpeg);
      await refresh();
    } catch (error) {
      setFfmpegMessage(error.message);
    } finally {
      setFfmpegBusy(false);
    }
  };
  const installFfmpeg = async () => {
    const ok = window.confirm("Install FFmpeg with Homebrew now? Pillar Time will run a local Homebrew install so podcast audio can be processed.");
    if (!ok) return;
    setFfmpegBusy(true);
    setFfmpegMessage("Installing FFmpeg with Homebrew...");
    try {
      const result = await api("/api/runtime/ffmpeg/install", { method: "POST", body: JSON.stringify({ consent: true }) });
      setFfmpegStatus(result.ffmpeg);
      setFfmpegMessage(result.message || "FFmpeg install started. Re-check when it finishes.");
      await refresh();
    } catch (error) {
      setFfmpegMessage(error.message);
      await checkFfmpeg();
    } finally {
      setFfmpegBusy(false);
    }
  };
  const checkStt = async () => {
    setSttBusy(true);
    setSttMessage("");
    try {
      const result = await api("/api/runtime/stt");
      setSttStatus(result.stt);
      await refresh();
    } catch (error) {
      setSttMessage(error.message);
    } finally {
      setSttBusy(false);
    }
  };
  const installSttModel = async () => {
    const ok = window.confirm("Download the local Whisper model now? This stores the speech-to-text model on this Mac for voice input and transcription.");
    if (!ok) return;
    setSttBusy(true);
    setSttMessage("Downloading Whisper model...");
    try {
      const result = await api("/api/runtime/stt/model/install", { method: "POST", body: JSON.stringify({}) });
      setSttStatus(result.stt);
      setSttMessage(result.message || "Whisper model downloaded.");
      await refresh();
    } catch (error) {
      setSttMessage(error.message);
      await checkStt();
    } finally {
      setSttBusy(false);
    }
  };
  const skipPrerequisiteSources = async (key) => {
    const shouldSkip = (source) => {
      const keys = sourcePrerequisiteKeys(source, state);
      if (key === "transcription") return keys.includes("ffmpeg") || keys.includes("transcriptionModel");
      return keys.includes(key);
    };
    const remaining = pendingSources.filter((source) => !shouldSkip(source));
    const nextIds = new Set(remaining.map((source) => source.id));
    setPendingSourceIds(nextIds);
    setSelected(nextIds);
    setSourceMessage(`Skipped ${key === "x" ? "X" : "transcription-dependent"} sources.`);
    if (!remaining.length) {
      await go("sources");
    }
  };
  const continueAfterAccess = async () => {
    const ready = pendingSources.filter((source) => sourceReadyForOnboarding(source, state));
    const blocked = pendingSources.filter((source) => !sourceReadyForOnboarding(source, state));
    if (blocked.length) {
      setSourceMessage(`${blocked.length} selected source${blocked.length === 1 ? "" : "s"} still need setup. Skip those sources or finish setup to continue.`);
      return;
    }
    await saveChosenSources(ready);
  };
  const startCalendarOAuth = async () => {
    setCalendarMessage("");
    try {
      const result = await api("/api/google-calendar/oauth/start", { method: "POST", body: JSON.stringify({}) });
      await refresh();
      setCalendarMessage("Google consent opened in your browser. When it says connected, return here; Pillar Time will update the status automatically.");
      await openExternalUrl(result.authUrl);
    } catch (error) {
      setCalendarMessage(error.message || "Could not start Google Calendar connection.");
    }
  };
  const refreshCalendarStatus = async () => {
    setCalendarMessage("");
    try {
      if (googleCalendarConnected) {
        await api("/api/google-calendar/calendars", { method: "POST", body: JSON.stringify({}) });
        setCalendarMessage("Google Calendar is connected. Brief Setup includes Today's Calendar at the top.");
      } else {
        await api("/api/google-calendar/test", { method: "POST", body: JSON.stringify({}) });
        setCalendarMessage("Google Calendar is connected. Brief Setup includes Today's Calendar at the top.");
      }
      await refresh();
    } catch (error) {
      setCalendarMessage(error.message || "Google Calendar is not connected yet.");
      await refresh();
    }
  };
  const saveDelivery = async (patch) => {
    await mutate("/api/brief-config", { ...state.briefConfig, deliveryTimezone: timezone, ...patch }, "PATCH");
  };
  const complete = async () => {
    setOnboardingActionMessage("");
    try {
      await mutate("/api/onboarding/complete", {});
    } catch (error) {
      setOnboardingActionMessage(error.message || "Could not finish onboarding. Try again or finish later.");
    }
  };
  const skipOnboarding = async () => {
    setOnboardingActionMessage("");
    try {
      await mutate("/api/onboarding/skip", {});
    } catch (error) {
      setOnboardingActionMessage(error.message || "Could not leave onboarding yet. Check the local backend and try again.");
    }
  };
  const stepIndex = Math.max(0, steps.indexOf(step));
  const activeModelProvider = modelProviderRows.find((row) => row.provider === model.provider) || modelProviderRows[0];
  const stepLabels = {
    welcome: "Start",
    profile: "Profile",
    today: "Today",
    reminders: "Reminders",
    reviews: "Reviews",
    model: "AI",
    intent: "Brief",
    setup: "Setup",
    linear: "Linear",
    calendar: "Calendar",
    audio: "Audio",
    telegram: "Telegram",
    schedule: "Schedule",
    review: "Review",
  };
  return <div className="onboarding-shell">
    <aside className="onboarding-rail">
      <PillarBriefLockup />
      <div className="onboarding-progress">{steps.map((id, index) => <button key={id} className={index === stepIndex ? "active" : index < stepIndex ? "done" : ""} onClick={() => setStep(id)}><b>{index + 1}</b><span>{stepLabels[id] || id}</span></button>)}</div>
    </aside>
    <main className="onboarding-main">
      <button className="onboarding-skip" type="button" onClick={skipOnboarding}><Icon name="x" />Skip and set up manually</button>
      {onboardingActionMessage && <p className="warn-text onboarding-action-message">{onboardingActionMessage}</p>}
      {step === "welcome" && <section className="onboarding-panel">
        <Badge>First run</Badge>
        <h1>Set up your executive operating system.</h1>
        <p>Pillar Time starts as a private desktop command center for commitments, reminders, reviews, calendar pressure, meeting prep, and source-grounded intelligence. AI and external connectors are optional.</p>
        <form className="form onboarding-form" onSubmit={async (event) => { event.preventDefault(); if (await saveFirstName()) await go("profile"); }}>
          <Field label="Your first name" value={firstName} onChange={(value) => { setFirstName(value); if (nameMessage) setNameMessage(""); }} placeholder="First name" required />
          {nameMessage && <p className="warn-text">{nameMessage}</p>}
          <Button icon="run" kind="accent" disabled={savingFirstName}>{savingFirstName ? "Saving..." : "Start Pillar Time"}</Button>
        </form>
        <div className="onboarding-cards">
          <div><Icon name="today" /><strong>Today</strong><span>Choose commitments and protect the day.</span></div>
          <div><Icon name="reminders" /><strong>Reminders</strong><span>Enable only the channels you want.</span></div>
          <div><Icon name="reviews" /><strong>Reviews</strong><span>Daily, weekly, monthly, and quarterly planning rituals.</span></div>
          <div><Icon name="sources" /><strong>Intelligence</strong><span>Optional model, sources, calendar, and Telegram delivery.</span></div>
        </div>
      </section>}
      {step === "profile" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Define the executive profile.</h1>
        <p>This creates the local operating context. In this desktop build it stays in your local SQLite database.</p>
        <form className="form onboarding-form" onSubmit={saveExecutiveProfile}>
          <Field label="Executive first name" value={firstName} onChange={(value) => setFirstName(value)} placeholder="First name" required />
          <TextArea label="Operating manual" value={operatingManual} onChange={setOperatingManual} rows={7} placeholder="Preferences, working style, meeting prep rules, protected hours, delegation principles, communication tone, people or projects to remember." />
          <p className="hint">Example: "Protect deep work before noon. Be direct when I overcommit. Flag meetings that need prep, follow-up, or a written decision."</p>
          <div className="notice">
            <strong>Personal Desktop Mode</strong>
            <span>This build is for one local user. Executive Workspace Mode, assistants, shared approvals, and policy-controlled external action execution are architecture commitments, not enabled in this DMG.</span>
          </div>
          {nameMessage && <p className="warn-text">{nameMessage}</p>}
          <div className="row"><Button type="button" onClick={() => go("welcome")}>Back</Button><Button icon="save" kind="primary" disabled={savingFirstName}>{savingFirstName ? "Saving..." : "Save profile"}</Button></div>
        </form>
      </section>}
      {step === "today" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Seed Today’s Three.</h1>
        <p>Add one commitment or priority you want Pillar Time to protect today. You can add more from Today or Planner after onboarding.</p>
        <form className="quick-capture" onSubmit={addStarterCommitment}>
          <input aria-label="Starter commitment for Today's Three" value={starterCommitment} onChange={(event) => setStarterCommitment(event.target.value)} placeholder="Example: Prepare for the Week-1 checkpoint" />
          <Button icon="plus" kind="primary">Add</Button>
        </form>
        <div className="readiness-list">
          {(state.time?.commitments || []).slice(0, 3).map((item) => <div key={item.id}><Icon name="check" /><span>{item.title}</span><Badge tone={item.status === "done" ? "ok" : "muted"}>{item.status}</Badge></div>)}
        </div>
        {starterMessage && <p className={starterMessage.includes("Added") ? "ok-text" : "warn-text"}>{starterMessage}</p>}
        <div className="row"><Button onClick={() => go("profile")}>Back</Button><Button kind="primary" onClick={() => go("reminders")}>Continue</Button></div>
      </section>}
      {step === "reminders" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Choose reminder defaults.</h1>
        <p>Reminders stay quiet unless the master switch is on and an individual reminder is enabled. Telegram delivery only works after Telegram is paired.</p>
        {!state.time?.preferences?.reminderMasterEnabled && <div className="notice notice-warn">
          <strong>Quiet by default</strong>
          <span>Channel choices are saved now, but nothing fires until Master reminders and an individual reminder are enabled.</span>
        </div>}
        <div className="toggle-grid">
          {[
            ["reminderMasterEnabled", "Master reminders"],
            ["regularRemindersEnabled", "Regular reminders"],
            ["sporadicRemindersEnabled", "Sporadic reminders"],
          ].map(([key, label]) => <label className="switch-row" key={key}><span>{label}</span><label className="switch"><input type="checkbox" checked={!!state.time?.preferences?.[key]} onChange={(event) => saveReminderDefaults({ [key]: event.target.checked })} /><span /></label></label>)}
          {["desktopText", "telegramText"].map((key) => <label className={`switch-row ${!state.time?.preferences?.reminderMasterEnabled ? "is-gated" : ""}`} key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><label className="switch"><input type="checkbox" checked={!!state.time?.preferences?.channels?.[key]} onChange={(event) => saveReminderDefaults({ channels: { ...(state.time?.preferences?.channels || {}), [key]: event.target.checked } })} /><span /></label></label>)}
        </div>
        <div className="row"><Button onClick={() => go("today")}>Back</Button><Button kind="primary" onClick={() => go("reviews")}>Continue</Button></div>
      </section>}
      {step === "reviews" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Turn on planning reviews.</h1>
        <p>These are native planning rituals. Enable the ones you want; you can adjust them later from Reviews.</p>
        <div className="review-grid">{(state.time?.reviews || []).map((review) => <div className="time-card" key={review.id}>
          <div className="time-card-head"><div><strong>{review.title}</strong><small>{displayCadence(review.cadence)}</small></div><Badge tone={review.enabled ? "ok" : "muted"}>{review.enabled ? "On" : "Off"}</Badge></div>
          <Button icon={review.enabled ? "x" : "check"} onClick={() => toggleReview(review)}>{review.enabled ? "Disable" : "Enable"}</Button>
        </div>)}</div>
        {reviewMessage && <p className={reviewMessage.includes("enabled") || reviewMessage.includes("disabled") ? "ok-text" : "warn-text"}>{reviewMessage}</p>}
        <div className="row"><Button onClick={() => go("reminders")}>Back</Button><Button kind="primary" onClick={() => go("model")}>Continue</Button></div>
      </section>}
      {step === "model" && <section className="onboarding-panel">
        <h1>Optional: connect an AI model.</h1>
        <p>Pillar Time works locally without this. Add a model when you want source-grounded briefs, source suggestions, perspective generation, transcription fallback, and drafting support.</p>
        <div className="notice">
          <strong>Model costs vary</strong>
          <span>Our defaults select cost-efficient models that work well for briefs. For an average-sized brief scheduled daily with 5-10 sources, expect roughly $5-10/month in model usage. If this is a new provider account, you may also need to add credits or enable billing in that platform's dashboard before requests will run.</span>
        </div>
        <form className="form onboarding-form" onSubmit={saveModel}>
          <Select label="Provider" value={model.provider} onChange={(provider) => { setModel({ ...model, provider, model: defaultModelForProvider(provider), apiKey: "", baseUrl: "" }); setModelOptions([]); setModelOptionsProvider(provider); setModelMessage(""); }} options={modelProviderRows.map((row) => ({ value: row.provider, label: row.name }))} />
          <div className="setup-help-card">
            <BrandLogo name={activeModelProvider.logo} />
            <div><strong>{activeModelProvider.name} API key</strong><span>{activeModelProvider.helper}</span></div>
            <Button type="button" icon="external" onClick={() => openExternalUrl(activeModelProvider.keyUrl)}>Get key</Button>
            <Button type="button" icon="external" onClick={() => openExternalUrl(activeModelProvider.docsUrl)}>Docs</Button>
          </div>
          <Field label="API key" type="password" value={model.apiKey} onChange={(apiKey) => setModel({ ...model, apiKey })} placeholder={(state.model.providerCredentials?.[model.provider]?.apiKeySaved || (state.model.provider === model.provider && state.model.apiKeySaved)) ? "Saved. Paste a new key to replace it." : "Paste provider API key"} />
          {modelOptionsProvider === model.provider && modelOptions.length ? <Select label="Model" value={model.model} onChange={(value) => setModel({ ...model, model: value })} options={modelOptions.includes(model.model) || !model.model ? modelOptions : [model.model, ...modelOptions]} /> : <Field label="Model" value={model.model} onChange={(value) => setModel({ ...model, model: value })} placeholder="Detect models or enter one manually" />}
          <div className="row"><Button type="button" onClick={() => go("intent")}>Skip AI for now</Button><Button type="button" icon="search" onClick={detectModels} disabled={detecting}>{detecting ? "Checking..." : "Validate key"}</Button><Button icon="save" kind="primary" disabled={!model.model}>Save model</Button></div>
          {modelMessage && <p className={modelMessage.includes("saved") || modelMessage.includes("works") ? "ok-text" : "warn-text"}>{modelMessage}</p>}
        </form>
      </section>}
      {step === "intent" && <section className="onboarding-panel">
        <h1>Optional: describe your intelligence brief.</h1>
        <p>Use normal language. Mention topics, people, companies, source types, tone, and anything you want avoided. Skip this if you only want the local planner for now.</p>
        <TextArea label="Intelligence brief request" value={briefPrompt} onChange={setBriefPrompt} rows={9} />
        <div className="row"><Button onClick={() => go("model")}>Back</Button><Button onClick={() => go("linear")}>Skip intelligence setup</Button><Button icon="run" kind="primary" onClick={generateBriefSetupDraft} disabled={!!generateBriefSetupDisabledReason} title={generateBriefSetupDisabledReason || "Generate brief setup"}>{draftingBriefSetup ? "Drafting..." : "Generate brief setup"}</Button></div>
        {briefDraftMessage && <p className={briefDraftMessage.includes("Drafted") || briefDraftMessage.includes("saved") ? "ok-text" : "warn-text"}>{briefDraftMessage}</p>}
      </section>}
      {step === "setup" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Review the brief setup.</h1>
        <p>These settings will populate the Brief setup page. Adjust anything that feels off, then apply it.</p>
        {draftingBriefSetup ? <OnboardingLoading title="Building brief setup..." body="Turning your request into audience, voice, and section prompts." /> : <div className="onboarding-draft">
          <div className="onboarding-draft-grid">
            <TextArea label="Audience context" value={briefDraft?.audienceContext || ""} onChange={(audienceContext) => setBriefDraft({ ...briefDraft, audienceContext })} rows={4} />
            <TextArea label="Voice rules" value={briefDraft?.voiceRules || ""} onChange={(voiceRules) => setBriefDraft({ ...briefDraft, voiceRules })} rows={4} />
          </div>
          <div className="onboarding-section-review">
            {(briefDraft?.sections || []).map((section, index) => <div className="onboarding-section-row" key={`${section.key}-${index}`}>
              <label className="check"><input type="checkbox" checked={section.enabled !== false} onChange={(event) => updateDraftSection(index, { enabled: event.target.checked })} /> Include</label>
              <Field label="Section title" value={section.label || ""} onChange={(label) => updateDraftSection(index, { label })} />
              <TextArea label="Prompt" value={section.instruction || ""} onChange={(instruction) => updateDraftSection(index, { instruction })} rows={2} />
            </div>)}
          </div>
        </div>}
        <div className="row"><Button onClick={() => go("intent")}>Back</Button><Button icon="run" onClick={generateBriefSetupDraft} disabled={draftingBriefSetup} title={draftingBriefSetup ? "Brief setup draft is already being generated" : "Regenerate brief setup"}>Regenerate</Button><Button icon="save" kind="primary" onClick={applyBriefSetupDraft} disabled={!!applyBriefSetupDisabledReason} title={applyBriefSetupDisabledReason || "Apply brief setup and continue"}>Apply and continue</Button></div>
        {briefDraftMessage && <p className={briefDraftMessage.includes("Drafted") || briefDraftMessage.includes("saved") ? "ok-text" : "warn-text"}>{briefDraftMessage}</p>}
      </section>}
      {step === "linear" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Connect Linear.</h1>
        <p>Optional: connect Linear so Pillar Time can show and update project work from inside the app.</p>
        <div className="setup-card form">
          <div className="setup-card-head"><BrandLogo name="Linear" /><div><h3>Linear</h3><p>Use a personal API key from Linear Settings &gt; Security &amp; access.</p></div><Badge tone={linearConnected ? "ok" : "muted"}>{linearConnected ? "Connected" : "Optional"}</Badge></div>
          <Field label="Linear personal API key" type="password" value={linearConnector.apiKey} onChange={(apiKey) => setLinearConnector({ ...linearConnector, apiKey })} placeholder={state.connectors?.linear?.apiKeySaved ? "Saved. Paste a new key to replace it." : state.connectors?.linear?.credentialStatus === "env" ? "Using LINEAR_API_KEY fallback. Paste to save locally." : "lin_api_..."} />
          {linearMessage && <p className={linearMessage.includes("ready") || linearMessage.includes("saved") ? "ok-text" : "warn-text"}>{linearMessage}</p>}
          <div className="row"><Button type="button" icon="run" onClick={testLinearAccess} disabled={!linearConnector.apiKey && state.connectors?.linear?.credentialStatus === "missing"}>Test</Button><Button type="button" icon="save" onClick={saveLinearAccess}>Save Linear</Button></div>
        </div>
        <div className="row"><Button onClick={() => go("setup")}>Back</Button><Button onClick={() => go("calendar")}>Skip Linear</Button><Button kind="primary" onClick={() => go("calendar")}>Continue</Button></div>
      </section>}
      {step === "perspectives" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Add perspective lenses.</h1>
        <p>Optional: describe the viewpoints you want available when you deliberate a saved brief. You can skip this and add them later.</p>
        <div className="perspective-prompt-row">
          <TextArea label="Perspective request" value={perspectivePrompt} onChange={setPerspectivePrompt} rows={5} placeholder="Example: give me a skeptical investor, a product strategist, a policy watcher, and a media narrative lens." />
          <Button type="button" icon="mic" onClick={listenForPerspectivePrompt} disabled={!speechSupported && !listening}>{listening ? "Stop" : "Speak"}</Button>
        </div>
        {!speechSupported && <p className="hint">Voice input is not available in this WebView, but typed input works normally.</p>}
        <div className="row"><Button onClick={() => go("setup")}>Back</Button><Button icon="run" onClick={generatePerspectives} disabled={!!generatePerspectivesDisabledReason} title={generatePerspectivesDisabledReason || "Generate perspective lenses"}>{generatingPerspectives ? "Generating..." : "Generate lenses"}</Button><Button onClick={() => suggestSources()}>Skip</Button><Button icon="save" kind="primary" onClick={() => savePerspectives("sources")} disabled={!!savePerspectivesDisabledReason} title={savePerspectivesDisabledReason || "Save perspective lenses and continue"}>Save and continue</Button></div>
        <div className="analyzer-list">
          {perspectiveDrafts.map((lens, index) => <div className={`analyzer-card ${lens.enabled === false ? "disabled" : ""}`} key={lens.id || index}>
            <label className="switch"><input type="checkbox" checked={lens.enabled !== false} onChange={(event) => updatePerspectiveDraft(index, { enabled: event.target.checked })} /><span /></label>
            <Field label="Name" value={lens.name || ""} onChange={(name) => updatePerspectiveDraft(index, { name })} />
            <Field label="Role" value={lens.role || ""} onChange={(role) => updatePerspectiveDraft(index, { role })} />
            <TextArea label="Description" value={lens.description || ""} onChange={(description) => updatePerspectiveDraft(index, { description })} rows={2} />
            <TextArea label="Instructions" value={lens.instructions || ""} onChange={(instructions) => updatePerspectiveDraft(index, { instructions })} rows={3} />
          </div>)}
        </div>
        {perspectiveMessage && <p className={perspectiveMessage.includes("Generated") || perspectiveMessage.includes("saved") ? "ok-text" : "warn-text"}>{perspectiveMessage}</p>}
      </section>}
      {step === "sources" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Review suggested sources.</h1>
        <p>{suggestingSources ? "The app is finding source candidates from your brief request." : "Pick the ones that look right. They become real sources as soon as you add them."}</p>
        {suggestingSources && <OnboardingLoading title={sourceLoadingText} body={`Found ${sourceFoundCount} source${sourceFoundCount === 1 ? "" : "s"} so far.`} />}
        {!suggestingSources && sourceFoundCount > 0 && <div className="onboarding-found-count"><Icon name="check" /><strong>Found {sourceFoundCount} source{sourceFoundCount === 1 ? "" : "s"}</strong></div>}
        <div className="source-suggestion-list">{suggestions.map((source) => {
          const prereqs = sourcePrerequisites(source, state);
          const blocked = prereqs.some((note) => note.blocking);
          return <label className={`source-suggestion ${selected.has(source.id) ? "selected" : ""} ${blocked ? "blocked" : ""}`} key={source.id}>
            <input type="checkbox" checked={selected.has(source.id)} onChange={(event) => setSelected((current) => {
              const next = new Set(current);
              event.target.checked ? next.add(source.id) : next.delete(source.id);
              return next;
            })} />
            <BrandLogo name={source.type} />
            <div><strong>{source.name}</strong><small>{source.type} · {source.locator}</small><p>{source.rationale}</p>{prereqs.length > 0 && <div className="source-prereqs">{prereqs.map((note) => <span key={note.label}><b>{note.label}</b>{note.body}</span>)}</div>}</div>
            <Badge tone={blocked ? "warn" : "muted"}>{blocked ? "Will guide setup" : `${Math.round((source.confidence || 0.7) * 100)}%`}</Badge>
          </label>;
        })}</div>
        {!suggestingSources && !suggestions.length && <Empty icon="sources" title="No suggestions yet" body="Generate source suggestions from your brief request." action={<Button icon="run" kind="primary" onClick={suggestSources}>Generate suggestions</Button>} />}
        <div className="row"><Button onClick={() => go("intent")}>Back</Button><Button onClick={() => go("calendar")}>Skip sources</Button><Button icon="run" onClick={suggestSources} disabled={!!suggestSourcesDisabledReason} title={suggestSourcesDisabledReason || "Generate source suggestions"}>{suggestingSources ? "Gathering..." : "Generate"}</Button><Button icon="plus" kind="primary" disabled={!!addSelectedSourcesDisabledReason} title={addSelectedSourcesDisabledReason || "Add selected sources"} onClick={addSelectedSources}>{savingSources ? "Adding..." : "Add selected"}</Button></div>
        {sourceMessage && <p className={sourceMessage.includes("added") || sourceMessage.includes("Review") || sourceMessage.includes("Found") ? "ok-text" : "warn-text"}>{sourceMessage}</p>}
      </section>}
      {step === "access" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Finish source access.</h1>
        <p>{blockedPendingSources.length ? "These selected sources need one more credential or local tool before they can run." : "All selected sources are ready to add."}</p>
        <div className="access-summary">
          {pendingSources.map((source) => {
            const prereqs = sourcePrerequisites(source, state);
            const blocked = prereqs.some((note) => note.blocking);
            return <div className="access-source-row" key={source.id}>
              <div className="connector-name"><BrandLogo name={source.type} /><div><strong>{source.name}</strong><small>{source.type} · {source.locator}</small></div></div>
              <Badge tone={blocked ? "warn" : "ok"}>{blocked ? "Needs setup" : "Ready"}</Badge>
            </div>;
          })}
        </div>
        {pendingPrereqKeys.includes("x") && <form className="setup-card form" onSubmit={saveXAccess}>
          <div className="setup-card-head"><BrandLogo name="X" /><div><h3>X API access</h3><p>{setupLinks.x.helper}</p></div><Badge tone={state.connectors?.x?.status === "ready" ? "ok" : "warn"}>{state.connectors?.x?.status === "ready" ? "Ready" : "Needs token"}</Badge></div>
          <div className="setup-link-row">
            <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.x.keyUrl)}>Open X portal</Button>
            <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.x.docsUrl)}>Setup guide</Button>
          </div>
          <Field label="Bearer token" type="password" value={xConnector.apiKey} onChange={(apiKey) => setXConnector({ ...xConnector, apiKey })} placeholder={state.connectors?.x?.apiKeySaved ? "Saved. Paste a new token to replace it." : "Paste X bearer token"} />
          {xMessage && <p className={xMessage.includes("saved") ? "ok-text" : "warn-text"}>{xMessage}</p>}
          <div className="row"><Button type="button" onClick={() => skipPrerequisiteSources("x")}>Skip X sources</Button><Button icon="save" kind="primary">Save X API</Button></div>
        </form>}
        {(pendingPrereqKeys.includes("ffmpeg") || pendingPrereqKeys.includes("transcriptionModel")) && <div className="setup-card">
          <div className="setup-card-head"><BrandLogo name="Podcast" /><div><h3>Podcast transcription</h3><p>Podcast sources need FFmpeg for long audio processing and either local Whisper STT or an OpenAI-compatible transcription model.</p></div><Badge tone={!pendingPrereqKeys.includes("ffmpeg") && !pendingPrereqKeys.includes("transcriptionModel") ? "ok" : "warn"}>Setup required</Badge></div>
          {pendingPrereqKeys.includes("ffmpeg") && <div className="setup-subcard">
            <div><strong>Install FFmpeg</strong><span>{setupLinks.ffmpeg.helper}</span></div>
            <div className="setup-link-row">
              <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.ffmpeg.keyUrl)}>Homebrew</Button>
              <Button type="button" icon="external" onClick={() => openExternalUrl(setupLinks.ffmpeg.docsUrl)}>FFmpeg formula</Button>
              <Button type="button" icon="run" onClick={checkFfmpeg} disabled={ffmpegBusy}>{ffmpegBusy ? "Checking..." : "Re-check"}</Button>
              {!ffmpegStatus?.available && ffmpegStatus?.installable && <Button type="button" icon="download" kind="primary" onClick={installFfmpeg} disabled={ffmpegBusy}>{ffmpegBusy ? "Installing..." : "Install FFmpeg"}</Button>}
            </div>
            <p className={ffmpegStatus?.available ? "ok-text" : "warn-text"}>{ffmpegMessage || ffmpegStatus?.message || "FFmpeg has not been checked yet."}</p>
          </div>}
          {pendingPrereqKeys.includes("transcriptionModel") && <div className="setup-subcard">
            <div><strong>Set up speech-to-text</strong><span>Use local Whisper STT when bundled/configured, or add an OpenAI/custom transcription endpoint. You can also skip podcast transcription sources.</span></div>
            <div className="setup-link-row">
              <Button type="button" icon="run" onClick={checkStt} disabled={sttBusy}>{sttBusy ? "Checking..." : "Check local Whisper"}</Button>
              {sttStatus?.binaryAvailable && !sttStatus?.modelAvailable && <Button type="button" icon="download" kind="primary" onClick={installSttModel} disabled={sttBusy}>{sttBusy ? "Downloading..." : "Download Whisper model"}</Button>}
              <Button type="button" icon="external" onClick={() => openExternalUrl(modelProviderRows[0].keyUrl)}>OpenAI keys</Button>
              <Button type="button" icon="external" onClick={() => openExternalUrl(modelProviderRows[0].docsUrl)}>OpenAI help</Button>
              <Button type="button" onClick={async () => { setReturnAfterModel("access"); setModel({ enabled: true, provider: "openai", model: defaultOpenAiModel, apiKey: "", baseUrl: "" }); await go("model"); }}>Set up OpenAI</Button>
            </div>
            <p className={sttStatus?.available ? "ok-text" : "warn-text"}>{sttMessage || sttStatus?.message || "Local Whisper has not been checked yet."}</p>
          </div>}
          <div className="row"><Button type="button" onClick={() => skipPrerequisiteSources("transcription")}>Skip transcription sources</Button></div>
        </div>}
        <div className="row"><Button onClick={() => go("sources")}>Back</Button><Button icon="plus" kind="primary" disabled={savingSources || !pendingSources.length} onClick={continueAfterAccess}>{savingSources ? "Adding..." : "Continue with ready sources"}</Button></div>
        {sourceMessage && <p className={sourceMessage.includes("added") || sourceMessage.includes("Skipped") ? "ok-text" : "warn-text"}>{sourceMessage}</p>}
      </section>}
      {step === "calendar" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Add your calendar.</h1>
        <p>Optional: connect Google Calendar so each daily brief starts with what is on your agenda, what to prepare for, schedule conflicts, focus windows, and likely follow-ups.</p>
        <div className="setup-card">
          <div className="setup-card-head">
            <BrandLogo name="Calendar" />
            <div><h3>Google Calendar</h3><p>Pillar Time reads calendar context and only writes approved schedule blocks after explicit approval.</p></div>
            <Badge tone={googleCalendarConnected ? "ok" : "muted"}>{googleCalendarConnected ? "Connected" : "Optional"}</Badge>
          </div>
          <div className="notice">
            <strong>How it changes the brief</strong>
            <span>When connected, Brief Setup gets a first section called Today's Calendar. You can edit or disable that section later, and choose which calendars are included from Settings.</span>
          </div>
          <div className="notice">
            <strong>Why Google may show Transformation Agency</strong>
            <span>Pillar Time uses a Transformation Agency auth broker to complete the local desktop OAuth handoff. Calendar data is still stored locally in this app.</span>
          </div>
          <div className="setup-link-row">
            <Button type="button" icon="external" onClick={startCalendarOAuth}>{googleCalendarConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}</Button>
            <Button type="button" icon="run" onClick={refreshCalendarStatus}>Refresh status</Button>
          </div>
          {calendarMessage && <p className={calendarMessage.includes("connected") || calendarMessage.includes("opened") ? "ok-text" : "warn-text"}>{calendarMessage}</p>}
        </div>
        <div className="row"><Button onClick={() => go("linear")}>Back</Button><Button onClick={() => go("audio")}>Skip calendar</Button><Button kind="primary" onClick={() => go("audio")}>Continue</Button></div>
      </section>}
      {step === "audio" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Add audio briefs.</h1>
        <p>Optional: connect ElevenLabs to listen to generated briefs and attach MP3 audio after Telegram text delivery.</p>
        <ElevenLabsSetup state={state} mutate={mutate} refresh={refresh} onSkip={() => go("telegram")} onSaved={() => go("telegram")} />
        <div className="row"><Button onClick={() => go("calendar")}>Back</Button><Button kind="primary" onClick={() => go("telegram")}>Continue</Button></div>
      </section>}
      {step === "telegram" && <section className="onboarding-panel onboarding-panel-wide">
        <h1>Pair Telegram.</h1>
        <p>Optional: pair Telegram if you want briefs delivered outside the app. You can skip this and read briefs in Pillar Time.</p>
        <TelegramPairingFlow state={state} refresh={refresh} onPaired={() => go("schedule")} />
        <div className="row"><Button onClick={() => go("audio")}>Back</Button><Button onClick={() => go("schedule")}>Skip Telegram</Button><Button kind="primary" onClick={() => go("schedule")}>Continue</Button></div>
      </section>}
      {step === "schedule" && <section className="onboarding-panel">
        <h1>Choose delivery time.</h1>
        <p>This can be daily or weekly. You can change it later from Settings.</p>
        <div className="delivery-block">
          <div className="delivery-row">
            <label className="delivery-field"><Calendar className="ico" /><select aria-label="Onboarding delivery frequency" value={state.briefConfig.deliveryFrequency || "Daily"} onChange={(event) => saveDelivery({ deliveryFrequency: event.target.value })}><option>Daily</option><option>Weekly</option></select></label>
            <DeliveryTimeSelect value={state.briefConfig.deliveryTime || "08:00"} onChange={(deliveryTime) => saveDelivery({ deliveryTime })} />
          </div>
          {state.briefConfig.deliveryFrequency === "Weekly" && <label className="delivery-field timezone-field"><Calendar className="ico" /><select aria-label="Onboarding delivery day" value={state.briefConfig.deliveryDay || "Monday"} onChange={(event) => saveDelivery({ deliveryDay: event.target.value })}>{deliveryDays.map((day) => <option key={day}>{day}</option>)}</select></label>}
          <label className="delivery-field timezone-field"><Globe2 className="ico" /><select aria-label="Onboarding delivery timezone" value={timezone} onChange={(event) => saveDelivery({ deliveryTimezone: event.target.value })}>{timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</select></label>
        </div>
        <div className="row"><Button onClick={() => go("telegram")}>Back</Button><Button icon="check" kind="primary" onClick={() => go("review")}>Review setup</Button></div>
      </section>}
      {step === "review" && <section className="onboarding-panel">
        <h1>Ready to open the app.</h1>
        <div className="readiness-list">
          {[["Executive profile", reviewReadiness.ownerNameReady, false], ["Schedule set", reviewReadiness.scheduleSet, false], ["Today seeded", (state.time?.commitments || []).length > 0, true], ["Reminder defaults", !!state.time?.preferences?.reminderMasterEnabled, true], ["Planning reviews", (state.time?.reviews || []).some((review) => review.enabled), true], ["Model connected", reviewReadiness.modelReady, true], ["Brief prompt saved", reviewReadiness.briefPromptSaved, true], ["Linear connected", linearConnected, true], ["Google Calendar", googleCalendarConnected, true], ["Telegram paired", reviewReadiness.telegramReady, true]].map(([label, ok, optional]) => <div key={label}><Icon name={ok ? "check" : optional ? "volume" : "x"} /><span>{label}</span><Badge tone={ok ? "ok" : optional ? "muted" : "warn"}>{ok ? "Done" : optional ? "Optional" : "Needs setup"}</Badge></div>)}
        </div>
        <div className="row">{!canComplete && <Button onClick={() => go(firstIncomplete())}>Fix required step</Button>}<Button onClick={skipOnboarding}>Finish later</Button><Button icon="check" kind="accent" disabled={!canComplete} onClick={complete}>Finish onboarding</Button></div>
      </section>}
    </main>
  </div>;
}

function Telegram({ state, mutate, refresh }) {
  const [form, setForm] = React.useState({ enabled: state.telegram.enabled, botToken: state.telegram.botToken, chatId: state.telegram.chatId, allowedUsers: state.telegram.allowedUsers.join(", ") });
  const [cmd, setCmd] = React.useState("/review");
  const [result, setResult] = React.useState("");
  const [telegramMessage, setTelegramMessage] = React.useState("");
  React.useEffect(() => {
    setForm({ enabled: state.telegram.enabled, botToken: state.telegram.botToken, chatId: state.telegram.chatId, allowedUsers: state.telegram.allowedUsers.join(", ") });
  }, [state.telegram]);
  const save = async (e) => {
    e.preventDefault();
    setTelegramMessage("");
    try {
      await mutate("/api/telegram", { ...form, allowedUsers: form.allowedUsers.split(",").map((u) => u.trim()).filter(Boolean) }, "PATCH");
      setTelegramMessage("Telegram settings saved.");
    } catch (error) {
      setTelegramMessage(error.message || "Could not save Telegram settings.");
    }
  };
  const testTelegram = async () => {
    setTelegramMessage("");
    try {
      const response = await mutate("/api/telegram/test", {});
      setTelegramMessage(`Test message sent${response.botUsername ? ` via @${response.botUsername}` : ""}.`);
    } catch (error) {
      setTelegramMessage(error.message || "Could not send Telegram test.");
    }
  };
  const runCmd = async () => {
    setTelegramMessage("");
    setResult("");
    try {
      const r = await mutate("/api/telegram/commands", { command: cmd });
      setResult(r.result);
      setTelegramMessage(`${cmd} command completed.`);
    } catch (error) {
      setTelegramMessage(error.message || "Could not run Telegram command.");
    }
  };
  return <Page title="Telegram" desc="Pair Telegram with a bot link, or use Advanced for manual chat IDs." wide>
    <div className="split">
      <div className="card form"><h2>Easy pairing</h2><TelegramPairingFlow state={state} refresh={refresh} /></div>
      <form className="card form" onSubmit={save}><h2>Advanced manual settings</h2><label className="check"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enable Telegram adapter</label><Field label="Bot token" type="password" value={form.botToken} onChange={(botToken) => setForm({ ...form, botToken })} placeholder={state.telegram.botToken ? "Configured. Paste a new token to replace it." : "123456:ABC..."} /><Field label="Chat ID" value={form.chatId} onChange={(chatId) => setForm({ ...form, chatId })} placeholder="-1001234567890 or 123456789" /><Field label="Allowed users" value={form.allowedUsers} onChange={(allowedUsers) => setForm({ ...form, allowedUsers })} placeholder="username, teammate, 123456789" /><div className="row"><Button icon="save" kind="primary">Save Telegram Settings</Button><Button type="button" icon="telegram" onClick={testTelegram}>Send Test</Button></div>{telegramMessage && <p className={telegramMessage.includes("sent") || telegramMessage.includes("saved") ? "ok-text" : "warn-text"}>{telegramMessage}</p>}{state.telegram.lastError && <p className="warn-text">{state.telegram.lastError}</p>}{state.telegram.lastCheckedAt && <p className="hint">Last checked {new Date(state.telegram.lastCheckedAt).toLocaleString()}</p>}</form>
      <div className="card form"><h2>Command tool call</h2><Select label="Command" value={cmd} onChange={setCmd} options={state.telegram.commands} /><Button icon="run" onClick={runCmd}>Run Command</Button>{result && <pre>{result}</pre>}<h2>Supported commands</h2><div className="chips">{state.telegram.commands.map((c) => <span key={c}>{c}</span>)}</div></div>
    </div>
  </Page>;
}

function Audit({ state }) {
  return <Page title="Audit Log" desc="State-changing actions are recorded here." wide>
    <div className="card table-card">{state.auditLogs.length ? <table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Note</th></tr></thead><tbody>{state.auditLogs.map((a) => <tr key={a.id}><td className="mono">{new Date(a.ts).toLocaleString()}</td><td>{a.actor}</td><td><Badge>{a.action}</Badge></td><td className="mono">{a.entityType}:{a.entityId}</td><td>{a.note}</td></tr>)}</tbody></table> : <Empty icon="audit" title="No audit entries" body="The first state-changing action will create the first audit log." />}</div>
  </Page>;
}

function Settings({ state, mutate, refresh, desktopUpdate }) {
  const [connectorModal, setConnectorModal] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState("");
  const [telegramModal, setTelegramModal] = React.useState(false);
  const [telegramSetupMessage, setTelegramSetupMessage] = React.useState("");
  const [xModal, setXModal] = React.useState(false);
  const [xMessage, setXMessage] = React.useState("");
  const [redditModal, setRedditModal] = React.useState(false);
  const [redditMessage, setRedditMessage] = React.useState("");
  const [linearModal, setLinearModal] = React.useState(false);
  const [linearMessage, setLinearMessage] = React.useState("");
  const [linearConnector, setLinearConnector] = React.useState({ enabled: true, apiKey: "" });
  const [googleCalendarModal, setGoogleCalendarModal] = React.useState(false);
  const [googleCalendarSelection, setGoogleCalendarSelection] = React.useState(state.connectors?.googleCalendar?.selectedCalendarIds || ["primary"]);
  const [googleCalendarSelectionDirty, setGoogleCalendarSelectionDirty] = React.useState(false);
  const [googleCalendarMessage, setGoogleCalendarMessage] = React.useState("");
  const [model, setModel] = React.useState({
    enabled: true,
    provider: state.model.provider || "openai",
    model: state.model.model || defaultModelForProvider(state.model.provider || "openai"),
    apiKey: "",
    baseUrl: state.model.baseUrl || "",
  });
  const [modelOptions, setModelOptions] = React.useState(state.model.model ? [state.model.model] : []);
  const [modelOptionsProvider, setModelOptionsProvider] = React.useState(state.model.provider || "openai");
  const [xConnector, setXConnector] = React.useState({
    enabled: true,
    apiKey: "",
  });
  const [redditConnector, setRedditConnector] = React.useState({
    enabled: true,
    clientId: "",
    clientSecret: "",
    grantType: "client_credentials",
    deviceId: "DO_NOT_TRACK_THIS_DEVICE",
  });
  const [telegramForm, setTelegramForm] = React.useState({ enabled: state.telegram.enabled, botToken: state.telegram.botToken, chatId: state.telegram.chatId, allowedUsers: state.telegram.allowedUsers.join(", ") });
  const [detecting, setDetecting] = React.useState(false);
  const [detectError, setDetectError] = React.useState("");
  const [ffmpegStatus, setFfmpegStatus] = React.useState(state.runtime?.ffmpeg || null);
  const [ffmpegBusy, setFfmpegBusy] = React.useState(false);
  const [ffmpegMessage, setFfmpegMessage] = React.useState("");
  const [sttStatus, setSettingsSttStatus] = React.useState(state.runtime?.stt || null);
  const [sttBusy, setSettingsSttBusy] = React.useState(false);
  const [sttMessage, setSettingsSttMessage] = React.useState("");
  const [healthBusy, setHealthBusy] = React.useState(false);
  const [healthMessage, setHealthMessage] = React.useState("");
  const [settingsMessage, setSettingsMessage] = React.useState("");
  React.useEffect(() => {
    if (editingProvider) return;
    setModel({
      enabled: true,
      provider: state.model.provider || "openai",
      model: state.model.model || defaultModelForProvider(state.model.provider || "openai"),
      apiKey: "",
      baseUrl: state.model.baseUrl || "",
    });
    setModelOptions(state.model.model ? [state.model.model] : []);
    setModelOptionsProvider(state.model.provider || "openai");
  }, [state.model, editingProvider]);
  React.useEffect(() => {
    setXConnector({
      enabled: true,
      apiKey: "",
    });
  }, [state.connectors]);
  React.useEffect(() => {
    setRedditConnector((current) => ({
      enabled: true,
      clientId: "",
      clientSecret: "",
      grantType: state.connectors?.reddit?.grantType || current.grantType || "client_credentials",
      deviceId: current.deviceId || "DO_NOT_TRACK_THIS_DEVICE",
    }));
  }, [state.connectors?.reddit?.grantType]);
  React.useEffect(() => {
    setLinearConnector({ enabled: state.connectors?.linear?.enabled !== false, apiKey: "" });
  }, [state.connectors?.linear?.enabled]);
  React.useEffect(() => {
    setTelegramForm({ enabled: state.telegram.enabled, botToken: state.telegram.botToken, chatId: state.telegram.chatId, allowedUsers: state.telegram.allowedUsers.join(", ") });
  }, [state.telegram]);
  React.useEffect(() => {
    setFfmpegStatus(state.runtime?.ffmpeg || null);
  }, [state.runtime?.ffmpeg]);
  React.useEffect(() => {
    setSettingsSttStatus(state.runtime?.stt || null);
  }, [state.runtime?.stt]);
  React.useEffect(() => {
    if (googleCalendarSelectionDirty) return;
    setGoogleCalendarSelection(state.connectors?.googleCalendar?.selectedCalendarIds || ["primary"]);
  }, [state.connectors?.googleCalendar?.selectedCalendarIds, googleCalendarSelectionDirty]);
  const saveModel = async (e) => {
    e.preventDefault();
    setDetectError("");
    try {
      await mutate("/api/model", { ...model, enabled: true }, "PATCH");
      setEditingProvider("");
    } catch (error) {
      setDetectError(error.message || "Could not save model provider.");
    }
  };
  const closeModelProviderSetup = () => {
    const savedProvider = state.model.provider || "openai";
    const savedModel = editingProvider === savedProvider ? state.model.model || defaultModelForProvider(editingProvider) : defaultModelForProvider(editingProvider);
    const savedBaseUrl = editingProvider === savedProvider ? state.model.baseUrl || "" : "";
    const hasUnsavedModelChanges = !!model.apiKey || model.model !== savedModel || (model.baseUrl || "") !== savedBaseUrl;
    if (hasUnsavedModelChanges) {
      const ok = window.confirm("Discard unsaved model provider changes? API key text, model choice, and Base URL edits will not be saved.");
      if (!ok) return false;
    }
    setModel({ enabled: true, provider: savedProvider, model: state.model.model || defaultModelForProvider(savedProvider), apiKey: "", baseUrl: state.model.baseUrl || "" });
    setModelOptions(state.model.model ? [state.model.model] : []);
    setModelOptionsProvider(savedProvider);
    setDetectError("");
    setEditingProvider("");
    return true;
  };
  const saveXConnector = async (e) => {
    e.preventDefault();
    setXMessage("");
    try {
      await mutate("/api/connectors/x", { ...xConnector, enabled: true }, "PATCH");
      setXConnector({ enabled: true, apiKey: "" });
      setXModal(false);
    } catch (error) {
      setXMessage(error.message || "Could not save X API token.");
    }
  };
  const closeXModal = () => {
    if (xConnector.apiKey) {
      const ok = window.confirm("Discard unsaved X API token? The pasted bearer token will not be saved.");
      if (!ok) return false;
    }
    setXConnector({ enabled: true, apiKey: "" });
    setXMessage("");
    setXModal(false);
    return true;
  };
  const saveRedditConnector = async (e) => {
    e.preventDefault();
    setRedditMessage("");
    try {
      await mutate("/api/connectors/reddit", { ...redditConnector, enabled: true }, "PATCH");
      setRedditConnector({ ...redditConnector, clientId: "", clientSecret: "" });
      setRedditMessage("Reddit OAuth settings saved.");
      setRedditModal(false);
    } catch (error) {
      setRedditMessage(error.message || "Could not save Reddit connector.");
    }
  };
  const closeRedditModal = () => {
    const savedGrantType = state.connectors?.reddit?.grantType || "client_credentials";
    const hasUnsavedRedditChanges = !!redditConnector.clientId
      || !!redditConnector.clientSecret
      || redditConnector.grantType !== savedGrantType
      || redditConnector.deviceId !== "DO_NOT_TRACK_THIS_DEVICE";
    if (hasUnsavedRedditChanges) {
      const ok = window.confirm("Discard unsaved Reddit OAuth changes? Client credentials and grant-type edits will not be saved.");
      if (!ok) return false;
    }
    setRedditConnector({ enabled: true, clientId: "", clientSecret: "", grantType: savedGrantType, deviceId: "DO_NOT_TRACK_THIS_DEVICE" });
    setRedditModal(false);
    return true;
  };
  const testRedditConnector = async () => {
    setRedditMessage("");
    try {
      await api("/api/reddit/test", { method: "POST", body: JSON.stringify(redditConnector) });
      setRedditConnector({ ...redditConnector, clientId: "", clientSecret: "" });
      setRedditMessage("Reddit OAuth API is ready.");
      await refresh();
    } catch (error) {
      setRedditMessage(error.message || "Reddit OAuth test failed.");
      await refresh();
    }
  };
  const enableLinearConnector = async () => {
    setLinearMessage("");
    if (!linearConnector.apiKey && !state.connectors?.linear?.apiKeySaved && state.connectors?.linear?.credentialStatus !== "env") {
      setLinearMessage("Paste a Linear personal API key, or leave Linear disabled for now.");
      return;
    }
    try {
      await mutate("/api/connectors/linear", { ...linearConnector, enabled: true }, "PATCH");
      setLinearConnector({ enabled: true, apiKey: "" });
      setLinearMessage("Linear connector enabled.");
    } catch (error) {
      setLinearMessage(error.message || "Could not enable Linear.");
    }
  };
  const disableLinearConnector = async () => {
    setLinearMessage("");
    try {
      await mutate("/api/connectors/linear", { enabled: false }, "PATCH");
      setLinearMessage("Linear connector disabled.");
    } catch (error) {
      setLinearMessage(error.message || "Could not disable Linear.");
    }
  };
  const testLinearConnector = async () => {
    setLinearMessage("");
    try {
      const result = await api("/api/linear/test", { method: "POST", body: JSON.stringify({ apiKey: linearConnector.apiKey }) });
      setLinearConnector({ enabled: true, apiKey: "" });
      setLinearMessage(`Linear is ready${result.viewer?.displayName || result.viewer?.name ? ` for ${result.viewer.displayName || result.viewer.name}` : ""}.`);
      await refresh();
    } catch (error) {
      setLinearMessage(error.message || "Linear test failed.");
      await refresh();
    }
  };
  const closeLinearModal = () => {
    const savedEnabled = state.connectors?.linear?.enabled !== false;
    const hasUnsavedLinearChanges = !!linearConnector.apiKey || linearConnector.enabled !== savedEnabled;
    if (hasUnsavedLinearChanges) {
      const ok = window.confirm("Discard unsaved Linear connector changes? Your API key text and enable setting will not be saved.");
      if (!ok) return false;
    }
    setLinearConnector({ enabled: savedEnabled, apiKey: "" });
    setLinearModal(false);
    return true;
  };
  const startGoogleCalendarOAuth = async (e) => {
    e.preventDefault();
    setGoogleCalendarMessage("");
    try {
      const result = await api("/api/google-calendar/oauth/start", { method: "POST", body: JSON.stringify({}) });
      await refresh();
      setGoogleCalendarMessage("Google consent opened in your browser. Complete it, then return here; Pillar Time will update the status automatically.");
      await openExternalUrl(result.authUrl);
    } catch (error) {
      setGoogleCalendarMessage(error.message);
    }
  };
  const testGoogleCalendar = async () => {
    setGoogleCalendarMessage("");
    try {
      await api("/api/google-calendar/test", { method: "POST", body: JSON.stringify({}) });
      setGoogleCalendarMessage("Google Calendar is connected and ready.");
      await refresh();
    } catch (error) {
      setGoogleCalendarMessage(error.message);
      await refresh();
    }
  };
  const refreshGoogleCalendars = async () => {
    setGoogleCalendarMessage("");
    try {
      const result = await api("/api/google-calendar/calendars", { method: "POST", body: JSON.stringify({}) });
      setGoogleCalendarSelection(result.selectedCalendarIds || ["primary"]);
      setGoogleCalendarSelectionDirty(false);
      setGoogleCalendarMessage("Calendar list refreshed.");
      await refresh();
    } catch (error) {
      setGoogleCalendarMessage(error.message);
      await refresh();
    }
  };
  const saveGoogleCalendarSelection = async () => {
    setGoogleCalendarMessage("");
    try {
      await mutate("/api/google-calendar/calendars", { selectedCalendarIds: googleCalendarSelection }, "PATCH");
      setGoogleCalendarSelectionDirty(false);
      setGoogleCalendarMessage("Calendar selection saved.");
    } catch (error) {
      setGoogleCalendarMessage(error.message);
    }
  };
  const toggleGoogleCalendar = (calendarId) => {
    setGoogleCalendarSelection((current) => {
      if (current.includes(calendarId)) {
        const next = current.filter((item) => item !== calendarId);
        if (!next.length) {
          setGoogleCalendarMessage("Keep at least one calendar selected for daily planning.");
          return current;
        }
        setGoogleCalendarSelectionDirty(true);
        setGoogleCalendarMessage("");
        return next;
      }
      setGoogleCalendarSelectionDirty(true);
      setGoogleCalendarMessage("");
      return [...current, calendarId];
    });
  };
  const closeGoogleCalendarModal = () => {
    if (googleCalendarSelectionDirty) {
      const ok = window.confirm("Discard unsaved Google Calendar selection changes? Your daily planning inputs will keep using the previously saved calendars.");
      if (!ok) return;
    }
    setGoogleCalendarSelection(state.connectors?.googleCalendar?.selectedCalendarIds || ["primary"]);
    setGoogleCalendarSelectionDirty(false);
    setGoogleCalendarModal(false);
  };
  const disconnectGoogleCalendar = async () => {
    if (!window.confirm("Disconnect Google Calendar? Pillar Time will stop reading your agenda and cannot create approved schedule blocks until you reconnect.")) return;
    setGoogleCalendarMessage("");
    try {
      await mutate("/api/google-calendar/disconnect", {}, "POST");
      setGoogleCalendarSelection(["primary"]);
      setGoogleCalendarSelectionDirty(false);
      setGoogleCalendarMessage("Google Calendar disconnected.");
    } catch (error) {
      setGoogleCalendarMessage(error.message || "Could not disconnect Google Calendar.");
    }
  };
  const saveTelegram = async (e) => {
    e.preventDefault();
    setTelegramSetupMessage("");
    try {
      await mutate("/api/telegram", { ...telegramForm, enabled: true, allowedUsers: telegramForm.allowedUsers.split(",").map((u) => u.trim()).filter(Boolean) }, "PATCH");
      setTelegramModal(false);
    } catch (error) {
      setTelegramSetupMessage(error.message || "Could not save Telegram settings.");
    }
  };
  const closeTelegramModal = () => {
    const savedTelegramForm = { enabled: state.telegram.enabled, botToken: state.telegram.botToken, chatId: state.telegram.chatId, allowedUsers: state.telegram.allowedUsers.join(", ") };
    const hasUnsavedTelegramChanges = telegramForm.botToken !== savedTelegramForm.botToken
      || telegramForm.chatId !== savedTelegramForm.chatId
      || telegramForm.allowedUsers !== savedTelegramForm.allowedUsers;
    if (hasUnsavedTelegramChanges) {
      const ok = window.confirm("Discard unsaved Telegram setup changes? Bot token, chat ID, and allowed-user edits will not be saved.");
      if (!ok) return false;
    }
    setTelegramForm(savedTelegramForm);
    setTelegramSetupMessage("");
    setTelegramModal(false);
    return true;
  };
  const detectModels = React.useCallback(async () => {
    const requestProvider = editingProvider || model.provider;
    if (requestProvider === "custom" && !model.baseUrl) {
      setDetectError("Custom providers need a Base URL before model discovery.");
      return;
    }
    const providerCredential = state.model.providerCredentials?.[requestProvider]?.credentialStatus || (requestProvider === state.model.provider ? state.model.credentialStatus : "missing");
    if (!model.apiKey && providerCredential === "missing") {
      setDetectError("Enter an API key to discover models for this provider.");
      return;
    }
    setDetecting(true);
    setDetectError("");
    try {
      const result = await api("/api/model/models", { method: "POST", body: JSON.stringify({ ...model, provider: requestProvider }) });
      if (result.provider && result.provider !== requestProvider) return;
      setModelOptions(result.models || []);
      setModelOptionsProvider(requestProvider);
      if (result.error) setDetectError(result.error);
      if ((!model.model || model.provider !== requestProvider) && result.models?.length) setModel((m) => ({ ...m, provider: requestProvider, model: defaultModelForProvider(requestProvider) || result.models[0] }));
    } catch (error) {
      setDetectError(error.message);
    } finally {
      setDetecting(false);
    }
  }, [editingProvider, model, state.model.credentialStatus, state.model.provider, state.model.providerCredentials]);
  React.useEffect(() => {
    if (!model.apiKey || model.apiKey.length < 12) return;
    const timer = setTimeout(() => detectModels(), 700);
    return () => clearTimeout(timer);
  }, [model.apiKey, detectModels]);
  React.useEffect(() => {
    if (!editingProvider || model.apiKey) return;
    const providerCredential = state.model.providerCredentials?.[editingProvider]?.credentialStatus || (editingProvider === state.model.provider ? state.model.credentialStatus : "missing");
    if (providerCredential === "missing") return;
    const timer = setTimeout(() => detectModels(), 250);
    return () => clearTimeout(timer);
  }, [editingProvider, model.apiKey, detectModels, state.model.credentialStatus, state.model.provider, state.model.providerCredentials]);
  const modelConnected = state.model.status === "ready";
  const xConnected = state.connectors?.x?.status === "ready";
  const redditConnected = state.connectors?.reddit?.status === "ready";
  const linearConnected = state.connectors?.linear?.status === "ready";
  const googleCalendarConnected = state.connectors?.googleCalendar?.status === "ready";
  const googleCalendarCanWrite = !!state.connectors?.googleCalendar?.canWrite;
  const googleCalendarNeedsWriteReconnect = googleCalendarConnected && !googleCalendarCanWrite;
  const telegramConnected = state.telegram?.enabled && state.telegram?.chatId && state.telegram?.botToken;
  const healthWarnings = [
    state.model?.status === "ready" ? "" : "Model connector is not ready; day plans will use deterministic fallback.",
    googleCalendarConnected ? "" : "Google Calendar is not connected; calendar context will be missing.",
    googleCalendarNeedsWriteReconnect ? "Google Calendar can read, but needs reconnect before approved calendar writes." : "",
    linearConnected ? "" : "Linear is not ready; Linear work will be missing from ranking.",
    state.telegram?.enabled && state.telegram?.lastError ? `Telegram needs attention: ${state.telegram.lastError}` : "",
    ffmpegStatus?.available === false ? "FFmpeg is unavailable; podcast transcription is disabled." : "",
    sttStatus?.available === false ? "Whisper speech-to-text is unavailable; local voice input/transcription is disabled." : "",
    desktopUpdate?.status === "error" ? `Update check failed: ${desktopUpdate.lastError || desktopUpdate.message || "unknown error"}` : "",
  ].filter(Boolean);
  const healthTone = healthWarnings.length ? "warn" : "ok";
  const healthTitle = healthWarnings.length ? "Review recommended" : "Core systems ready";
  const providerRows = modelProviderRows;
  const researchRows = [
    { service: "X (Twitter)", sub: "Search and monitor posts", type: "Social", logo: "X", status: xConnected ? "Connected" : "Needs token", connected: xConnected, action: "x" },
    { service: "Google Calendar", sub: "Read agenda and create approved blocks", type: "Calendar", logo: "Calendar", status: googleCalendarNeedsWriteReconnect ? "Read ready · reconnect to write" : googleCalendarConnected ? "Read/write ready" : state.connectors?.googleCalendar?.status === "needs consent" ? "Needs consent" : "Needs OAuth", connected: googleCalendarConnected, needsAttention: googleCalendarNeedsWriteReconnect, action: "googleCalendar" },
    { service: "Reddit", sub: "Monitor subreddits and posts", type: "Social", logo: "Reddit", status: redditConnected ? "Connected" : "Needs OAuth", connected: redditConnected, action: "reddit" },
    { service: "Linear", sub: "Read and update TRA issues", type: "Project", logo: "Linear", status: linearConnected ? "Connected" : state.connectors?.linear?.credentialStatus === "missing" ? "Needs key" : "Disabled", connected: linearConnected, action: "linear" },
  ];
  const visibleModelOptions = modelOptionsProvider === (editingProvider || model.provider) ? modelOptions : [];
  const openProvider = (provider) => {
    setModel({ enabled: true, provider, model: provider === state.model.provider ? state.model.model || defaultModelForProvider(provider) : defaultModelForProvider(provider), apiKey: "", baseUrl: provider === state.model.provider ? state.model.baseUrl || "" : "" });
    setModelOptions([]);
    setModelOptionsProvider(provider);
    setDetectError("");
    setEditingProvider(provider);
    setConnectorModal(false);
  };
  const openAudioBriefSettings = () => {
    setConnectorModal(false);
    window.setTimeout(() => document.getElementById("audio-briefs-settings")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const checkFfmpeg = async () => {
    setFfmpegBusy(true);
    setFfmpegMessage("");
    try {
      const result = await api("/api/runtime/ffmpeg");
      setFfmpegStatus(result.ffmpeg);
    } catch (error) {
      setFfmpegMessage(error.message);
    } finally {
      setFfmpegBusy(false);
    }
  };
  const installFfmpeg = async () => {
    const ok = window.confirm("Install FFmpeg with Homebrew now? Pillar Time will run a local Homebrew install so podcast audio can be processed.");
    if (!ok) return;
    setFfmpegBusy(true);
    setFfmpegMessage("Installing FFmpeg with Homebrew...");
    try {
      const result = await api("/api/runtime/ffmpeg/install", { method: "POST", body: JSON.stringify({ consent: true }) });
      setFfmpegStatus(result.ffmpeg);
      setFfmpegMessage(result.message || "FFmpeg installed successfully.");
    } catch (error) {
      setFfmpegMessage(error.message);
      await checkFfmpeg();
    } finally {
      setFfmpegBusy(false);
    }
  };
  const checkStt = async () => {
    setSettingsSttBusy(true);
    setSettingsSttMessage("");
    try {
      const result = await api("/api/runtime/stt");
      setSettingsSttStatus(result.stt);
    } catch (error) {
      setSettingsSttMessage(error.message);
    } finally {
      setSettingsSttBusy(false);
    }
  };
  const installSttModel = async () => {
    const ok = window.confirm("Download the local Whisper model now? This stores the speech-to-text model on this Mac for voice input and transcription.");
    if (!ok) return;
    setSettingsSttBusy(true);
    setSettingsSttMessage("Downloading Whisper model...");
    try {
      const result = await api("/api/runtime/stt/model/install", { method: "POST", body: JSON.stringify({}) });
      setSettingsSttStatus(result.stt);
      setSettingsSttMessage(result.message || "Whisper model downloaded.");
      await refresh();
    } catch (error) {
      setSettingsSttMessage(error.message);
      await checkStt();
    } finally {
      setSettingsSttBusy(false);
    }
  };
  const runSettingsHealthCheck = async () => {
    setHealthBusy(true);
    setHealthMessage("");
    try {
      const [ffmpegRuntime, sttRuntime] = await Promise.all([
        api("/api/runtime/ffmpeg"),
        api("/api/runtime/stt"),
      ]);
      setFfmpegStatus(ffmpegRuntime.ffmpeg);
      setSettingsSttStatus(sttRuntime.stt);
      await refresh();
      setHealthMessage("Health check refreshed. Review any warnings above before relying on connected workflows.");
    } catch (error) {
      setHealthMessage(error.message || "Health check failed.");
    } finally {
      setHealthBusy(false);
    }
  };
  const reopenOnboarding = async () => {
    const ok = window.confirm("Reopen first-run onboarding? Pillar Time will return to the welcome flow, but your saved settings, connectors, and local data stay in place.");
    if (!ok) return;
    setSettingsMessage("");
    try {
      await mutate("/api/onboarding/reset", {});
      setSettingsMessage("First-run onboarding reopened.");
    } catch (error) {
      setSettingsMessage(error.message || "Could not reopen onboarding.");
    }
  };
  const updateTone = desktopUpdate?.status === "current" || desktopUpdate?.status === "installed" ? "ok" : desktopUpdate?.status === "error" ? "warn" : "muted";
  const updateLabel = desktopUpdate?.status === "available"
    ? "Update available"
    : desktopUpdate?.status === "installing"
      ? "Installing"
      : desktopUpdate?.status === "installed"
        ? "Restart required"
        : desktopUpdate?.status === "current"
          ? "Up to date"
          : "Desktop only";
  return <Page
    title="Settings"
    desc="Configure the models, services, and APIs used to analyze, research, and deliver your brief."
    action={<div className="page-actions"><Button icon="templates" onClick={reopenOnboarding}>Reopen onboarding</Button><Button icon="plus" kind="primary" onClick={() => setConnectorModal(true)}>Add connector</Button></div>}
    wide
  >
    {settingsMessage && <p className={settingsMessage.includes("Could not") ? "warn-text" : "ok-text"}>{settingsMessage}</p>}
    <div className="settings-dashboard">
      {desktopUpdate?.isDesktop && <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon blue"><Icon name="download" /></span><div><h2>App Updates</h2><p>Install signed Pillar Time desktop releases from GitHub.</p></div></div>
          <Badge tone={updateTone}>{updateLabel}</Badge>
        </div>
        <div className="connector-row dependency-row">
          <div className="connector-name"><span className="source-icon-box"><Icon name="download" /></span><div><strong>Pillar Time desktop</strong><small>Current version {desktopUpdate.version || "unknown"}</small></div></div>
          <span>GitHub Releases</span>
          <Badge tone={updateTone}>{desktopUpdate.update?.version ? `v${desktopUpdate.update.version}` : updateLabel}</Badge>
          <span>{desktopUpdate.progress || desktopUpdate.message || "Check for signed updates."}</span>
          <div className="row tight-row">
            <Button type="button" icon="run" onClick={() => desktopUpdate.checkForUpdates()} disabled={desktopUpdate.status === "checking" || desktopUpdate.status === "installing"}>{desktopUpdate.status === "checking" ? "Checking..." : "Check"}</Button>
            {desktopUpdate.status === "available" && <Button type="button" icon="download" kind="primary" onClick={desktopUpdate.installUpdate}>Install</Button>}
            {desktopUpdate.status === "installed" && <Button type="button" icon="restart" kind="primary" onClick={desktopUpdate.restartApp}>Restart</Button>}
          </div>
        </div>
        <div className={`notice ${desktopUpdate.status === "error" ? "notice-warn" : ""}`}>
          <strong>{desktopUpdate.status === "available" ? "A signed update is ready" : desktopUpdate.status === "installed" ? "Restart to finish updating" : "Automatic update checks are enabled"}</strong>
          <span>{desktopUpdate.message || "Pillar Time checks once on startup and lets you install from Settings."}</span>
          <span>Endpoint: {desktopUpdate.endpoint || "unknown"}</span>
          <span>Last checked: {desktopUpdate.lastCheckedAt ? new Date(desktopUpdate.lastCheckedAt).toLocaleString() : "not checked yet"}</span>
          {desktopUpdate.update?.currentVersion && <span>Updater current version: {desktopUpdate.update.currentVersion}</span>}
          {desktopUpdate.lastError && <span>Raw error: {desktopUpdate.lastError}</span>}
        </div>
      </section>}
      <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon purple"><Icon name="run" /></span><div><h2>Models for Analysis</h2><p>AI models used to analyze information and generate your brief.</p></div></div>
          <Badge>{providerRows.length} providers</Badge>
        </div>
        <div className="provider-card-grid">
          {providerRows.map((row) => {
            const active = state.model.provider === row.provider;
            return <div className={`provider-card ${active ? "selected" : ""}`} key={row.provider}>
              <div className="connector-name"><BrandLogo name={row.logo} /><div><strong>{row.name}</strong><small>{row.sub}</small></div></div>
              <Badge tone={active && modelConnected ? "ok" : active ? "warn" : "muted"}>{active ? (modelConnected ? "Selected" : "Needs setup") : "Available"}</Badge>
              {active && state.model.model && <small className="provider-model">{state.model.model}</small>}
              <Button type="button" icon="pencil" onClick={() => openProvider(row.provider)}>{active ? "Change" : "Set up"}</Button>
            </div>;
          })}
        </div>
      </section>

      <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon blue"><BrandLogo name="Telegram" /></span><div><h2>Delivery Services</h2><p>Services used to deliver briefs and alerts.</p></div></div>
          <Badge>1 connector</Badge>
        </div>
        <div className="connector-row">
          <div className="connector-name"><BrandLogo name="Telegram" /><div><strong>Telegram</strong><small>Deliver briefs and alerts</small></div></div>
          <span>Messaging</span>
          <Badge tone={telegramConnected ? "ok" : "warn"}>{telegramConnected ? "Connected" : "Needs setup"}</Badge>
          <span>{state.telegram?.lastCheckedAt ? relativeTime(state.telegram.lastCheckedAt) : "-"}</span>
          <Button icon="telegram" onClick={() => setTelegramModal(true)}>Edit</Button>
        </div>
      </section>

      <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon green"><Icon name="search" /></span><div><h2>Research APIs</h2><p>External APIs and platforms used to gather information.</p></div></div>
          <Badge>{researchRows.filter((row) => row.connected).length} connectors</Badge>
        </div>
        <div className="connector-table">
          {researchRows.map((row) => <div className="connector-row" key={row.service}>
            <div className="connector-name"><BrandLogo name={row.logo} /><div><strong>{row.service}</strong><small>{row.sub}</small></div></div>
            <span>{row.type}</span>
            <Badge tone={row.needsAttention ? "warn" : row.connected ? "ok" : "muted"}>{row.status}</Badge>
            <span>{row.needsAttention ? "Needs reconnect for writes" : row.connected ? "Ready" : "-"}</span>
            <Button type="button" icon="pencil" onClick={() => row.action === "x" ? setXModal(true) : row.action === "googleCalendar" ? setGoogleCalendarModal(true) : row.action === "reddit" ? setRedditModal(true) : row.action === "linear" ? setLinearModal(true) : null}>{row.action === "x" || row.action === "googleCalendar" || row.action === "reddit" || row.action === "linear" ? "Edit" : "View"}</Button>
          </div>)}
        </div>
      </section>

      <section className="panel connector-card">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon"><Icon name="settings" /></span><div><h2>Local system dependencies</h2><p>Host tools used by local-only workflows.</p></div></div>
          <Badge tone={ffmpegStatus?.available && sttStatus?.available ? "ok" : "warn"}>{ffmpegStatus?.available && sttStatus?.available ? "Ready" : "Needs setup"}</Badge>
        </div>
        <div className="connector-row dependency-row">
          <div className="connector-name"><span className="source-icon-box"><Icon name="mic" /></span><div><strong>Whisper speech-to-text</strong><small>Local STT for voice input and podcast transcription.</small></div></div>
          <span>Bundled binary + model</span>
          <Badge tone={sttStatus?.available ? "ok" : "warn"}>{sttStatus?.available ? "Ready" : "Unavailable"}</Badge>
          <span>{sttStatus?.modelName || "tiny.en"}</span>
          <div className="row tight-row">
            <Button type="button" icon="run" onClick={checkStt} disabled={sttBusy}>{sttBusy ? "Checking..." : "Re-check"}</Button>
            {sttStatus?.binaryAvailable && !sttStatus?.modelAvailable && <Button type="button" icon="download" kind="primary" onClick={installSttModel} disabled={sttBusy}>{sttBusy ? "Downloading..." : "Download model"}</Button>}
          </div>
        </div>
        <div className={`notice ${sttStatus?.available ? "" : "notice-warn"}`}>
          <strong>{sttStatus?.available ? "Local speech-to-text is enabled" : "Local speech-to-text is disabled"}</strong>
          <span>{sttMessage || sttStatus?.message || "Checking local Whisper availability..."}</span>
          {!sttStatus?.binaryAvailable && <span>For self-hosted installs, set WHISPER_CPP_PATH. For desktop releases, bundle whisper-cli in vendor/whisper/bin before building.</span>}
        </div>
        <div className="connector-row dependency-row">
          <div className="connector-name"><span className="source-icon-box"><Icon name="Podcast" /></span><div><strong>FFmpeg</strong><small>Required for local podcast transcription.</small></div></div>
          <span>Host binary</span>
          <Badge tone={ffmpegStatus?.available ? "ok" : "warn"}>{ffmpegStatus?.available ? "Installed" : "Unavailable"}</Badge>
          <span>{ffmpegStatus?.path || "Not found"}</span>
          <div className="row tight-row">
            <Button type="button" icon="run" onClick={checkFfmpeg} disabled={ffmpegBusy}>{ffmpegBusy ? "Checking..." : "Re-check"}</Button>
            {!ffmpegStatus?.available && ffmpegStatus?.installable && <Button type="button" icon="download" kind="primary" onClick={installFfmpeg} disabled={ffmpegBusy}>{ffmpegBusy ? "Installing..." : "Install FFmpeg"}</Button>}
          </div>
        </div>
        <div className={`notice ${ffmpegStatus?.available ? "" : "notice-warn"}`}>
          <strong>{ffmpegStatus?.available ? "Podcast transcription is enabled" : "Podcast transcription is disabled"}</strong>
          <span>{ffmpegStatus?.message || "Checking FFmpeg availability..."}</span>
          {!ffmpegStatus?.available && !ffmpegStatus?.homebrewAvailable && <span>Homebrew is required for the one-click macOS installer. Install it from brew.sh, then return here.</span>}
          {ffmpegMessage && <span>{ffmpegMessage}</span>}
        </div>
      </section>

      <section className="panel connector-card" id="audio-briefs-settings">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon blue"><Icon name="volume" /></span><div><h2>Audio Briefs</h2><p>ElevenLabs text-to-speech for playable briefs and optional Telegram MP3 delivery.</p></div></div>
          <Badge tone={state.tts?.status === "ready" ? "ok" : "muted"}>{state.tts?.status === "ready" ? "Ready" : "Optional"}</Badge>
        </div>
        <ElevenLabsSetup state={state} mutate={mutate} refresh={refresh} compact />
      </section>

      <section className="panel connector-health">
        <div className="connector-head">
          <div className="connector-title"><span className="connector-icon green"><Icon name="audit" /></span><div><h2>Local health check</h2><p>SQLite is local. External writes remain approval-gated.</p></div></div>
          <Badge tone={healthTone}>{healthTitle}</Badge>
        </div>
        <div className={`notice ${healthWarnings.length ? "notice-warn" : ""}`}>
          <strong>{healthTitle}</strong>
          <span>{healthWarnings.length ? `${healthWarnings.length} item${healthWarnings.length === 1 ? "" : "s"} need review before every workflow is fully covered.` : "No blocking local health warnings detected from current state."}</span>
          {healthWarnings.slice(0, 4).map((warning) => <span key={warning}>- {warning}</span>)}
          {healthWarnings.length > 4 && <span>- {healthWarnings.length - 4} more warning{healthWarnings.length - 4 === 1 ? "" : "s"} visible in connector sections above.</span>}
          {healthMessage && <span>{healthMessage}</span>}
        </div>
        <Button type="button" icon="run" onClick={runSettingsHealthCheck} disabled={healthBusy}>{healthBusy ? "Checking..." : "Run health check"}</Button>
      </section>

      <section className="panel audit-settings">
        <div className="connector-head"><div className="connector-title"><span className="connector-icon"><Icon name="audit" /></span><div><h2>Audit Log</h2><p>State-changing actions are recorded here.</p></div></div><Badge>{state.auditLogs.length} entries</Badge></div>
        {state.auditLogs.length ? <table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Note</th></tr></thead><tbody>{state.auditLogs.slice(0, 12).map((a) => <tr key={a.id}><td className="mono">{new Date(a.ts).toLocaleString()}</td><td>{a.actor}</td><td><Badge>{a.action}</Badge></td><td className="mono">{a.entityType}:{a.entityId}</td><td>{a.note}</td></tr>)}</tbody></table> : <Empty icon="audit" title="No audit entries" body="The first state-changing action will create the first audit log." />}
      </section>
    </div>
    {connectorModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConnectorModal(false); }}>
      <div className="modal-card connector-modal" role="dialog" aria-modal="true" aria-label="Add connector">
        <div className="modal-head"><div><h2>Add connector</h2><p>Choose the connector you want to configure.</p></div><button type="button" aria-label="Close connector picker" onClick={() => setConnectorModal(false)}><Icon name="x" /></button></div>
        <div className="connector-picker-grid">
          <button type="button" onClick={() => openProvider("openai")}><BrandLogo name="openai" /><strong>OpenAI</strong><span>Add or switch to OpenAI models.</span></button>
          <button type="button" onClick={() => openProvider("anthropic")}><BrandLogo name="anthropic" /><strong>Anthropic</strong><span>Add or switch to Claude models.</span></button>
          <button type="button" onClick={() => openProvider("openrouter")}><BrandLogo name="openrouter" /><strong>OpenRouter</strong><span>Add routed model access.</span></button>
          <button type="button" onClick={() => openProvider("gemini")}><BrandLogo name="gemini" /><strong>Gemini</strong><span>Add or switch to Google Gemini models.</span></button>
          <button type="button" onClick={() => openProvider("xai")}><BrandLogo name="xai" /><strong>Grok</strong><span>Add or switch to xAI Grok models.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); setTelegramModal(true); }}><BrandLogo name="Telegram" /><strong>Telegram delivery</strong><span>Bot token, chat ID, and command routing.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); setXModal(true); }}><BrandLogo name="X" /><strong>X search API</strong><span>Official bearer-token recent search.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); setGoogleCalendarModal(true); }}><BrandLogo name="Calendar" /><strong>Google Calendar</strong><span>Read today's agenda into each brief.</span></button>
          <button type="button" onClick={openAudioBriefSettings}><Icon name="volume" /><strong>ElevenLabs audio</strong><span>Jump to the Audio Briefs settings below.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); setRedditModal(true); }}><BrandLogo name="Reddit" /><strong>Reddit OAuth API</strong><span>Official app-only OAuth for subreddit sources.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); setLinearModal(true); }}><BrandLogo name="Linear" /><strong>Linear</strong><span>Read and update project issues.</span></button>
          <button type="button" onClick={() => { setConnectorModal(false); location.hash = "sources"; }}><Icon name="sources" /><strong>Manage sources</strong><span>Add, pause, resume, or delete monitored feeds and searches.</span></button>
        </div>
        <p className="hint">Provider credentials live on this Settings page. Source management is available from Context &gt; Sources.</p>
      </div>
    </div>}
    {editingProvider && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModelProviderSetup(); }}>
      <form className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Model provider setup" onSubmit={saveModel}>
        <div className="modal-head"><div><h2>{providerRows.find((row) => row.provider === editingProvider)?.name || "Model provider"}</h2><p>Paste a provider key, choose a model, and save it as the active model provider.</p></div><button type="button" aria-label="Close model provider setup" onClick={closeModelProviderSetup}><Icon name="x" /></button></div>
        <Field label="API key" type="password" value={model.apiKey} onChange={(apiKey) => setModel({ ...model, apiKey })} placeholder={(state.model.providerCredentials?.[editingProvider]?.apiKeySaved || (state.model.provider === editingProvider && state.model.apiKeySaved)) ? "Saved. Paste a new key to replace it." : "Paste provider API key"} />
        {visibleModelOptions.length ? <Select label="Model" value={model.model} onChange={(value) => setModel({ ...model, model: value })} options={visibleModelOptions.includes(model.model) || !model.model ? visibleModelOptions : [model.model, ...visibleModelOptions]} /> : <Field label="Model" value={model.model} onChange={(value) => setModel({ ...model, model: value })} placeholder={detecting ? "Detecting models..." : "Enter a model or paste key for auto-detect"} />}
        {detectError && <p className="warn-text">{detectError}</p>}
        <div className="modal-actions"><Button type="button" onClick={closeModelProviderSetup}>Cancel</Button><Button type="button" icon="search" onClick={detectModels} disabled={detecting}>{detecting ? "Detecting..." : "Detect models"}</Button><Button icon="save" kind="primary">Save provider</Button></div>
      </form>
    </div>}
    {telegramModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeTelegramModal(); }}>
      <form className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Telegram delivery setup" onSubmit={saveTelegram}>
        <div className="modal-head"><div><h2>Telegram delivery</h2><p>Configure bot delivery and command access.</p></div><button type="button" aria-label="Close Telegram setup" onClick={closeTelegramModal}><Icon name="x" /></button></div>
        <Field label="Bot token" type="password" value={telegramForm.botToken} onChange={(botToken) => setTelegramForm({ ...telegramForm, botToken })} placeholder={state.telegram.botToken ? "Configured. Paste a new token to replace it." : "123456:ABC..."} />
        <Field label="Chat ID" value={telegramForm.chatId} onChange={(chatId) => setTelegramForm({ ...telegramForm, chatId })} placeholder="-1001234567890 or 123456789" />
        <Field label="Allowed users" value={telegramForm.allowedUsers} onChange={(allowedUsers) => setTelegramForm({ ...telegramForm, allowedUsers })} placeholder="username, teammate, 123456789" />
        {telegramSetupMessage && <p className="warn-text">{telegramSetupMessage}</p>}
        <div className="modal-actions"><Button type="button" onClick={closeTelegramModal}>Cancel</Button><Button icon="save" kind="primary">Save Telegram</Button></div>
      </form>
    </div>}
    {xModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeXModal(); }}>
      <form className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="X search API setup" onSubmit={saveXConnector}>
        <div className="modal-head"><div><h2>X search API</h2><p>Add or replace the official bearer token used for X search.</p></div><button type="button" aria-label="Close X API setup" onClick={closeXModal}><Icon name="x" /></button></div>
        <Field label="Bearer token" type="password" value={xConnector.apiKey} onChange={(apiKey) => setXConnector({ ...xConnector, apiKey })} placeholder={state.connectors?.x?.apiKeySaved ? "Saved. Paste a new token to replace it." : "Paste X bearer token"} />
        {xMessage && <p className="warn-text">{xMessage}</p>}
        <div className="modal-actions"><Button type="button" onClick={closeXModal}>Cancel</Button><Button icon="save" kind="primary">Save X API</Button></div>
      </form>
    </div>}
    {redditModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRedditModal(); }}>
      <form className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Reddit OAuth setup" onSubmit={saveRedditConnector}>
        <div className="modal-head"><div><h2>Reddit OAuth API</h2><p>Use an official Reddit app token for subreddit sources instead of public RSS/JSON endpoints.</p></div><button type="button" aria-label="Close Reddit setup" onClick={closeRedditModal}><Icon name="x" /></button></div>
        <div className={`notice ${redditConnected ? "" : "notice-warn"}`}>
          <strong>{redditConnected ? "Reddit OAuth ready" : "Reddit OAuth not configured"}</strong>
          <span>{state.connectors?.reddit?.lastError || redditMessage || "Create a Reddit app, then paste the client ID and optional client secret here."}</span>
        </div>
        <Select label="Grant type" value={redditConnector.grantType} onChange={(grantType) => setRedditConnector({ ...redditConnector, grantType })} options={["client_credentials", "installed_client"]} />
        <Field label="Client ID" value={redditConnector.clientId} onChange={(clientId) => setRedditConnector({ ...redditConnector, clientId })} placeholder={state.connectors?.reddit?.apiKeySaved ? "Saved. Paste a new client ID to replace it." : "Paste Reddit app client ID"} />
        <Field label="Client secret" type="password" value={redditConnector.clientSecret} onChange={(clientSecret) => setRedditConnector({ ...redditConnector, clientSecret })} placeholder={state.connectors?.reddit?.apiKeySaved ? "Saved if configured. Paste to replace it." : "Required for script/web app; blank for installed app"} />
        {redditConnector.grantType === "installed_client" && <Field label="Device ID" value={redditConnector.deviceId} onChange={(deviceId) => setRedditConnector({ ...redditConnector, deviceId })} placeholder="DO_NOT_TRACK_THIS_DEVICE" />}
        {redditMessage && <p className={redditMessage.includes("ready") || redditMessage.includes("saved") ? "ok-text" : "warn-text"}>{redditMessage}</p>}
        <div className="modal-actions"><Button type="button" onClick={closeRedditModal}>Cancel</Button><Button type="button" icon="run" onClick={testRedditConnector}>Test</Button><Button icon="save" kind="primary">Save Reddit OAuth</Button></div>
      </form>
    </div>}
    {linearModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeLinearModal(); }}>
      <div className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Linear setup">
        <div className="modal-head"><div><h2>Linear</h2><p>Paste a personal API key to read and update Linear issues.</p></div><button type="button" aria-label="Close Linear setup" onClick={closeLinearModal}><Icon name="x" /></button></div>
        <div className={`notice ${linearConnected ? "" : "notice-warn"}`}>
          <strong>{linearConnected ? "Linear ready" : state.connectors?.linear?.credentialStatus === "missing" ? "Linear API key needed" : "Linear disabled"}</strong>
          <span>{state.connectors?.linear?.lastError || linearMessage || "Create a Linear personal API key, paste it here, then test and save."}</span>
        </div>
        <Field label="Linear personal API key" type="password" value={linearConnector.apiKey} onChange={(apiKey) => setLinearConnector({ ...linearConnector, apiKey })} placeholder={state.connectors?.linear?.apiKeySaved ? "Saved. Paste a new key to replace it." : state.connectors?.linear?.credentialStatus === "env" ? "Using LINEAR_API_KEY fallback. Paste to save locally." : "lin_api_..."} />
        <label className="check"><input type="checkbox" checked={linearConnector.enabled} onChange={(event) => setLinearConnector({ ...linearConnector, enabled: event.target.checked })} /> Enable Linear connector</label>
        <p className="hint">Keys are stored locally in the connector credential table and never returned to the UI. Existing `LINEAR_API_KEY` values still work as a fallback.</p>
        {linearMessage && <p className={linearMessage.includes("ready") || linearMessage.includes("enabled") ? "ok-text" : "warn-text"}>{linearMessage}</p>}
        <div className="modal-actions">
          <Button type="button" onClick={closeLinearModal}>Cancel</Button>
          <Button type="button" icon="run" onClick={testLinearConnector}>Test</Button>
          {state.connectors?.linear?.enabled ? <Button type="button" icon="trash" onClick={disableLinearConnector}>Disable</Button> : null}
          <Button type="button" icon="save" onClick={enableLinearConnector}>Save</Button>
          <Button type="button" icon="linear" kind="primary" onClick={() => { if (closeLinearModal()) location.hash = "linear"; }}>Open Linear</Button>
        </div>
      </div>
    </div>}
    {googleCalendarModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeGoogleCalendarModal(); }}>
      <form className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Google Calendar setup" onSubmit={startGoogleCalendarOAuth}>
        <div className="modal-head"><div><h2>Google Calendar</h2><p>Connect calendar access so Pillar Time can read today's agenda and create approved schedule blocks.</p></div><button type="button" aria-label="Close Google Calendar setup" onClick={closeGoogleCalendarModal}><Icon name="x" /></button></div>
        <div className="notice">
          <strong>Calendar permissions</strong>
          <span>Pillar Time reads calendar events and calendar names for planning. It only creates calendar blocks after you approve a proposed schedule.</span>
        </div>
        <p className="hint">Uses the configured Google OAuth client. Tokens stay in this app's local data store.</p>
        {googleCalendarNeedsWriteReconnect && <div className="notice notice-warn">
          <strong>Reconnect required for approved calendar writes</strong>
          <span>Your current Google token can read calendar context, but it does not include the write scope needed to create approved schedule blocks. Reconnect Google Calendar, approve the requested permissions, then retry the calendar proposal.</span>
        </div>}
        <div className={`notice ${googleCalendarConnected ? "" : "notice-warn"}`}>
          <strong>{googleCalendarNeedsWriteReconnect ? "Google Calendar read access ready" : googleCalendarConnected ? "Google Calendar read/write ready" : "Google Calendar not connected"}</strong>
          <span>{state.connectors?.googleCalendar?.lastError || googleCalendarMessage || "Connect Google, then choose which calendars should feed your daily brief."}</span>
        </div>
        {googleCalendarConnected && <div className="connector-fields">
          <div className="connector-label">Calendars</div>
          {(state.connectors?.googleCalendar?.calendars || []).length ? state.connectors.googleCalendar.calendars.map((calendar) => <label className="check" key={calendar.id}>
            <input type="checkbox" checked={googleCalendarSelection.includes(calendar.id)} onChange={() => toggleGoogleCalendar(calendar.id)} />
            {calendar.summary || calendar.id}{calendar.primary ? " (primary)" : ""}
          </label>) : <p className="hint">Refresh calendars to load your available Google calendars.</p>}
        </div>}
        {googleCalendarMessage && <p className={googleCalendarMessage.includes("ready") || googleCalendarMessage.includes("opened") || googleCalendarMessage.includes("disconnected") ? "ok-text" : "warn-text"}>{googleCalendarMessage}</p>}
        <div className="modal-actions"><Button type="button" onClick={closeGoogleCalendarModal}>Cancel</Button>{googleCalendarConnected && <Button type="button" icon="run" onClick={refreshGoogleCalendars}>Refresh calendars</Button>}{googleCalendarConnected && <Button type="button" icon="save" onClick={saveGoogleCalendarSelection}>Save calendars</Button>}<Button type="button" icon="run" onClick={testGoogleCalendar}>Test</Button>{googleCalendarConnected && <Button type="button" icon="trash" onClick={disconnectGoogleCalendar}>Disconnect</Button>}<Button icon="save" kind="primary">{googleCalendarNeedsWriteReconnect ? "Reconnect for Calendar Writes" : googleCalendarConnected ? "Reconnect Google" : "Connect Google"}</Button></div>
      </form>
    </div>}
  </Page>;
}

function Field({ label, value, onChange, ...props }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} {...props} /></label>;
}
function TextArea({ label, value, onChange, rows = 4, ...props }) {
  return <label className="field"><span>{label}</span><textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...props} /></label>;
}
function Select({ label, value, onChange, options }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => {
    const value = typeof o === "string" ? o : o.value;
    const label = typeof o === "string" ? o : o.label;
    return <option key={value} value={value}>{label}</option>;
  })}</select></label>;
}

function routeFromHash() {
  const route = location.hash.replace(/^#\/?/, "") || "today";
  if (route === "lenses") return "briefSetup";
  return route;
}

function App() {
  const [route, setRoute] = React.useState(routeFromHash());
  const [runState, setRunState] = React.useState({ status: "idle", stepIndex: 0, error: "" });
  const { state, error, mutate, refresh } = useConsoleState();
  const desktopUpdate = useDesktopUpdates();
  const requestRoute = React.useCallback((nextRoute) => {
    const requested = nextRoute || "overview";
    const next = requested === "lenses" ? "briefSetup" : requested;
    if (route === "briefSetup" && next !== "briefSetup" && window.__pillarBriefUnsavedBriefSetup) {
      const leave = window.confirm("You have unsaved brief setup changes. Leave without saving?");
      if (!leave) {
        location.hash = "briefSetup";
        return;
      }
      window.__pillarBriefUnsavedBriefSetup = false;
    }
    setRoute(next);
  }, [route]);
  React.useEffect(() => { location.hash = route; }, [route]);
  React.useEffect(() => {
    const onHash = () => requestRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [requestRoute]);
  const runWorkflow = async ({ runType = "executive_day", trigger } = {}) => {
    const stepSource = runType === "executive_day" ? state?.runtime?.executiveWorkflowSteps : state?.runtime?.workflowSteps;
    const steps = stepSource?.length ? stepSource : [{ key: "run", name: runType === "executive_day" ? "Generating day plan" : "Generating brief" }];
    setRunState({ status: "running", stepIndex: 0, error: "", steps, runType });
    requestRoute("generating");
    const applyRunState = (run) => {
      const runSteps = run?.steps?.length ? run.steps : steps;
      const activeIndex = runSteps.findIndex((step) => step.status === "active");
      const doneIndex = runSteps.filter((step) => step.status === "done").length;
      const nextStatus = run?.status === "completed" ? "done" : run?.status === "failed" ? "error" : "running";
      setRunState({
        status: nextStatus,
        stepIndex: activeIndex >= 0 ? activeIndex : Math.min(runSteps.length - 1, doneIndex),
        error: run?.error || "",
        steps: runSteps,
        runId: run?.id,
        runType: run?.artifact?.runType || runType,
      });
      return nextStatus;
    };
    try {
      const result = await api("/api/workflow-runs", { method: "POST", body: JSON.stringify({ runType, trigger: trigger || (runType === "executive_day" ? "Manual · Generate executive day plan" : "Manual · Generate and deliver brief") }) });
      let run = result.run;
      let nextStatus = applyRunState(run);
      const pollStartedAt = Date.now();
      while (run?.id && nextStatus === "running") {
        if (Date.now() - pollStartedAt > 180000) {
          throw new Error("Generation is taking too long. The app stopped waiting so the screen does not hang; refresh Today and start a new run if it did not finish.");
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        const polled = await api(`/api/workflow-runs/${run.id}`);
        run = polled.run;
        nextStatus = applyRunState(run);
      }
      await refresh();
      if (nextStatus === "done") setTimeout(() => requestRoute(runType === "executive_day" ? "today" : "briefs"), 850);
      if (nextStatus === "error") throw new Error(run?.error || "Workflow failed");
      return { run };
    } catch (runError) {
      setRunState((current) => ({ ...current, status: "error", error: runError.message }));
      throw runError;
    }
  };
  if (error) return <div className="boot boot-error">
    <strong>Pillar Time could not reach its local backend.</strong>
    <p>{error}</p>
    <button type="button" onClick={refresh}>Retry connection</button>
  </div>;
  if (!state) return <div className="boot">Loading Pillar Time...</div>;
  if (!state.onboarding?.completed) return <Onboarding state={state} mutate={mutate} refresh={refresh} />;
  const screens = {
    today: <Today state={state} mutate={mutate} runWorkflow={() => runWorkflow({ runType: "executive_day" })} setRoute={requestRoute} />,
    planner: <Planner state={state} mutate={mutate} />,
    reminders: <Reminders state={state} mutate={mutate} />,
    reviews: <Reviews state={state} mutate={mutate} />,
    meetings: <Meetings state={state} mutate={mutate} />,
    documents: <Documents state={state} mutate={mutate} />,
    overview: <Overview state={state} setRoute={requestRoute} runWorkflow={() => runWorkflow({ runType: "executive_day" })} mutate={mutate} />,
    briefs: <Briefs state={state} runWorkflow={() => runWorkflow({ runType: "intelligence" })} refresh={refresh} />,
    sources: <Sources state={state} mutate={mutate} />,
    generating: <GeneratingBrief runState={runState} />,
    briefSetup: <BriefSetup state={state} mutate={mutate} />,
    linear: <Linear state={state} refresh={refresh} />,
    trustedContext: <TrustedContext state={state} mutate={mutate} />,
    approvals: <Approvals state={state} mutate={mutate} />,
    telegram: <Telegram state={state} mutate={mutate} refresh={refresh} />,
    settings: <Settings state={state} mutate={mutate} refresh={refresh} desktopUpdate={desktopUpdate} />,
  };
  return <Shell route={route} setRoute={requestRoute} state={state} desktopUpdate={desktopUpdate}>{screens[route] || screens.overview}</Shell>;
}

createRoot(document.getElementById("root")).render(<App />);
