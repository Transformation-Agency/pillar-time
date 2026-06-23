import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tauriDir = path.join(root, "src-tauri");
const resourcesDir = path.join(tauriDir, "resources");
const backendDir = path.join(resourcesDir, "backend");
const runtimeLibDir = path.join(tauriDir, "lib");
const whisperResourcesDir = path.join(resourcesDir, "whisper");
const binariesDir = path.join(tauriDir, "binaries");
const sidecarName = "pillar-time-backend";
const legacySidecarName = "jack-daily-brief-backend";
const backendRuntimeDependencies = ["express"];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copy(src, dest) {
  if (process.platform === "darwin") {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      execFileSync("ditto", ["--noextattr", "--norsrc", src, dest], { stdio: "ignore" });
      return;
    } catch {
      // Fall through to fs.cp when ditto is unavailable or cannot copy this path.
    }
  }
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
      return;
    } catch {
      // Fall back to the normal copy path if ditto is unavailable or refuses the asset.
    }
  }
  copy(src, dest);
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
  if (process.env.PILLAR_TARGET_TRIPLE) return process.env.PILLAR_TARGET_TRIPLE;
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
  const nodeBinary = process.env.PILLAR_NODE_SIDECAR_PATH || process.execPath;
  fs.copyFileSync(nodeBinary, filePath);
  fs.chmodSync(filePath, 0o755);
  if (process.platform === "darwin") {
    execFileSync("install_name_tool", ["-add_rpath", "@loader_path/../Resources/lib", filePath], { stdio: "ignore" });
    execFileSync("codesign", ["--force", "--sign", "-", filePath], { stdio: "ignore" });
  }
}

function nodeSharedLibraryPath() {
  if (process.platform !== "darwin") return null;
  const nodeBinary = process.env.PILLAR_NODE_SIDECAR_PATH || process.execPath;
  const nodeHome = path.dirname(path.dirname(nodeBinary));
  const candidate = path.join(nodeHome, "lib", `libnode.${process.versions.modules}.dylib`);
  if (fs.existsSync(candidate)) return candidate;
  try {
    const otoolOutput = execFileSync("otool", ["-L", nodeBinary], { encoding: "utf8" });
    const match = otoolOutput.match(/^\s+(\S*libnode\.\d+\.dylib)\s/m);
    if (match?.[1] && fs.existsSync(match[1])) return match[1];
  } catch {
    // Fall through to the packaging error below.
  }
  throw new Error(`Could not find libnode.${process.versions.modules}.dylib for the packaged backend sidecar.`);
}

function copyNodeRuntimeLibraries() {
  const libnode = nodeSharedLibraryPath();
  if (!libnode) return;
  fs.mkdirSync(runtimeLibDir, { recursive: true });
  const dest = path.join(runtimeLibDir, path.basename(libnode));
  copyBundleAsset(libnode, dest);
  fs.chmodSync(dest, 0o755);
}

rmrf(backendDir);
rmrf(runtimeLibDir);
rmrf(whisperResourcesDir);
fs.mkdirSync(backendDir, { recursive: true });
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

for (const file of fs.readdirSync(binariesDir)) {
  if (
    file.startsWith(`${sidecarName}-`) ||
    file.startsWith(`${legacySidecarName}-`) ||
    file.startsWith("whisper-cli-")
  ) rmrf(path.join(binariesDir, file));
}

copyNodeSidecar(path.join(binariesDir, `${sidecarName}-${hostTriple}${exeSuffix}`));
copyNodeRuntimeLibraries();

console.log(`Prepared Tauri Node sidecar resources for ${hostTriple}. Local Whisper is optional and configured after install.`);

const debugResourcesDir = path.join(tauriDir, "target", "debug", "resources");
if (fs.existsSync(debugResourcesDir)) {
  rmrf(path.join(debugResourcesDir, "whisper"));
  copyBundleAsset(backendDir, path.join(debugResourcesDir, "backend"));
  copyBundleAsset(runtimeLibDir, path.join(debugResourcesDir, "lib"));
}
