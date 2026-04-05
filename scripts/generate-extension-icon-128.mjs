#!/usr/bin/env node
/**
 * Builds public/logo/tajdin-extension-icon-128.png per Chrome Web Store / Chromium guidance:
 * 128×128 PNG, 96×96 artwork centered, 16px transparent padding per side.
 * Adds a subtle white outer glow so the black mark reads on dark UI.
 *
 * Requires: ImageMagick 7 (`magick` on PATH). Run from repo root:
 *   node scripts/generate-extension-icon-128.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public/logo/tajdin-logo-black.png");
const out = join(root, "public/logo/tajdin-extension-icon-128.png");

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit" });
}

function main() {
  const dir = mkdtempSync(join(tmpdir(), "tajdin-icon-"));
  const core = join(dir, "core96.png");
  const merged = join(dir, "merged96.png");
  try {
    run("magick", [
      src,
      "-resize",
      "86x86",
      "-background",
      "none",
      "-gravity",
      "center",
      "-extent",
      "96x96",
      `PNG32:${core}`,
    ]);
    run("magick", [
      core,
      "(",
      "+clone",
      "-alpha",
      "extract",
      "-blur",
      "0x2",
      "-background",
      "white",
      "-alpha",
      "shape",
      ")",
      "-compose",
      "DstOver",
      "-composite",
      `PNG32:${merged}`,
    ]);
    run("magick", [
      "-size",
      "128x128",
      "xc:none",
      "(",
      merged,
      "-geometry",
      "+16+16",
      ")",
      "-compose",
      "over",
      "-composite",
      `PNG32:${out}`,
    ]);
    console.log(`Wrote ${out} (128×128, 96×96 inner + 16px padding, subtle white glow)`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
