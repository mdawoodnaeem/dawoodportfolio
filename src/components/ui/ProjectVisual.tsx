"use client";

import { useEffect, useRef } from "react";

/**
 * PROJECT VISUALS
 *
 * There are no screenshots of these builds, and stock mockups would be a
 * lie. So each project gets its own drawn diagram of what it actually does —
 * no two projects share a diagram:
 *
 *   toolpath - offset contours and a travelling cutter (CNC manufacturing)
 *   lattice  - a field of cells resolving under a scanning band (calc engine)
 *   ledger   - orbiting nodes settling obligations across rings (committee app)
 *   conveyor - parcels crossing a scanning gate on a belt (e-commerce)
 *   radar    - a five-axis score polygon breathing and rotating its lead vertex
 *              (resume match scoring)
 *   sweep    - a rotating radar sweep lighting up city blips (weather dashboard)
 *   flame    - live-fire tongues over an ember bed (restaurant, one seating)
 *
 * All of them read their colours from the live theme tokens, so they restyle
 * themselves on a theme switch instead of shipping two sets of artwork. The
 * loop only runs while the canvas is on screen, and never under reduced motion.
 */

type Variant = "toolpath" | "lattice" | "ledger" | "conveyor" | "radar" | "sweep" | "flame";

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

/* -------------------------------------------------------------------------- */
/* conveyor - items travelling a belt through a scanning gate (e-commerce)     */

function drawConveyor({ g, w, h, t, p }: Frame) {
  const beltY = h * 0.62;
  const left = w * 0.1;
  const right = w * 0.9;
  const scanX = w * 0.76;

  // Belt rail.
  g.strokeStyle = p.faint;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(left, beltY);
  g.lineTo(right, beltY);
  g.stroke();

  // Tread ticks running under the belt, scrolling left.
  const spacing = 16;
  const offset = (t * 34) % spacing;
  g.globalAlpha = 0.45;
  for (let x = left - offset; x < right; x += spacing) {
    g.beginPath();
    g.moveTo(x, beltY + 3);
    g.lineTo(x + 7, beltY + 10);
    g.stroke();
  }
  g.globalAlpha = 1;

  // Items travelling left to right, each a small parcel.
  const count = 6;
  const size = Math.min(w, h) * 0.052;
  for (let i = 0; i < count; i++) {
    const phase = (t * 0.1 + i / count) % 1;
    const x = left + phase * (right - left);
    const y = beltY - size - 3;
    const cleared = x > scanX;
    g.fillStyle = cleared ? p.accent : p.ink;
    g.globalAlpha = cleared ? 0.85 : 0.3 + 0.1 * Math.sin(t * 2 + i);
    g.fillRect(x - size / 2, y - size, size, size);
    g.globalAlpha = 1;
  }

  // Scanning gate — a vertical beam that pulses as parcels cross it.
  const pulse = 0.5 + Math.sin(t * 3.2) * 0.25;
  g.strokeStyle = p.accent;
  g.globalAlpha = pulse;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(scanX, beltY - h * 0.34);
  g.lineTo(scanX, beltY + 6);
  g.stroke();
  g.globalAlpha = 1;

  // Register posts either side of the gate.
  g.fillStyle = p.faint;
  g.fillRect(scanX - 1, beltY - h * 0.36, 2, 6);
  g.fillRect(scanX - 1, beltY + 4, 2, 6);
}

/* -------------------------------------------------------------------------- */
/* radar - a five-axis score polygon breathing and rotating its lead vertex    */
/* (resume match scoring)                                                      */

function drawRadar({ g, w, h, t, p }: Frame) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.34;
  const axes = 5;
  // Sub-score shape carried over from the product's own scoring axes.
  const base = [0.81, 0.64, 0.88, 0.58, 0.69];

  const pt = (idx: number, rr: number) => {
    const a = -Math.PI / 2 + idx * ((Math.PI * 2) / axes);
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  };

  // Concentric rings.
  g.strokeStyle = p.faint;
  g.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    const rr = R * (ring / 4);
    g.beginPath();
    for (let i = 0; i <= axes; i++) {
      const { x, y } = pt(i % axes, rr);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  // Spokes.
  for (let i = 0; i < axes; i++) {
    const { x, y } = pt(i, R);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(x, y);
    g.stroke();
  }

  // Animated score polygon, each vertex breathing slightly out of phase.
  g.beginPath();
  for (let i = 0; i <= axes; i++) {
    const idx = i % axes;
    const rr = R * (base[idx] + Math.sin(t * 1.3 + idx) * 0.03);
    const { x, y } = pt(idx, rr);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = p.accent;
  g.globalAlpha = 0.14;
  g.fill();
  g.strokeStyle = p.accent;
  g.globalAlpha = 0.9;
  g.lineWidth = 1.4;
  g.stroke();
  g.globalAlpha = 1;

  // One vertex highlighted at a time, cycling — the axis currently "read".
  const active = Math.floor(t * 0.7) % axes;
  for (let idx = 0; idx < axes; idx++) {
    const rr = R * (base[idx] + Math.sin(t * 1.3 + idx) * 0.03);
    const { x, y } = pt(idx, rr);
    g.fillStyle = idx === active ? p.accent : p.ink;
    g.globalAlpha = idx === active ? 1 : 0.45;
    g.beginPath();
    g.arc(x, y, idx === active ? 4.5 : 2.5, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/* -------------------------------------------------------------------------- */
/* sweep - a rotating radar sweep lighting up city blips, with forecast bars   */
/* (weather dashboard)                                                         */

function drawSweep({ g, w, h, t, p }: Frame) {
  const cx = w * 0.36;
  const cy = h * 0.44;
  const R = Math.min(w, h) * 0.27;

  g.strokeStyle = p.faint;
  g.lineWidth = 1;
  [0.34, 0.67, 1].forEach((f) => {
    g.beginPath();
    g.arc(cx, cy, R * f, 0, Math.PI * 2);
    g.stroke();
  });
  g.beginPath();
  g.moveTo(cx - R, cy);
  g.lineTo(cx + R, cy);
  g.moveTo(cx, cy - R);
  g.lineTo(cx, cy + R);
  g.stroke();

  const angle = (t * 0.85) % (Math.PI * 2);

  // Trailing wedge behind the sweep line.
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, R, angle - 0.55, angle);
  g.closePath();
  g.fillStyle = p.accent;
  g.globalAlpha = 0.1;
  g.fill();
  g.globalAlpha = 1;

  g.strokeStyle = p.accent;
  g.globalAlpha = 0.8;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
  g.stroke();
  g.globalAlpha = 1;

  // City blips, lit briefly as the sweep passes over them.
  const blips: [number, number][] = [
    [0.52, 0.22],
    [0.82, 0.58],
    [0.3, 0.82],
    [0.66, 0.32],
    [0.2, 0.4],
  ];
  blips.forEach(([bx, by]) => {
    const x = cx + (bx - 0.5) * R * 1.7;
    const y = cy + (by - 0.5) * R * 1.7;
    let a = Math.atan2(y - cy, x - cx);
    if (a < 0) a += Math.PI * 2;
    let diff = angle - a;
    while (diff < 0) diff += Math.PI * 2;
    const lit = diff < 0.5;
    g.fillStyle = lit ? p.accent : p.ink;
    g.globalAlpha = lit ? 0.95 : 0.32;
    g.beginPath();
    g.arc(x, y, lit ? 3.5 : 2, 0, Math.PI * 2);
    g.fill();
  });
  g.globalAlpha = 1;

  // Seven-day forecast bars, bottom right, gently breathing.
  const bars = 7;
  const bx0 = w * 0.66;
  const bw = (w * 0.27) / bars;
  const by0 = h * 0.82;
  for (let i = 0; i < bars; i++) {
    const seed = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
    const bh = (0.32 + seed * 0.5) * h * 0.24;
    g.fillStyle = p.ink;
    g.globalAlpha = 0.16 + (Math.sin(t * 0.9 + i) * 0.5 + 0.5) * 0.14;
    g.fillRect(bx0 + i * bw, by0 - bh, bw - 3, bh);
  }
  g.globalAlpha = 1;
}

/* -------------------------------------------------------------------------- */
/* flame - live-fire tongues over an ember bed, embers rising                  */
/* (restaurant, single nightly seating)                                        */

function drawFlame({ g, w, h, t, p }: Frame) {
  const baseX = w / 2;
  const baseY = h * 0.84;

  g.strokeStyle = p.faint;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(w * 0.16, baseY);
  g.lineTo(w * 0.84, baseY);
  g.stroke();

  const tongues = 5;
  const centerIdx = Math.floor(tongues / 2);
  for (let i = 0; i < tongues; i++) {
    const fx = baseX + (i - centerIdx) * (w * 0.085);
    const seed = i * 1.7;
    const height = h * (0.32 + 0.09 * Math.sin(t * 1.6 + seed));
    const steps = 12;

    g.beginPath();
    g.moveTo(fx - 9, baseY);
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      const sway = Math.sin(t * 2.1 + seed + f * 4) * 5 * (1 - f);
      g.lineTo(fx + sway - 9 + f * 9, baseY - height * f);
    }
    for (let s = steps - 1; s >= 0; s--) {
      const f = s / steps;
      const sway = Math.sin(t * 1.9 + seed + f * 4 + 1.3) * 5 * (1 - f);
      g.lineTo(fx + sway + 9 - f * 9, baseY - height * f);
    }
    g.closePath();
    const isLead = i === centerIdx;
    g.strokeStyle = isLead ? p.accent : p.ink;
    g.globalAlpha = isLead ? 0.85 : 0.2 + 0.1 * Math.sin(t + seed);
    g.lineWidth = 1.2;
    g.stroke();
  }
  g.globalAlpha = 1;

  // Embers rising off the bed.
  const embers = 9;
  for (let i = 0; i < embers; i++) {
    const seed = Math.abs((Math.sin(i * 91.7) * 10000) % 1);
    const life = (t * 0.22 + seed) % 1;
    const x = baseX + Math.sin(i * 2.1 + t * 0.5) * w * 0.15;
    const y = baseY - life * h * 0.5;
    g.fillStyle = p.accent;
    g.globalAlpha = (1 - life) * 0.55;
    g.beginPath();
    g.arc(x, y, 1.6, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // The single held seating, marked once, steady beneath the fire.
  g.fillStyle = p.accent;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.arc(baseX, baseY + 9, 3, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

const RENDERERS: Record<Variant, (f: Frame) => void> = {
  toolpath: drawToolpath,
  lattice: drawLattice,
  ledger: drawLedger,
  conveyor: drawConveyor,
  radar: drawRadar,
  sweep: drawSweep,
  flame: drawFlame,
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
  const engine = useRef<{ start: () => void; stop: () => void } | null>(null);

  boostRef.current = boost;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const g = cv.getContext("2d", { alpha: true });
    if (!g) return;

    const render = RENDERERS[variant];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let sized = false;
    // `drawn` means this diagram has put a correct frame on its canvas. It is
    // deliberately separate from `raf`: a diagram can be drawn and still, and a
    // reduced-motion visitor only ever gets the still frame. Anything that
    // invalidates the picture — a resize, a theme change — repaints only if
    // there is already a picture to repaint.
    let drawn = false;
    let palette: Palette = { ink: "rgba(0,0,0,.6)", faint: "rgba(0,0,0,.14)", accent: "#ff5a1f" };

    const syncTheme = () => {
      palette = { ink: token("--ink", 0.62), faint: token("--ink", 0.13), accent: token("--accent", 1) };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      if (!w || !h) return false;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      sized = true;
      return true;
    };

    const paint = () => {
      if (!sized && !resize()) return;
      g.clearRect(0, 0, w, h);
      render({ g, w, h, t, p: palette });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.016 * boostRef.current;
      paint();
    };

    // Draw a still frame as soon as this diagram is anywhere near the fold —
    // a screen and a half of warning — independently of the animate signal.
    // This is the guarantee that a panel is never seen holding a blank canvas:
    // however fast the scroll, the picture is already there, and the frame loop
    // is a separate decision made by the `active` prop below.
    const nearIO = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        nearIO.disconnect();
        prime();
      },
      { rootMargin: "150% 0px 150% 0px" }
    );

    /* The loop is started and stopped by the `active` effect below rather
       than run permanently with an early return inside it.
    
       The early-return version still scheduled a callback every single frame,
       for all seven diagrams, for the whole session — seven rAF wake-ups per
       frame that did nothing but reschedule themselves. It also measured and
       painted all seven canvases the moment they mounted, which is seven
       forced layouts and seven full vector passes landing inside hydration.
       Now nothing is measured or drawn until a panel is genuinely near the
       viewport, and the frame callback stops existing the moment it leaves. */
    /** One correct still frame. Cheap, idempotent, and never starts a loop. */
    const prime = () => {
      if (drawn) return;
      syncTheme();
      // First frame at t = 0.6 so a diagram that has just scrolled into view
      // opens on a settled composition rather than on its zero state.
      if (!t) t = 0.6;
      paint();
      drawn = sized;
    };

    const start = () => {
      prime();
      if (!reduced && !raf) raf = requestAnimationFrame(loop);
    };

    /** Stops the animation. The frame already on the canvas stays there. */
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    engine.current = { start, stop };

    // The canvas measures its own box before it can draw, so it must redraw
    // whenever that box changes. It also draws here the first time it is given
    // a real size while already live — the belt to the IntersectionObserver's
    // braces. If a scroll ever outruns the observer, this is what guarantees
    // the panel is never left showing an unsized, undrawn canvas.
    const ro = new ResizeObserver(() => {
      sized = false;
      if (drawn) paint();
    });
    ro.observe(cv);
    nearIO.observe(cv);

    // Belt, braces, and a spare set of braces: draw the still frame in the
    // browser's first idle slot regardless of where the page is scrolled.
    //
    // The observer above gives a screen and a half of warning, which is ample
    // for any human scroll — but "ample for any human scroll" is a claim about
    // input speed, and a blank panel is too ugly a failure to leave resting on
    // one. Idle time is after first paint and after LCP, so this costs the
    // load nothing, and it means that within a couple of seconds of arriving
    // every diagram on the page is already drawn no matter what the visitor
    // does next. The frame loop is still a separate decision.
    const idler = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    // One frame after mount — after the browser has painted, before a human
    // could possibly have scrolled. Priming is a measure and a single vector
    // pass, not a loop, and doing it here rather than on an idle slot removes
    // the last window in which a fast flick could reach a panel whose drawing
    // had not been made yet. The frame loop is still gated on `active`.
    const idle = idler.requestIdleCallback
      ? idler.requestIdleCallback(() => prime(), { timeout: 120 })
      : window.setTimeout(() => prime(), 60);
    const firstFrame = requestAnimationFrame(() => prime());

    // And on the very first scroll, whichever comes sooner. The idle slot
    // above covers a visitor who arrives and reads; this covers the one who
    // arrives and immediately throws the page. It fires before any observer
    // can report an intersection, costs one listener that removes itself, and
    // closes the only window in which a panel could be reached before its
    // drawing exists.
    const onFirstScroll = () => prime();
    window.addEventListener("scroll", onFirstScroll, { passive: true, once: true });

    const mo = new MutationObserver(() => {
      if (!drawn) return; // undrawn diagrams read the palette when they start
      syncTheme();
      paint();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      stop();
      engine.current = null;
      if (idler.cancelIdleCallback) idler.cancelIdleCallback(idle);
      else clearTimeout(idle);
      cancelAnimationFrame(firstFrame);
      window.removeEventListener("scroll", onFirstScroll);
      nearIO.disconnect();
      ro.disconnect();
      mo.disconnect();
    };
  }, [variant]);

  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    if (active) e.start();
    else e.stop();
  }, [active]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
