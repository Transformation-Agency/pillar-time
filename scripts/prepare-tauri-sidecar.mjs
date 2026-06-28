import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tauriDir = path.join(root, "src-tauri");
const resourcesDir = path.join(tauriDir, "resources");
const backendDir = path.join(resourcesDir, "backend");
const runtimeLibResourcesDir = path.join(resourcesDir, "lib");
const whisperResourcesDir = path.join(resourcesDir, "whisper");
const whisperVendorDir = process.env.PILLAR_TIME_WHISPER_VENDOR_DIR || path.join(root, "vendor", "whisper");
const binariesDir = path.join(tauriDir, "binaries");
const sidecarName = "pillar-time-backend";
const legacySidecarName = "jack-daily-brief-backend";
const whisperSidecarName = "whisper-cli";
const backendRuntimeDependencies = ["express"];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copy(src, dest) {
  fs.cpSync(src, dest, {
    recursive: true,
    dereference: true,
    filter: (source) => {
      const base = path.basename(source);
      return base !== ".DS_Store";
    },
  });
}

function copyBundleAsset(src, dest) {
  if (process.platform === "darwin") {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      execFileSync("ditto", ["--noextattr", "--norsrc", src, dest], { stdio: "ignore" });
      clearMacMetadata(dest);
      return;
    } catch {
      // Fall back to the normal copy path if ditto is unavailable or refuses the asset.
    }
  }
  copy(src, dest);
  clearMacMetadata(dest);
}

function clearMacMetadata(filePath) {
  if (process.platform !== "darwin" || !fs.existsSync(filePath)) return;
  try {
    execFileSync("xattr", ["-cr", filePath], { stdio: "ignore" });
  } catch {
    // Best effort: copied Homebrew artifacts can carry local xattrs that confuse signing.
  }
  try {
    execFileSync("xattr", ["-d", "com.apple.provenance", filePath], { stdio: "ignore" });
  } catch {
    // This attribute is not always present or removable on every macOS version.
  }
}

function packagePath(packageName, nodeModulesDir = path.join(root, "node_modules")) {
  const parts = packageName.startsWith("@") ? packageName.split("/") : [packageName];
  return path.join(nodeModulesDir, ...parts);
}

function dependencyNames(packageJson) {
  return [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.optionalDependencies || {}),
  ];
}

function copyRuntimePackage(packageName, copied = new Set()) {
  if (copied.has(packageName)) return;
  const src = packagePath(packageName);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing runtime dependency ${packageName}. Run npm install before desktop packaging.`);
  }
  const dest = packagePath(packageName, path.join(backendDir, "node_modules"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  copy(src, dest);
  copied.add(packageName);

  const packageJsonPath = path.join(src, "package.json");
  if (!fs.existsSync(packageJsonPath)) return;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const dependency of dependencyNames(packageJson)) {
    copyRuntimePackage(dependency, copied);
  }
}

function targetTriple() {
  if (process.env.PILLAR_TIME_TARGET_TRIPLE) return process.env.PILLAR_TIME_TARGET_TRIPLE;
  if (process.env.CARGO_BUILD_TARGET) return process.env.CARGO_BUILD_TARGET;
  try {
    return execFileSync("rustc", ["--print", "host-tuple"], { encoding: "utf8" }).trim();
  } catch {
    const rustInfo = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
    return /^host:\s*(\S+)/m.exec(rustInfo)?.[1] || "aarch64-apple-darwin";
  }
}

const exeSuffix = process.platform === "win32" ? ".exe" : "";

function copyNodeSidecar(filePath) {
  const nodeBinary = process.env.PILLAR_TIME_NODE_SIDECAR_PATH || process.execPath;
  fs.copyFileSync(nodeBinary, filePath);
  fs.chmodSync(filePath, 0o755);
  copyNodeRuntimeLibraries(nodeBinary);
  addNodeRuntimeRpaths(filePath);
  adHocSign(filePath);
}

function linkedLibraries(binaryPath) {
  if (process.platform !== "darwin" || !fs.existsSync(binaryPath)) return [];
  try {
    return execFileSync("otool", ["-L", binaryPath], { encoding: "utf8" })
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean);
  } catch {
    return [];
  }
}

function nodeRuntimeSearchDirs(nodeBinary) {
  const dirs = [
    process.env.PILLAR_TIME_NODE_LIB_DIR,
    path.dirname(nodeBinary),
    path.resolve(path.dirname(nodeBinary), "..", "lib"),
    "/opt/homebrew/lib",
    "/usr/local/lib",
  ].filter(Boolean);
  const realNodeBinary = fs.existsSync(nodeBinary) ? fs.realpathSync(nodeBinary) : nodeBinary;
  dirs.push(path.dirname(realNodeBinary), path.resolve(path.dirname(realNodeBinary), "..", "lib"));
  return [...new Set(dirs)];
}

function resolveRuntimeLibrary(libraryRef, nodeBinary) {
  if (!path.basename(libraryRef).startsWith("libnode") || !libraryRef.endsWith(".dylib")) return null;
  if (path.isAbsolute(libraryRef) && fs.existsSync(libraryRef)) return libraryRef;
  const libraryName = path.basename(libraryRef);
  for (const dir of nodeRuntimeSearchDirs(nodeBinary)) {
    const candidate = path.join(dir, libraryName);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not locate ${libraryName} required by ${nodeBinary}. Set PILLAR_TIME_NODE_LIB_DIR to the directory containing it.`);
}

function copyNodeRuntimeLibraries(nodeBinary) {
  if (process.platform !== "darwin") return;
  fs.mkdirSync(runtimeLibResourcesDir, { recursive: true });
  for (const libraryRef of linkedLibraries(nodeBinary)) {
    const src = resolveRuntimeLibrary(libraryRef, nodeBinary);
    if (!src) continue;
    const dest = path.join(runtimeLibResourcesDir, path.basename(src));
    copyBundleAsset(src, dest);
    fs.chmodSync(dest, 0o755);
    adHocSign(dest);
  }
}

function addNodeRuntimeRpaths(binaryPath) {
  addDevRpath(binaryPath, "@executable_path/../Resources/resources/lib");
  addDevRpath(binaryPath, "/opt/homebrew/lib");
  addDevRpath(binaryPath, "/usr/local/lib");
}

function normalizeWhisperArtifacts(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const filePath = path.join(entry.parentPath || dir, entry.name);
    if (/\.(dylib|so)$/.test(entry.name) || entry.name === "whisper-cli") {
      fs.chmodSync(filePath, 0o755);
    }
    if (process.platform === "darwin") {
      try {
        execFileSync("xattr", ["-c", filePath], { stdio: "ignore" });
      } catch {
        // Best effort: copied Homebrew artifacts can carry local xattrs that confuse bundling.
      }
      try {
        execFileSync("xattr", ["-d", "com.apple.provenance", filePath], { stdio: "ignore" });
      } catch {
        // This attribute is not always present or removable on every macOS version.
      }
    }
  }
}

function addDevRpath(binaryPath, rpath) {
  if (process.platform !== "darwin" || !fs.existsSync(binaryPath)) return;
  if (!rpath.startsWith("@") && !fs.existsSync(rpath)) return;
  try {
    const output = execFileSync("otool", ["-l", binaryPath], { encoding: "utf8" });
    if (output.includes(`path ${rpath} `)) return;
    execFileSync("install_name_tool", ["-add_rpath", rpath, binaryPath], { stdio: "ignore" });
  } catch {
    // Best effort for local dev packaging. Production should use a static whisper.cpp build.
  }
}

function adHocSign(binaryPath) {
  if (process.platform !== "darwin" || !fs.existsSync(binaryPath)) return;
  try {
    execFileSync("codesign", ["--force", "--sign", "-", binaryPath], { stdio: "ignore" });
  } catch {
    // Best effort for local dev packaging; release signing will replace this signature.
  }
}

rmrf(backendDir);
rmrf(runtimeLibResourcesDir);
rmrf(whisperResourcesDir);
fs.mkdirSync(backendDir, { recursive: true });
fs.mkdirSync(runtimeLibResourcesDir, { recursive: true });
fs.mkdirSync(whisperResourcesDir, { recursive: true });
fs.mkdirSync(binariesDir, { recursive: true });

copy(path.join(root, "server"), path.join(backendDir, "server"));
copy(path.join(root, "dist"), path.join(backendDir, "dist"));
fs.mkdirSync(path.join(backendDir, "node_modules"), { recursive: true });
for (const dependency of backendRuntimeDependencies) {
  copyRuntimePackage(dependency);
}
fs.writeFileSync(path.join(backendDir, "package.json"), `${JSON.stringify({
  name: "pillar-time-backend-runtime",
  version: "0.1.0",
  type: "module",
  private: true,
  dependencies: Object.fromEntries(backendRuntimeDependencies.map((dependency) => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packagePath(dependency), "package.json"), "utf8"));
    return [dependency, packageJson.version];
  })),
}, null, 2)}\n`);

const hostTriple = targetTriple();

if (fs.existsSync(whisperVendorDir)) {
  const vendorModelDir = path.join(whisperVendorDir, "models");
  if (fs.existsSync(vendorModelDir)) {
    copyBundleAsset(vendorModelDir, path.join(whisperResourcesDir, "models"));
  }
  normalizeWhisperArtifacts(whisperResourcesDir);
  const vendorWhisperBinary = process.env.PILLAR_TIME_WHISPER_CLI_PATH || path.join(whisperVendorDir, "bin", "whisper-cli");
  if (fs.existsSync(vendorWhisperBinary)) {
    copyBundleAsset(vendorWhisperBinary, path.join(binariesDir, `${whisperSidecarName}-${hostTriple}${exeSuffix}`));
    fs.chmodSync(path.join(binariesDir, `${whisperSidecarName}-${hostTriple}${exeSuffix}`), 0o755);
    rmrf(path.join(whisperResourcesDir, "bin"));
  }
}

for (const file of fs.readdirSync(binariesDir)) {
  if (
    file.startsWith(`${sidecarName}-`) ||
    file.startsWith(`${legacySidecarName}-`) ||
    file.startsWith(`${whisperSidecarName}-`)
  ) rmrf(path.join(binariesDir, file));
}

copyNodeSidecar(path.join(binariesDir, `${sidecarName}-${hostTriple}${exeSuffix}`));
if (fs.existsSync(whisperVendorDir)) {
  const vendorWhisperBinary = process.env.PILLAR_TIME_WHISPER_CLI_PATH || path.join(whisperVendorDir, "bin", "whisper-cli");
  if (fs.existsSync(vendorWhisperBinary)) {
    const whisperSidecarPath = path.join(binariesDir, `${whisperSidecarName}-${hostTriple}${exeSuffix}`);
    copyBundleAsset(vendorWhisperBinary, whisperSidecarPath);
    fs.chmodSync(whisperSidecarPath, 0o755);
    addDevRpath(whisperSidecarPath, "/opt/homebrew/lib");
    addDevRpath(whisperSidecarPath, "/usr/local/lib");
    adHocSign(whisperSidecarPath);
  }
}

console.log(`Prepared Tauri Node sidecar resources for ${hostTriple}${fs.existsSync(whisperVendorDir) ? " with whisper.cpp assets" : ""}`);

const debugResourcesDir = path.join(tauriDir, "target", "debug", "resources");
if (fs.existsSync(debugResourcesDir)) {
  copyBundleAsset(backendDir, path.join(debugResourcesDir, "backend"));
  copyBundleAsset(runtimeLibResourcesDir, path.join(debugResourcesDir, "lib"));
  if (fs.existsSync(whisperResourcesDir)) {
    copyBundleAsset(whisperResourcesDir, path.join(debugResourcesDir, "whisper"));
  }
}
