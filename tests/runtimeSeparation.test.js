import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const serverSource = fs.readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const tauriSource = fs.readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
const envExample = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const mainSource = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("Pillar Time runtime uses a dedicated backend port", () => {
  assert.match(serverSource, /process\.env\.PORT \|\| 42818/);
  assert.match(tauriSource, /const BACKEND_PORT: u16 = 42818;/);
  assert.doesNotMatch(envExample, /PORT=42817/);
  assert.match(envExample, /PORT=42818/);
});

test("Pillar Time does not inherit shared Pillar app runtime variables", () => {
  for (const source of [serverSource, tauriSource, envExample]) {
    assert.doesNotMatch(source, /PILLAR_APP_MODE/);
    assert.doesNotMatch(source, /PILLAR_DESKTOP/);
    assert.doesNotMatch(source, /PILLAR_BACKEND_DIR/);
    assert.doesNotMatch(source, /PILLAR_DATA_DIR/);
    assert.doesNotMatch(source, /PILLAR_DB_PATH/);
    assert.doesNotMatch(source, /PILLAR_GOOGLE_CALENDAR_/);
    assert.doesNotMatch(source, /PILLAR_REDDIT_/);
    assert.doesNotMatch(source, /(?<!PILLAR_TIME_)REDDIT_CLIENT_ID/);
    assert.doesNotMatch(source, /(?<!PILLAR_TIME_)REDDIT_CLIENT_SECRET/);
  }
});

test("Today generation defaults to executive day planning instead of intelligence", () => {
  assert.match(serverSource, /executeExecutiveDayWorkflow/);
  assert.match(serverSource, /req\.body\?\.runType === "intelligence" \? "intelligence" : "executive_day"/);
  assert.match(mainSource, /Generate Day Plan/);
  assert.match(mainSource, /runWorkflow\(\{ runType: "executive_day" \}\)/);
  assert.match(mainSource, /runWorkflow\(\{ runType: "intelligence" \}\)/);
});

test("Executive day runs and Today view stay separated from intelligence artifacts", () => {
  assert.match(serverSource, /run_type TEXT NOT NULL DEFAULT 'intelligence'/);
  assert.match(serverSource, /run_type='executive_day'/);
  assert.match(serverSource, /latestCompletedExecutiveArtifact/);
  assert.doesNotMatch(serverSource, /WHERE s\.type='Calendar' AND ni\.published_at/);
  assert.match(mainSource, /latestExecutiveArtifact/);
  assert.match(mainSource, /runType === "executive_day" \? "today" : "briefs"/);
});

test("Executive calendar proposals are approval-gated and surfaced in Today", () => {
  assert.match(serverSource, /calendar\.proposed_schedule/);
  assert.match(serverSource, /app\.post\("\/api\/approvals\/:id\/execute"/);
  assert.match(serverSource, /Reconnect Google Calendar to allow approved schedule writes/);
  assert.match(mainSource, /ProposedCalendarTiles/);
  assert.match(mainSource, /Approve Calendar/);
  assert.match(mainSource, /Retry Calendar Write/);
  assert.match(mainSource, /Approved, but not written to Google Calendar/);
  assert.match(mainSource, /Open Settings/);
  assert.match(mainSource, /Read ready · reconnect to write/);
  assert.match(mainSource, /Reconnect required for approved calendar writes/);
  assert.match(mainSource, /Reconnect for Calendar Writes/);
  assert.match(mainSource, /Add Context & Regenerate/);
  assert.match(mainSource, /identity\.self_statement/);
  assert.match(mainSource, /profile\.standing_commitment/);
});

test("Linear connector cannot be falsely enabled without credentials", () => {
  assert.match(serverSource, /res\.status\(400\)\.json\(\{ error: message, state: state\(\) \}\)/);
  assert.match(serverSource, /Paste a Linear personal API key, or configure LINEAR_API_KEY before enabling Linear\./);
  assert.match(mainSource, /Paste a Linear personal API key, or skip Linear for now\./);
  assert.match(mainSource, /Paste a Linear personal API key, or leave Linear disabled for now\./);
});

test("Onboarding explains setup context and avoids stale recovery copy", () => {
  assert.match(mainSource, /Protect deep work before noon/);
  assert.match(mainSource, /Why Google may show Transformation Agency/);
  assert.match(mainSource, /Google Calendar is connected\./);
  assert.match(mainSource, /This can be daily or weekly\. You can change it later from Settings\./);
  assert.match(mainSource, /Fix required step/);
  assert.doesNotMatch(mainSource, /change it later from the home screen/);
});

test("First-run controls avoid misleading defaults and internal labels", () => {
  assert.match(mainSource, /const defaultOpenAiModel = "gpt-4\.1"/);
  assert.doesNotMatch(mainSource, /gpt-5\.4-mini/);
  assert.match(mainSource, /function displayCadence/);
  assert.match(mainSource, /Master reminders are off/);
  assert.match(mainSource, /Quiet by default/);
  assert.match(mainSource, /is-gated/);
  assert.match(mainSource, /Generate works with available local context/);
  assert.match(mainSource, /Missing connectors will be reported/);
  assert.match(mainSource, /Local health check/);
  assert.match(mainSource, /runSettingsHealthCheck/);
  assert.match(mainSource, /No blocking local health warnings detected from current state/);
  assert.doesNotMatch(mainSource, /All systems operational/);
  assert.match(mainSource, /const reopenOnboarding/);
  assert.match(mainSource, /Reopen first-run onboarding\?/);
  assert.match(mainSource, /saved settings, connectors, and local data stay in place/);
  assert.match(mainSource, /Reopen onboarding/);
  assert.doesNotMatch(mainSource, /Run onboarding/);
});

test("Modal close buttons have accessible labels", () => {
  assert.match(mainSource, /aria-label="Close source editor"/);
  assert.match(mainSource, /aria-label="Close connector picker"/);
  assert.match(mainSource, /aria-label="Close model provider setup"/);
  assert.match(mainSource, /aria-label="Close Telegram setup"/);
  assert.match(mainSource, /aria-label="Close X API setup"/);
  assert.match(mainSource, /aria-label="Close Reddit setup"/);
  assert.match(mainSource, /aria-label="Close Linear setup"/);
  assert.match(mainSource, /aria-label="Close Google Calendar setup"/);
  assert.doesNotMatch(mainSource, /<button type="button" onClick=\{[^}]+\}><Icon name="x" \/><\/button>/);
});

test("Modal panels expose dialog semantics", () => {
  assert.match(mainSource, /role="dialog" aria-modal="true" aria-label=\{editingSource \? "Edit source" : "Add source"\}/);
  assert.match(mainSource, /className="modal-card live-preview-modal" role="dialog" aria-modal="true" aria-label="Live preview"/);
  assert.match(mainSource, /className="modal-card connector-modal" role="dialog" aria-modal="true" aria-label="Add connector"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Model provider setup"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Telegram delivery setup"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="X search API setup"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Reddit OAuth setup"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Linear setup"/);
  assert.match(mainSource, /className="modal-card connector-modal form" role="dialog" aria-modal="true" aria-label="Google Calendar setup"/);
});

test("Planning removal actions ask for confirmation before hiding active items", () => {
  assert.match(mainSource, /function Today\(\{ state, mutate, runWorkflow, setRoute \}\)/);
  assert.match(mainSource, /Remove "\$\{title\}" from Today's Three\? It will stop being protected for today, but the underlying task or source item will not be deleted\./);
  assert.match(mainSource, /onClick=\{\(\) => removeDailyCommitment\(item\)\}/);
  assert.match(mainSource, /Archive "\$\{title\}"\? It will leave the active planning backlog and stop showing as a Today candidate\./);
  assert.match(mainSource, /onClick=\{\(\) => archiveTask\(item\)\}/);
  assert.match(mainSource, /Archive "\$\{title\}"\? It will disappear from your active reminder list and stop scheduling future nudges\./);
  assert.match(mainSource, /onClick=\{\(\) => archiveReminder\(reminder\)\}/);
  assert.doesNotMatch(mainSource, /onClick=\{\(\) => mutate\(`\/api\/time\/commitments\/\$\{item\.id\}`, \{ \.\.\.item, status: "removed" \}, "PATCH"\)\}/);
  assert.doesNotMatch(mainSource, /onClick=\{\(\) => mutate\(`\/api\/time\/tasks\/\$\{item\.id\}`, \{ status: "archived" \}, "PATCH"\)\}/);
  assert.doesNotMatch(mainSource, /onClick=\{\(\) => mutate\(`\/api\/time\/reminders\/\$\{reminder\.id\}`, \{ archive: true \}, "PATCH"\)\}/);
});

test("High-use placeholder and table controls expose accessible labels", () => {
  assert.match(mainSource, /aria-label="Quick capture task or obligation"/);
  assert.match(mainSource, /aria-label="Important date title"/);
  assert.match(mainSource, /aria-label="Important date start date"/);
  assert.match(mainSource, /aria-label="Important date end date"/);
  assert.match(mainSource, /aria-label="Search sources"/);
  assert.match(mainSource, /aria-label=\{`State for \$\{issue\.identifier \|\| issue\.title\}`\}/);
  assert.match(mainSource, /aria-label=\{`Comment on \$\{issue\.identifier \|\| issue\.title\}`\}/);
  assert.match(mainSource, /aria-label="Search briefs"/);
  assert.match(mainSource, /aria-label="Starter commitment for Today's Three"/);
});

test("Delivery schedule selects expose accessible labels", () => {
  assert.match(mainSource, /aria-label="Delivery frequency"/);
  assert.match(mainSource, /aria-label="Delivery day"/);
  assert.match(mainSource, /aria-label="Delivery timezone"/);
  assert.match(mainSource, /aria-label="Onboarding delivery frequency"/);
  assert.match(mainSource, /aria-label="Onboarding delivery day"/);
  assert.match(mainSource, /aria-label="Onboarding delivery timezone"/);
});

test("Brief setup section action controls are labeled and guarded", () => {
  assert.match(mainSource, /const removeBriefSection = \(index\) => \{/);
  assert.match(mainSource, /Remove "\$\{label\}" from this brief setup\? This section will stop appearing in future generated briefs until you add it again\./);
  assert.match(mainSource, /aria-label=\{`Copy \$\{section\.label \|\| "section"\} \(not available yet\)`\}/);
  assert.match(mainSource, /title="Copy section is not available yet" disabled/);
  assert.match(mainSource, /aria-label=\{`Edit \$\{section\.label \|\| "section"\} inline`\}/);
  assert.match(mainSource, /title="Edit the title and prompt fields inline" disabled/);
  assert.match(mainSource, /aria-label=\{`Remove \$\{section\.label \|\| "section"\}`\}/);
  assert.match(mainSource, /onClick=\{\(\) => removeBriefSection\(index\)\}/);
  assert.match(mainSource, /aria-label=\{`Move \$\{section\.label \|\| "section"\} up`\}/);
  assert.match(mainSource, /aria-label=\{`Move \$\{section\.label \|\| "section"\} down`\}/);
  assert.doesNotMatch(mainSource, /<Button type="button" icon="copy" \/>/);
  assert.doesNotMatch(mainSource, /<Button type="button" icon="pencil" \/>/);
});

test("TextArea forwards helper props so onboarding guidance is rendered", () => {
  assert.match(mainSource, /function TextArea\(\{ label, value, onChange, rows = 4, \.\.\.props \}\)/);
  assert.match(mainSource, /<textarea rows=\{rows\} value=\{value\} onChange=\{\(e\) => onChange\(e\.target\.value\)\} \{\.\.\.props\} \/>/);
  assert.match(mainSource, /placeholder="Paste a statement, commitment list, or task notes here\."/);
  assert.match(mainSource, /placeholder="Preferences, working style, meeting prep rules, protected hours, delegation principles, communication tone, people or projects to remember\."/);
  assert.match(mainSource, /placeholder="Example: give me a skeptical investor, a product strategist, a policy watcher, and a media narrative lens\."/);
});

test("Help update menu exposes expanded state and keyboard dismissal", () => {
  assert.match(mainSource, /if \(event\.key === "Escape"\) setHelpOpen\(false\);/);
  assert.match(mainSource, /window\.addEventListener\("keydown", onKeyDown\)/);
  assert.match(mainSource, /window\.removeEventListener\("keydown", onKeyDown\)/);
  assert.match(mainSource, /aria-haspopup="menu" aria-expanded=\{helpOpen\} aria-controls="help-update-menu"/);
  assert.match(mainSource, /id="help-update-menu" className="help-menu" role="menu" aria-label="Help and update actions"/);
});

test("Desktop update restart asks before quitting the app", () => {
  assert.match(mainSource, /const restartApp = React\.useCallback\(\(\) => \{/);
  assert.match(mainSource, /Restart Pillar Time now to finish installing the update\? Any unsaved text or in-progress setup will be lost\./);
  assert.match(mainSource, /if \(!ok\) return;\n\s+desktopRuntime\.restartApp\(\);/);
  assert.doesNotMatch(mainSource, /const restartApp = React\.useCallback\(\(\) => desktopRuntime\.restartApp\(\), \[\]\);/);
});

test("Connector picker sends ElevenLabs users to audio settings", () => {
  assert.match(mainSource, /const openAudioBriefSettings = \(\) => \{/);
  assert.match(mainSource, /document\.getElementById\("audio-briefs-settings"\)\?\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(mainSource, /<section className="panel connector-card" id="audio-briefs-settings">\s*<div className="connector-head">\s*<div className="connector-title"><span className="connector-icon blue"><Icon name="volume" \/><\/span><div><h2>Audio Briefs<\/h2>/);
  assert.match(mainSource, /<button type="button" onClick=\{openAudioBriefSettings\}><Icon name="volume" \/><strong>ElevenLabs audio<\/strong><span>Jump to the Audio Briefs settings below\.<\/span><\/button>/);
  assert.doesNotMatch(mainSource, /<button type="button" onClick=\{\(\) => setConnectorModal\(false\)\}><Icon name="volume" \/><strong>ElevenLabs audio<\/strong><span>Use the Audio Briefs settings below\.<\/span><\/button>/);
});

test("Local dependency installers ask for consent before starting", () => {
  const ffmpegConsent = /Install FFmpeg with Homebrew now\? Pillar Time will run a local Homebrew install so podcast audio can be processed\./g;
  const whisperConsent = /Download the local Whisper model now\? This stores the speech-to-text model on this Mac for voice input and transcription\./g;
  assert.equal([...mainSource.matchAll(ffmpegConsent)].length, 2);
  assert.equal([...mainSource.matchAll(whisperConsent)].length, 2);
  assert.match(mainSource, /const ok = window\.confirm\("Install FFmpeg with Homebrew now\? Pillar Time will run a local Homebrew install so podcast audio can be processed\."\);\n\s+if \(!ok\) return;\n\s+setFfmpegBusy\(true\);/);
  assert.match(mainSource, /const ok = window\.confirm\("Download the local Whisper model now\? This stores the speech-to-text model on this Mac for voice input and transcription\."\);\n\s+if \(!ok\) return;\n\s+setSttBusy\(true\);/);
  assert.match(mainSource, /const ok = window\.confirm\("Download the local Whisper model now\? This stores the speech-to-text model on this Mac for voice input and transcription\."\);\n\s+if \(!ok\) return;\n\s+setSettingsSttBusy\(true\);/);
});

test("Backend connection errors offer retry and clear after recovery", () => {
  assert.match(mainSource, /setState\(\{ \.\.\.nextState, runtime: \{ \.\.\.\(nextState\.runtime \|\| \{\}\), ffmpeg: ffmpegRuntime\.ffmpeg, stt: sttRuntime\.stt \} \}\);\n\s+setError\(""\);/);
  assert.match(mainSource, /catch \{\n\s+setState\(nextState\);\n\s+setError\(""\);/);
  assert.match(mainSource, /if \(error\) return <div className="boot boot-error">/);
  assert.match(mainSource, /Pillar Time could not reach its local backend\./);
  assert.match(mainSource, /<button type="button" onClick=\{refresh\}>Retry connection<\/button>/);
  assert.doesNotMatch(mainSource, /API error: \{error\}/);
});

test("Onboarding exit actions surface failures instead of failing silently", () => {
  assert.match(mainSource, /const \[onboardingActionMessage, setOnboardingActionMessage\] = React\.useState\(""\);/);
  assert.match(mainSource, /setOnboardingActionMessage\(error\.message \|\| "Could not finish onboarding\. Try again or finish later\."\);/);
  assert.match(mainSource, /setOnboardingActionMessage\(error\.message \|\| "Could not leave onboarding yet\. Check the local backend and try again\."\);/);
  assert.match(mainSource, /\{onboardingActionMessage && <p className="warn-text onboarding-action-message">\{onboardingActionMessage\}<\/p>\}/);
  assert.doesNotMatch(mainSource, /const skipOnboarding = async \(\) => \{\n\s+await mutate\("\/api\/onboarding\/skip", \{\}\);\n\s+\};/);
  assert.doesNotMatch(mainSource, /catch \(error\) \{\n\s+setSourceMessage\(error\.message\);\n\s+\}\n\s+\};\n\s+const skipOnboarding/);
});

test("Telegram delivery timeouts are treated as pending acknowledgement, not failed runs", () => {
  assert.match(serverSource, /function telegramDeliveryStatus/);
  assert.match(serverSource, /async function deliverBriefToTelegramWithSoftTimeout/);
  assert.match(serverSource, /pendingAck: true/);
  assert.match(serverSource, /telegram\.delivery_ack_pending/);
  assert.match(serverSource, /telegram\.delivery_late_ack/);
  assert.match(serverSource, /updateWorkflowTelegramDelivery/);
  assert.match(mainSource, /function briefDeliveryBadge/);
  assert.match(mainSource, /function briefCompletionCopy/);
  assert.match(mainSource, /Check Telegram/);
  assert.match(mainSource, /Brief saved\. Check Telegram\./);
  assert.match(mainSource, /Check Telegram before sending it again\./);
  assert.match(mainSource, /Telegram delivery acknowledgement timed out/);
  assert.doesNotMatch(serverSource, /promiseWithTimeout\(deliverBriefToTelegram\(\{ runId, artifact \}\), 45000, "Telegram delivery timed out after 45 seconds"\)/);
});
