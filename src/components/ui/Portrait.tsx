"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Photo } from "@/components/ui/Photo";
import { profile } from "@/content/site";

/**
 * The portrait is never rendered wider than 384 CSS px (24rem at xl) and never
 * wider than 304 below lg, so the browser is told exactly that rather than
 * being left to assume the full viewport. Written as plain media queries — a
 * `min()` inside `sizes` is a newer syntax than the oldest browser this project
 * still builds for, and an unparsed source-size silently falls back to 100vw,
 * which would put us straight back to shipping the 900px master to phones.
 */
const PORTRAIT_SIZES =
  "(min-width: 1280px) 384px, (min-width: 1024px) 352px, (min-width: 390px) 304px, 78vw";
const PORTRAIT_WIDTHS = [384, 512, 640, 768, 900];

/* ==========================================================================
   TRAVELLING PORTRAIT

   One card for the whole page, not one per section.

   Three consecutive sections drop a <PortraitSlot> into their grid. A slot
   reserves layout space and nothing else. A single position:fixed card then
   measures all three every frame and interpolates between them, turning on
   its Y axis as it travels:

       hero (centre) ──180°──▶ manifesto (left) ──180°──▶ about (right)
         photo                   code screen                  photo

   Because the rotation is one continuous 0°→360° sweep and the faces use
   backface-visibility, the code screen is facing the viewer at exactly the
   moment the card parks over the manifesto — the section that says "I build
   things that are used" — and the photo is back by the time it lands on
   about. No per-section flip logic, no three cards, no state machine.

   The three stops must stay adjacent in scroll order. Put a section between
   them and the card spends that whole section floating over unrelated copy.
   ========================================================================== */

export type SlotId = "hero" | "manifesto" | "about";
const SLOT_ORDER: SlotId[] = ["hero", "manifesto", "about"];

type Registry = Map<SlotId, HTMLElement>;
const Ctx = createContext<{
  register: (id: SlotId, el: HTMLElement | null) => void;
  registry: Registry;
} | null>(null);

export function PortraitProvider({ children }: { children: React.ReactNode }) {
  const registry = useMemo<Registry>(() => new Map(), []);
  const register = useCallback(
    (id: SlotId, el: HTMLElement | null) => {
      if (el) registry.set(id, el);
      else registry.delete(id);
    },
    [registry]
  );
  // Memoised deliberately. An inline object here is a new value on every
  // render, which re-runs the stage's effect, which resets the card's
  // interpolation state to zero — the card then never finishes a rotation and
  // sits permanently mid-flip.
  const value = useMemo(() => ({ register, registry }), [register, registry]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* -------------------------------------------------------------------------- */
/*  Slot — reserves the space the flying card will occupy                      */
/* -------------------------------------------------------------------------- */

export function PortraitSlot({ id, className = "" }: { id: SlotId; className?: string }) {
  const ctx = useContext(Ctx);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ctx?.register(id, ref.current);
    return () => ctx?.register(id, null);
  }, [ctx, id]);

  return (
    <div
      ref={ref}
      data-portrait-slot={id}
      className={`mx-auto aspect-[4/5] w-full max-w-[19rem] lg:max-w-[22rem] xl:max-w-[24rem] ${className}`}
    >
      {/* Below lg the flying card is switched off — a card crossing a narrow
          screen fights the copy for space — so each slot renders its own
          static face in place instead. Only the hero copy is above the fold,
          so only it gets to jump the image queue. */}
      <div className="h-full lg:hidden">
        <Card face={id === "manifesto" ? "screen" : "photo"} priority={id === "hero"} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Faces                                                                      */
/* -------------------------------------------------------------------------- */

function PhotoFace({ priority = false }: { priority?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-panel">
      {/* Both grades ship; CSS picks one per theme, so neither mode is ever
          looking at an image lit for the other. */}
      <Photo
        base="portrait-ink"
        fallback="/img/portrait-ink.jpg"
        widths={PORTRAIT_WIDTHS}
        sizes={PORTRAIT_SIZES}
        alt={`${profile.name}, ${profile.role}`}
        priority={priority}
        className="img-ink object-cover object-[50%_16%] transition-opacity duration-500"
      />
      <Photo
        base="portrait-paper"
        fallback="/img/portrait-paper.jpg"
        widths={PORTRAIT_WIDTHS}
        sizes={PORTRAIT_SIZES}
        alt=""
        hidden
        priority={priority}
        className="img-paper object-cover object-[50%_16%] transition-opacity duration-500"
      />
      <div className="pointer-events-none absolute inset-0 rounded-panel ring-1 ring-inset ring-ink/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute inset-x-5 bottom-5">
        <p className="micro text-white/60">{profile.locationShort}</p>
        <p className="display mt-1.5 text-[1.15rem] leading-none text-white">{profile.short}</p>
      </div>
    </div>
  );
}

/** Syntax tones, fixed rather than themed — an editor looks like an editor. */
const TONE = {
  kw: "text-[#c7bcff]",
  fn: "text-[#ffc885]",
  str: "text-[#9fe6a0]",
  com: "text-white/30",
  plain: "text-white/55",
} as const;

const CODE: { indent: number; text: string; tone: keyof typeof TONE }[] = [
  { indent: 0, text: "// what runs when you hire me", tone: "com" },
  { indent: 0, text: "export const engineer = {", tone: "plain" },
  { indent: 1, text: "name: 'Dawood Naeem',", tone: "str" },
  { indent: 1, text: "stack: ['Next.js', 'React', 'Vue'],", tone: "str" },
  { indent: 1, text: "focus: ['3D web', 'agentic AI'],", tone: "str" },
  { indent: 1, text: "async ship(idea) {", tone: "fn" },
  { indent: 2, text: "return build(idea).untilItRuns();", tone: "kw" },
  { indent: 1, text: "},", tone: "plain" },
  { indent: 0, text: "};", tone: "plain" },
];

/**
 * The reverse face: a desk monitor running the code. Built from layered divs
 * rather than an image so it stays crisp at any card size and can pick up the
 * theme's accent instead of shipping two screenshots.
 */
function ScreenFace() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-panel bg-gradient-to-b from-[#17181f] to-[#0a0b0e]">
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[70px]"
        style={{ background: "rgb(var(--accent) / 0.35)" }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-panel ring-1 ring-inset ring-white/10" />

      <div className="w-[86%] [perspective:1200px]">
        <div className="[transform:rotateX(5deg)]">
          <div className="relative rounded-[11px] border border-white/10 bg-[#06070a] p-[7px] shadow-[0_28px_60px_-18px_rgb(0_0_0/0.85)]">
            <span className="absolute left-1/2 top-[3px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/25" />
            <div className="relative overflow-hidden rounded-[5px] bg-[#0b0d12]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5">
                <span className="h-[6px] w-[6px] rounded-full bg-[#ff766a]" />
                <span className="h-[6px] w-[6px] rounded-full bg-[#e0b95f]" />
                <span className="h-[6px] w-[6px] rounded-full bg-[#84e26a]" />
                <span className="micro ml-1.5 text-[7px] text-white/30">build.ts</span>
              </div>
              <div className="px-3 py-3 font-mono text-[8.5px] leading-[1.7] sm:text-[9.5px]">
                {CODE.map((line, i) => (
                  <div
                    key={i}
                    style={{ paddingLeft: `${line.indent * 1.1}em` }}
                    className={TONE[line.tone]}
                  >
                    {line.text}
                  </div>
                ))}
                <span className="mt-0.5 inline-block h-2 w-[5px] animate-pulse bg-accent align-middle" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.06]" />
            </div>
          </div>
          <div className="mx-auto mt-1 h-4 w-[14%] bg-gradient-to-b from-[#1a1b21] to-[#0d0e12]" />
          <div className="mx-auto h-[5px] w-[42%] rounded-[3px] bg-gradient-to-b from-[#1d1e25] to-[#0a0b0e]" />
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5">
        <p className="micro text-white/40">The workstation</p>
        <p className="display mt-1.5 text-[1.15rem] leading-none text-white">Shipping, not slides</p>
      </div>
    </div>
  );
}

function Card({ face, priority = false }: { face: "photo" | "screen"; priority?: boolean }) {
  return (
    <div className="relative h-full w-full">
      {face === "photo" ? <PhotoFace priority={priority} /> : <ScreenFace />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage — the one card that actually moves                                   */
/* -------------------------------------------------------------------------- */

/**
 * Easing inside a travel segment: dwell at the stop, move, settle.
 * Without the dwell the card is in perpetual motion and never appears to
 * belong to any section it visits.
 */
function dwell(u: number) {
  const k = Math.min(1, Math.max(0, (u - 0.26) / (0.8 - 0.26)));
  return k * k * (3 - 2 * k);
}

export function PortraitStage() {
  const ctx = useContext(Ctx);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const measure = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setOn(window.innerWidth >= 1024 && !reduced);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!on || !ctx) return;
    const stageEl = stage.current;
    const cardEl = card.current;
    if (!stageEl || !cardEl) return;

    // Rendered transform, lerped toward the target every frame, so scroll
    // stutter never shows up as jitter in the card.
    const cur = { x: 0, y: 0, rot: 0, tilt: 0, scale: 1, opacity: 0, w: 0, h: 0 };
    let primed = false;
    let raf = 0;
    let prev = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Time-based smoothing, not per-frame. A fixed per-frame lerp moves at
      // half speed on a 30fps device and crawls on a slow GPU — the card
      // would simply never finish its rotation.
      const dt = Math.min((now - prev) / 1000, 1 / 20);
      prev = now;
      const vh = window.innerHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Anchors in document space: where each slot's centre meets the
      // viewport's centre.
      const anchors: { cx: number; cy: number; sy: number; bottom: number; w: number; h: number }[] = [];
      for (const id of SLOT_ORDER) {
        const el = ctx.registry.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        anchors.push({
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          sy: r.top + scrollY + r.height / 2 - vh / 2,
          bottom: r.bottom,
          w: r.width,
          h: r.height,
        });
      }
      if (anchors.length < 2) return;

      // Locate ourselves along the chain of stops.
      let seg = 0;
      let u = 0;
      const last = anchors.length - 1;
      if (scrollY <= anchors[0].sy) {
        seg = 0;
        u = 0;
      } else if (scrollY >= anchors[last].sy) {
        seg = last - 1;
        u = 1;
      } else {
        for (let i = 0; i < last; i++) {
          if (scrollY >= anchors[i].sy && scrollY <= anchors[i + 1].sy) {
            seg = i;
            const span = anchors[i + 1].sy - anchors[i].sy;
            u = span > 0 ? (scrollY - anchors[i].sy) / span : 0;
            break;
          }
        }
      }

      const e = dwell(u);
      const a = anchors[seg];
      const b = anchors[seg + 1];

      // Size comes from the slots, never from the viewport: the card has to be
      // exactly as wide as the gap the layout reserved for it, or it covers
      // the wordmark on one side and leaves a hole on the other.
      const targetW = a.w + (b.w - a.w) * e;
      const targetH = a.h + (b.h - a.h) * e;
      const targetX = a.cx + (b.cx - a.cx) * e - targetW / 2;

      // Vertically the card rides between the two slots exactly as it does
      // horizontally. Snapping to whichever stop is nearest and clamping into
      // a fixed band looked stable in isolation, but it left the card hovering
      // over whatever copy happened to be on screen once its slot had scrolled
      // past. Following the slots means it leaves with them.
      //
      // The clamp that remains is only a guard against a slot being measured
      // far off screen; it still allows the card to run partly out of frame.
      const rawY = a.cy + (b.cy - a.cy) * e - targetH / 2;
      const targetY = Math.max(-targetH * 0.4, Math.min(vh - targetH * 0.6, rawY));

      const travel = Math.sin(Math.max(0, Math.min(1, e)) * Math.PI);
      const targetRot = (seg + e) * 180;

      // Fade out as the final slot itself leaves the top of the screen, not
      // after a fixed scroll distance. A fixed distance made the card vanish
      // while the reader was still halfway down the section it had just
      // arrived in.
      const fadeOut = Math.min(1, Math.max(0, anchors[last].bottom / (vh * 0.45)));
      const before = anchors[0].sy - scrollY;
      const fadeIn = 1 - Math.min(1, Math.max(0, (before - vh * 0.5) / (vh * 0.5)));

      const k = primed ? 1 - Math.exp(-10 * dt) : 1;
      primed = true;
      cur.x += (targetX - cur.x) * k;
      cur.y += (targetY - cur.y) * k;
      cur.rot += (targetRot - cur.rot) * k;
      cur.tilt += (travel * 7 - cur.tilt) * k;
      cur.scale += (1 - travel * 0.07 - cur.scale) * k;
      cur.opacity += (Math.min(fadeOut, fadeIn) - cur.opacity) * (1 - Math.exp(-12 * dt));
      cur.w += (targetW - cur.w) * k;
      cur.h += (targetH - cur.h) * k;

      stageEl.style.width = `${cur.w.toFixed(1)}px`;
      stageEl.style.height = `${cur.h.toFixed(1)}px`;

      stageEl.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
      stageEl.style.opacity = cur.opacity.toFixed(3);
      stageEl.style.visibility = cur.opacity < 0.01 ? "hidden" : "visible";
      cardEl.style.transform = `rotateY(${cur.rot.toFixed(2)}deg) rotateZ(${cur.tilt.toFixed(
        2
      )}deg) scale(${cur.scale.toFixed(3)})`;
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [on, ctx]);

  if (!on) return null;

  return (
    <div
      ref={stage}
      className="portrait-stage"
      // A starting box so the fill images have a height on the first paint;
      // the frame loop takes over the real dimensions immediately.
      style={{ width: 320, height: 400, opacity: 0 }}
      aria-hidden="true"
    >
      <div ref={card} className="portrait-card">
        <div className="portrait-face">
          <PhotoFace priority />
        </div>
        <div className="portrait-face portrait-face--back">
          <ScreenFace />
        </div>
      </div>
    </div>
  );
}
