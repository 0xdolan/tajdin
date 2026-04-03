#!/usr/bin/env node
/**
 * Validates that `dist/` looks like a loadable MV3 extension after `npm run build`.
 * Run from repo root: `node scripts/verify-extension.mjs`
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function fail(msg) {
  console.error(`verify-extension: ${msg}`);
  process.exit(1);
}

if (!existsSync(dist)) {
  fail('Missing dist/ — run "npm run build" first.');
}

function mustExist(rel) {
  const p = join(dist, rel);
  if (!existsSync(p)) fail(`Missing required file: ${rel}`);
  return p;
}

mustExist("manifest.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
} catch {
  fail("dist/manifest.json is not valid JSON.");
}

if (manifest.manifest_version !== 3) fail("manifest_version must be 3.");

const perms = new Set(manifest.permissions ?? []);
for (const p of ["storage", "alarms", "offscreen"]) {
  if (!perms.has(p)) fail(`manifest.permissions must include "${p}".`);
}

mustExist("background.js");

const popup = manifest.action?.default_popup;
const optionsPage = manifest.options_ui?.page;
if (typeof popup !== "string" || !popup) fail("manifest.action.default_popup must be a non-empty string.");
if (typeof optionsPage !== "string" || !optionsPage) {
  fail("manifest.options_ui.page must be a non-empty string.");
}

mustExist(popup);
mustExist(optionsPage);
mustExist("src/offscreen/index.html");

for (const rel of [popup, optionsPage, "src/offscreen/index.html"]) {
  const html = readFileSync(join(dist, rel), "utf8");
  if (!html.includes("script")) fail(`${rel} must contain a script reference.`);
}

const popupHtml = readFileSync(join(dist, popup), "utf8");
if (!popupHtml.includes("assets/") && !popupHtml.includes(".js")) {
  fail(`${popup} should reference built script assets.`);
}

console.log("verify-extension: dist/ looks consistent with a Manifest V3 unpack load.");
