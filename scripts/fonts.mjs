/**
 * FONT SUBSETTING
 *
 * The two faces in src/app/fonts/ are Google's own `latin` cuts of Bricolage
 * Grotesque and Archivo, reduced to the characters this site actually renders.
 * Every variable axis is preserved — Bricolage keeps opsz 12–96, wght 200–800
 * and wdth 75–100; Archivo keeps wght 100–900 and wdth 62–125 — so optical
 * sizing and every `font-variation-settings` rule behave exactly as before.
 * Only unused outlines are gone.
 *
 * Why bother: the full latin cuts are 216KB, and a trace of the live site shows
 * the page painting nothing until they have arrived. On the connection a mobile
 * audit simulates, that is over a second of critical path spent on glyphs the
 * page does not contain. The subsets are 152KB.
 *
 * The charset in font-charset.txt was collected off the built pages — both
 * themes, several widths, every accordion opened — then widened to the whole
 * printable ASCII range plus the usual typographic punctuation, so ordinary
 * content edits cannot introduce a missing glyph. Re-run this only if the copy
 * starts using characters outside that set (another script, say).
 *
 * Requires: python -m pip install fonttools brotli
 *
 *   1. npm run build            (so next/font has fetched the upstream cuts)
 *   2. node scripts/fonts.mjs   (re-subsets from .next/static/media)
 *
 * NOTE: the fallback metric overrides in globals.css are Google's, pinned by
 * hand. Subsetting changes the average advance width, so `next/font` would
 * otherwise compute a different `size-adjust` and lay the pre-swap frame out
 * differently. Do not let those drift.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "src", "app", "fonts");
const MEDIA = path.join(process.cwd(), ".next", "static", "media");
const charset = fs.readFileSync(path.join(process.cwd(), "scripts", "font-charset.txt"), "utf8").trim();

// The upstream cuts are the two largest .p.woff2 files next/font writes.
const sources = fs
  .readdirSync(MEDIA)
  .filter((f) => f.endsWith(".woff2"))
  .map((f) => ({ f, size: fs.statSync(path.join(MEDIA, f)).size }))
  .sort((a, b) => b.size - a.size);

if (sources.length < 2) {
  console.error("No font files in .next/static/media — run `npm run build` first.");
  process.exit(1);
}

const targets = [
  { src: sources.find((s) => s.size > 100_000)?.f, out: "bricolage-grotesque-latin.woff2" },
  { src: sources.find((s) => s.size > 60_000 && s.size <= 100_000)?.f, out: "archivo-latin.woff2" },
];

for (const t of targets) {
  if (!t.src) { console.error("Could not identify a source for", t.out); continue; }
  const from = path.join(MEDIA, t.src);
  const to = path.join(OUT, t.out);
  execFileSync("python", [
    "-m", "fontTools.subset", from,
    `--unicodes=${charset}`,
    "--layout-features=*",
    "--flavor=woff2",
    "--no-hinting",
    "--desubroutinize",
    `--output-file=${to}`,
  ], { stdio: "inherit" });
  console.log(
    `${t.out}: ${(fs.statSync(from).size / 1024).toFixed(1)}KB -> ${(fs.statSync(to).size / 1024).toFixed(1)}KB`
  );
}
