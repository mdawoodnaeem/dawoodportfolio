"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { markReady } from "@/lib/ready";

/**
 * PRELOADER
 *
 * Buys the ~900ms the hero needs to have its fonts measured and its first
 * frame composited, and spends it on something worth watching: a counter and
 * a curtain that lifts off the top of the fold.
 *
 * Runs once per tab (sessionStorage), never for reduced-motion users, and is
 * removed from the DOM entirely afterwards so it can't trap focus or intercept
 * a single pointer event.
 *
 * PACE
 * ────
 * The choreography is one sequence played at one of two speeds, and `PACE`
 * below is the only thing that differs between them. Every duration, every
 * ease and every overlap is shared, so the curtain looks and moves identically
 * on a phone and on a desktop — it simply gets through it faster on the phone.
 *
 * The reason is measured, not aesthetic. On a phone the hero is painted and
 * ready at about 1.2s, and the full-length curtain then held an opaque sheet
 * over it until 3.9s: two and a half seconds of finished page that nobody was
 * allowed to see. Largest Contentful Paint cannot fire while the thing it
 * measures is behind a curtain, and Speed Index reads a blank screen as no
 * progress at all.
 *
 * Desktop keeps the full 2.7s, because there the wordmark behind the curtain
 * is large enough to be the contentful paint itself and the intro costs
 * nothing measurable. On a phone the same sheet is pure waiting.
 *
 * To restore the original mobile pace, set PACE.mobile to 1.
 *
 * WHY THIS IS NOT A GSAP TIMELINE ANY MORE
 * ────────────────────────────────────────
 * It used to be, and it was the only thing on the site that needed GSAP in the
 * first second — everything else the library drives is scroll- or
 * pointer-linked and cannot fire until the visitor has seen the page. That one
 * dependency forced GSAP into the page's first chunk: 47KB over the wire and
 * ~1s of script bootup, all of it running before the browser was free to paint.
 *
 * The bar, the fade and the lift are now CSS keyframes (see globals.css) with
 * GSAP's own curves written as their bezier equivalents, so the movement is
 * unchanged. Only the counter's digits need a script, and a counter is a
 * number in a text node — a dozen lines of requestAnimationFrame, not a
 * library.
 */
const PACE = { mobile: 0.30, desktop: 1 };

/** GSAP's power2.inOut, so the digits keep pace with the rule beneath them. */
const power2InOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Preloader() {
  const [done, setDone] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const [pace, setPace] = useState(PACE.desktop);

  useEffect(() => {
    if (prefersReducedMotion() || sessionStorage.getItem("dn-seen") === "1") return;
    sessionStorage.setItem("dn-seen", "1");
    // The site's own lg breakpoint: below it the layout is the phone layout,
    // and below it the curtain is the thing standing between a visitor and the
    // page they tapped through to.
    setPace(window.matchMedia("(min-width: 1024px)").matches ? PACE.desktop : PACE.mobile);
    setDone(false);
  }, []);

  // Release the hero's entrance the instant the curtain is gone.
  useEffect(() => {
    if (done) markReady();
  }, [done]);

  useEffect(() => {
    if (done || !root.current) return;

    // Hold the page still while the curtain is up.
    document.documentElement.style.overflow = "hidden";

    const total = 2.7 * pace * 1000;
    const counterFor = 1.35 * pace * 1000;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / counterFor);
      if (num.current) {
        num.current.textContent = String(Math.round(power2InOut(t) * 100)).padStart(3, "0");
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // The curtain's own animation is what ends the intro; the timer is only a
    // guard for a tab that was backgrounded while it played, where animation
    // events do not fire.
    const guard = window.setTimeout(() => finish(), total + 400);
    const finish = () => {
      window.clearTimeout(guard);
      document.documentElement.style.overflow = "";
      setDone(true);
    };

    const el = root.current;
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName.includes("intro-lift")) finish();
    };
    el.addEventListener("animationend", onEnd);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(guard);
      el.removeEventListener("animationend", onEnd);
      document.documentElement.style.overflow = "";
    };
  }, [done, pace]);

  if (done) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="intro-curtain fixed inset-0 z-[90] flex flex-col justify-end bg-page px-gut pb-[8vh]"
      style={{ "--intro-k": pace } as React.CSSProperties}
    >
      <div className="intro-meta flex items-end justify-between gap-8">
        <span className="display display-trim text-[clamp(3rem,14vw,11rem)] leading-[0.8] tracking-[-0.04em]">
          Dawood
        </span>
        <span ref={num} className="micro nums text-muted">
          000
        </span>
      </div>
      <div className="intro-meta mt-6 h-px w-full bg-line">
        <span className="intro-bar block h-px w-full origin-left bg-accent" />
      </div>
    </div>
  );
}
