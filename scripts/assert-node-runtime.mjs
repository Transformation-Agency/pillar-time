const minimumMajor = 24;
const major = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);

if (!Number.isFinite(major) || major < minimumMajor) {
  console.error(
    `Pillar Time desktop packaging requires Node ${minimumMajor}+ because the backend uses node:sqlite. Current runtime: ${process.version}.`,
  );
  process.exit(1);
}
