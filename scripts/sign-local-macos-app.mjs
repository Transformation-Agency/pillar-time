import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "darwin") {
  console.log("Local ad-hoc signing is only needed on macOS.");
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "src-tauri", "target", "release", "bundle", "macos", "Pillar Time.app");
const cleanPath = path.join(os.tmpdir(), "Pillar Time.local-build.app");

if (!fs.existsSync(appPath)) {
  throw new Error(`Built app not found at ${appPath}. Run tauri build first.`);
}

fs.rmSync(cleanPath, { recursive: true, force: true });
execFileSync("ditto", ["--noextattr", "--norsrc", appPath, cleanPath], { stdio: "inherit" });

try {
  execFileSync("xattr", ["-cr", cleanPath], { stdio: "inherit" });
} catch {
  // Best effort. Some macOS builds preserve com.apple.provenance, but ad-hoc signing can still succeed after ditto.
}
for (const attr of ["com.apple.FinderInfo", "com.apple.fileprovider.fpfs#P", "com.apple.provenance"]) {
  try {
    execFileSync("xattr", ["-dr", attr, cleanPath], { stdio: "ignore" });
  } catch {
    // Best effort: these attributes are not always present or removable.
  }
}

execFileSync("codesign", ["--force", "--deep", "--sign", "-", cleanPath], { stdio: "inherit" });
execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", cleanPath], { stdio: "inherit" });
console.log(`Ad-hoc signed local app: ${cleanPath}`);
