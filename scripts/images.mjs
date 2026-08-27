/**
 * IMAGE PIPELINE
 *
 * `next.config.mjs` sets `images: { unoptimized: true }` — the browser gets
 * these files exactly as they sit in /public, with no server-side resize at
 * request time and no dependency on sharp being installed on the host. That is
 * a deliberate trade: it removes a whole class of deployment failure, but it
 * also means nothing resizes the portraits for a phone unless we do it here.
 *
 * So this script does it once, at author time. For every source it writes:
 *
 *   · AVIF  — smallest by a wide margin, and the format every browser this
 *             project targets supports.
 *   · WebP  — the fallback for anything without AVIF.
 *   · JPEG  — the original file, untouched, as the last resort.
 *
 * at each width the layout can actually ask for, so a 412px phone downloads a
 * 640px-wide image instead of the 900px one it was being sent before.
 *
 * QUALITY IS NOT BEING TRADED AWAY HERE. The sources are already-compressed
 * 4:2:0 JPEGs; these settings (AVIF q78 at 4:4:4 chroma, WebP q88, both with
 * Lanczos3 resampling) reconstruct them above the level of detail the source
 * actually contains. `npm run images:check` prints the per-channel error of
 * every full-size variant against its own source so that claim is measured
 * rather than asserted.
 *
 * Run with:  npm run images
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public");
const OUT = path.join(ROOT, "img", "gen");

/** width: the intrinsic pixel width to emit. The source width is always kept. */
const JOBS = [
  // The portrait is never displayed wider than 384 CSS px (24rem at xl), and
  // never wider than 304 below lg. This ladder covers 1x through 3x across
  // that whole range without ever sending a phone the 900px master.
  // The steps are deliberately close together through the middle of the range.
  // A phone at 412 CSS px with a 1.75x screen needs exactly 532 device pixels
  // for this box; with a coarse ladder the browser had to round up to 640 and
  // download a third more image than it could draw. 544 is the step that fits.
  { src: "img/portrait-ink.jpg", base: "portrait-ink", widths: [384, 448, 544, 640, 768, 900] },
  { src: "img/portrait-paper.jpg", base: "portrait-paper", widths: [384, 448, 544, 640, 768, 900] },
  // The nav avatar is a 32px chip: 2x and 3x, plus one spare.
  { src: "img/avatar.jpg", base: "avatar", widths: [64, 96, 128] },
];

const AVIF = { quality: 78, effort: 6, chromaSubsampling: "4:4:4" };
const WEBP = { quality: 88, effort: 6, smartSubsample: true };

async function build() {
  fs.mkdirSync(OUT, { recursive: true });
  const rows = [];

  for (const job of JOBS) {
    const abs = path.join(ROOT, job.src);
    const meta = await sharp(abs).metadata();

    for (const w of job.widths) {
      if (w > meta.width) continue;
      const pipeline = () =>
        sharp(abs).resize({ width: w, kernel: sharp.kernel.lanczos3, withoutEnlargement: true });

      const avif = path.join(OUT, `${job.base}-${w}.avif`);
      const webp = path.join(OUT, `${job.base}-${w}.webp`);
      await pipeline().avif(AVIF).toFile(avif);
      await pipeline().webp(WEBP).toFile(webp);

      rows.push({
        file: `${job.base}-${w}`,
        avif: +(fs.statSync(avif).size / 1024).toFixed(1),
        webp: +(fs.statSync(webp).size / 1024).toFixed(1),
      });
    }
    rows.push({
      file: `${job.base} (source jpeg ${meta.width}px)`,
      avif: "-",
      webp: +(fs.statSync(abs).size / 1024).toFixed(1),
    });
  }

  console.table(rows);
}

/**
 * Fidelity check. Decodes each full-width variant and its source to raw RGB and
 * reports mean absolute error per channel (0-255) plus the worst single pixel.
 * Anything under ~1.5 MAE is well below the threshold of visibility; the point
 * is to have a number rather than an opinion.
 */
async function check() {
  const rows = [];
  for (const job of JOBS) {
    const abs = path.join(ROOT, job.src);
    const meta = await sharp(abs).metadata();
    const full = Math.max(...job.widths.filter((w) => w <= meta.width));
    const ref = await sharp(abs)
      .resize({ width: full, kernel: sharp.kernel.lanczos3, withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer();

    for (const fmt of ["avif", "webp"]) {
      const p = path.join(OUT, `${job.base}-${full}.${fmt}`);
      if (!fs.existsSync(p)) continue;
      const got = await sharp(p).removeAlpha().raw().toBuffer();
      let sum = 0;
      let max = 0;
      for (let i = 0; i < ref.length; i++) {
        const d = Math.abs(ref[i] - got[i]);
        sum += d;
        if (d > max) max = d;
      }
      rows.push({
        variant: `${job.base}-${full}.${fmt}`,
        meanAbsError: +(sum / ref.length).toFixed(3),
        worstPixel: max,
      });
    }
  }
  console.table(rows);
}

if (process.argv.includes("--check")) await check();
else await build();
