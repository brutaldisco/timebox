import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const desktopDistDir = path.join(root, "apps", "desktop", "dist");

if (!fs.existsSync(outDir)) {
  throw new Error("Next export output 'out' was not found.");
}

fs.rmSync(desktopDistDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(desktopDistDir), { recursive: true });
fs.cpSync(outDir, desktopDistDir, { recursive: true });

console.log("Desktop web bundle copied to apps/desktop/dist");
