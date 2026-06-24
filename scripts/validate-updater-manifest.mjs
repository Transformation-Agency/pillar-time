import fs from "node:fs";
import path from "node:path";

const releaseDir = process.env.RELEASE_DIR || "release";
const manifestPath = process.env.UPDATER_MANIFEST || path.join(releaseDir, "latest.json");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = process.env.VERSION || pkg.version;
const tag = process.env.RELEASE_TAG || `v${version}`;
const repo = process.env.GITHUB_REPOSITORY || "Transformation-Agency/pillar-time";
const expectedBaseUrl = `https://github.com/${repo}/releases/download/${tag}`;

const expectedAssets = {
  "darwin-aarch64": `Pillar.Time_${version}_aarch64.app.tar.gz`,
  "darwin-x86_64": `Pillar.Time_${version}_x64.app.tar.gz`,
  "windows-x86_64": `Pillar.Time_${version}_x64-setup.exe`,
};

function fail(message) {
  throw new Error(`Updater manifest validation failed: ${message}`);
}

if (!fs.existsSync(manifestPath)) fail(`missing ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.version !== version) fail(`version is ${manifest.version || "missing"}, expected ${version}`);
if (!manifest.pub_date) fail("pub_date is missing");
if (!manifest.platforms || typeof manifest.platforms !== "object") fail("platforms object is missing");

for (const [platform, assetName] of Object.entries(expectedAssets)) {
  const entry = manifest.platforms[platform];
  if (!entry) fail(`${platform} entry is missing`);
  const expectedUrl = `${expectedBaseUrl}/${assetName}`;
  if (entry.url !== expectedUrl) fail(`${platform} url is ${entry.url || "missing"}, expected ${expectedUrl}`);
  if (!String(entry.signature || "").trim()) fail(`${platform} signature is missing`);
  const localAsset = path.join(releaseDir, assetName);
  const localSignature = `${localAsset}.sig`;
  if (fs.existsSync(localAsset) && fs.statSync(localAsset).size <= 0) fail(`${assetName} is empty`);
  if (fs.existsSync(localSignature) && !fs.readFileSync(localSignature, "utf8").trim()) fail(`${assetName}.sig is empty`);
}

console.log(`Updater manifest OK for ${version}`);
