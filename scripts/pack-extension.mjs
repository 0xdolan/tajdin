#!/usr/bin/env node
/**
 * Zip `dist/` for Chrome Web Store / sideload (manifest at zip root).
 * Requires a prior `npm run build`. Uses the system `zip` CLI (available on Linux/macOS and GitHub runners).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const artifacts = join(root, "artifacts");

function fail(msg) {
  console.error(`pack-extension: ${msg}`);
  process.exit(1);
}

if (!existsSync(dist)) {
  fail('Missing dist/ — run "npm run build" first.');
}
if (!existsSync(join(dist, "manifest.json"))) {
  fail("dist/manifest.json missing — build may be incomplete.");
}

let version = "0.0.0";
try {
  const m = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
  if (typeof m.version === "string" && m.version) version = m.version;
} catch {
  fail("Could not read version from dist/manifest.json.");
}

mkdirSync(artifacts, { recursive: true });
const out = join(artifacts, `zeng-extension-v${version}.zip`);

try {
  execFileSync("zip", ["-q", "-r", out, "."], { cwd: dist, stdio: "inherit" });
} catch {
  fail(
    'The "zip" command failed. On Debian/Ubuntu install with: sudo apt install zip. On Windows, use WSL or Git Bash, or run this step in CI only.',
  );
}

console.log(`pack-extension: wrote ${out}`);
