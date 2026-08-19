"use client";

import { useEffect, useRef } from "react";

/**
 * PROJECT VISUALS
 *
 * There are no screenshots of these three builds, and stock mockups would be
 * a lie. So each project gets a drawn diagram of what it actually does:
 *
 *   toolpath - offset contours and a travelling cutter (CNC manufacturing)
 *   lattice  - a field of cells resolving under a scanning band (calc engine)
 *   ledger   - orbiting nodes settling obligations across rings (committee app)
 *
 * All three read their colours from the live theme tokens, so they restyle
 * themselves on a theme switch instead of shipping two sets of artwork. The
 * loop only runs while the canvas is on screen, and never under reduced motion.
 */

type Variant = "toolpath" | "lattice" | "ledger";

/** Resolved once per theme change — getComputedStyle in a rAF loop costs layout. */
type Palette = { ink: string; faint: string; accent: string };

type Frame = { g: CanvasRenderingContext2D; w: number; h: number; t: number; p: Palette };

/* -------------------------------------------------------------------------- */

function drawToolpath({ g, w, h, t, p }: Frame) {
  const cx = w / 2;
  const cy = h / 2;
  const rings = 13;
  const base = Math.min(w, h) * 0.4;

  // Registration grid — the paper the part is drawn on.
  g.strokeStyle = p.faint;
  g.lineWidth = 1;
  const step = Math.max(w, h) / 12;
  for (let x = step; x < w; x += step) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = step; y < h; y += step) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }

  // Offset contours: a lobed profile shrinking pass by pass, the way a
  // roughing operation steps inward toward the finished part.
  for (let i = 0; i < rings; i++) {
    const f = i / (rings - 1);
    const r = base * (1 - f * 0.86);
    const phase = t * 0.16 + f * 1.7;
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.045) {
      const lobe = 1 + Math.sin(a * 3 + phase) * 0.13 + Math.sin(a * 5 - phase * 0.6) * 0.05;
      const rr = r * lobe;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.82;
      if (a === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.strokeStyle = i === 0 ? p.accent : p.ink;
    g.globalAlpha = i === 0 ? 0.9 : 0.16 + (1 - f) * 0.34;
    g.lineWidth = i === 0 ? 1.4 : 1;
    g.stroke();
  }
  g.globalAlpha = 1;

  // The cutter, riding the outermost pass.
  const a = t * 0.5;
  const lobe = 1 + Math.sin(a * 3 + t * 0.16) * 0.13 + Math.sin(a * 5 - t * 0.096) * 0.05;
  const px = cx + Math.cos(a) * base * lobe;
  const py = cy + Math.sin(a) * base * lobe * 0.82;
  g.fillStyle = p.accent;
  g.beginPath();
  g.arc(px, py, 4, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = p.accent;
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(px, py, 13, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
}

/* -------------------------------------------------------------------------- */

function drawLattice({ g, w, h, t, p }: Frame) {
  const cols = 14;
  const rows = 9;
  const padX = w * 0.06;
  const padY = h * 0.08;
  const cw = (w - padX * 2) / cols;
  const ch = (h - padY * 2) / rows;
  // A band sweeping left to right; cells resolve as it passes over them.
  const scan = ((t * 0.11) % 1.35) - 0.175;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * cw;
      const y = padY + r * ch;
      const hit = Math.max(0, 1 - Math.abs(c / (cols - 1) - scan) * 7);

      g.strokeStyle = p.faint;
      g.lineWidth = 1;
      g.strokeRect(x, y, cw - 4, ch - 4);

      // Deterministic per-cell value, so the field never flickers frame to frame.
      const seed = Math.abs((Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1);
      if (seed <= 0.55 && hit < 0.05) continue;

      const bar = (seed * 0.6 + 0.2) * (cw - 12);
      g.fillStyle = hit > 0.05 ? p.accent : p.ink;
      g.globalAlpha = hit > 0.05 ? 0.35 + hit * 0.65 : 0.22;
      g.fillRect(x + 4, y + ch / 2 - 1.5, hit > 0.05 ? bar * (0.5 + hit * 0.5) : bar, 3);
      g.globalAlpha = 1;
    }
  }

  const sx = padX + scan * (w - padX * 2);
  if (sx > padX && sx < w - padX) {
    const grad = g.createLinearGradient(sx - 40, 0, sx + 40, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, p.accent);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.strokeStyle = grad;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(sx, padY - 10);
    g.lineTo(sx, h - padY + 10);
    g.stroke();
  }
}

/* -------------------------------------------------------------------------- */

function drawLedger({ g, w, h, t, p }: Frame) {
  const cx = w / 2;
  const cy = h / 2;
  const rings = [0.24, 0.4, 0.56];
  const counts = [6, 10, 14];
  const pts: { x: number; y: number }[][] = [];
  const R = Math.min(w, h);

  rings.forEach((rf, ri) => {
    const r = R * rf;
    const spin = t * (0.06 + ri * 0.03) * (ri % 2 ? -1 : 1);
    g.strokeStyle = p.faint;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(cx, cy, r, r * 0.86, 0, 0, Math.PI * 2);
    g.stroke();

    const ring: { x: number; y: number }[] = [];
    for (let i = 0; i < counts[ri]; i++) {
      const a = (i / counts[ri]) * Math.PI * 2 + spin;
      ring.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.86 });
    }
    pts.push(ring);
  });

  // Chords: obligations settled between members on different rings.
  g.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const from = pts[1][(i * 3) % pts[1].length];
    const to = pts[2][(i * 5 + 2) % pts[2].length];
    const pulse = (Math.sin(t * 0.6 + i * 0.9) + 1) / 2;
    g.strokeStyle = p.ink;
    g.globalAlpha = 0.06 + pulse * 0.16;
    g.beginPath();
    g.moveTo(from.x, from.y);
    g.quadraticCurveTo(cx, cy, to.x, to.y);
    g.stroke();
  }
  g.globalAlpha = 1;

  pts.forEach((ring, ri) =>
    ring.forEach((pt, i) => {
      // One payout travels the outer ring at a time.
      const lead = ri === 2 && Math.floor(t * 1.1) % ring.length === i;
      g.fillStyle = lead ? p.accent : p.ink;
      g.globalAlpha = lead ? 1 : 0.42;
      g.beginPath();
      g.arc(pt.x, pt.y, lead ? 5 : 2.5, 0, Math.PI * 2);
      g.fill();
      if (lead) {
        g.globalAlpha = 0.3;
        g.strokeStyle = p.accent;
        g.beginPath();
        g.arc(pt.x, pt.y, 5 + ((t * 40) % 26), 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    })
  );

  // The core the whole arrangement balances against.
  g.fillStyle = p.accent;
  g.beginPath();
  g.arc(cx, cy, 3.5, 0, Math.PI * 2);
  g.fill();
}

const RENDERERS: Record<Variant, (f: Frame) => void> = {
  toolpath: drawToolpath,
  lattice: drawLattice,
  ledger: drawLedger,
};

/* -------------------------------------------------------------------------- */

function token(name: string, alpha: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${alpha})`;
}

export function ProjectVisual({
  variant,
  active = true,
  boost = 1,
  className,
}: {
  variant: Variant;
  /** Skip the frame loop entirely while the panel is off screen. */
  active?: boolean;
  /** Hover accelerates the drawing without changing what is drawn. */
  boost?: number;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const boostRef = useRef(boost);
  const activeRef = useRef(active);

  boostRef.current = boost;
  activeRef.current = active;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;

    const render = RENDERERS[variant];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let palette: Palette = { ink: "rgba(0,0,0,.6)", faint: "rgba(0,0,0,.14)", accent: "#ff5a1f" };

    const syncTheme = () => {
      palette = { ink: token("--ink", 0.62), faint: token("--ink", 0.13), accent: token("--accent", 1) };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      g.clearRect(0, 0, w, h);
      render({ g, w, h, t, p: palette });
    };

    syncTheme();
    resize();
    t = 0.6;
    paint();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!activeRef.current) return;
      t += 0.016 * boostRef.current;
      paint();
    };

    const ro = new ResizeObserver(() => {
      resize();
      paint();
    });
    ro.observe(cv);

    const mo = new MutationObserver(() => {
      syncTheme();
      paint();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [variant]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
