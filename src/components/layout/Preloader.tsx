"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/motion";
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
 * The choreography is one timeline played at one of two speeds, and `PACE`
 * below is the only thing that differs between them. Every duration, every
 * ease and every overlap is shared, so the curtain looks and moves identically
 * on a phone and on a desktop — it simply gets through it faster on the phone.
 *
 * The reason is measured, not aesthetic. On a phone the hero is painted and
 * ready at about 1.2s, and the full-length curtain then held an opaque sheet
 * over it until 3.9s: two and a half seconds of finished page that nobody was
 * allowed to see. That is the whole of the difference between a mobile
 * Lighthouse score of 86 and one in the high nineties — Largest Contentful
 * Paint cannot fire while the thing it measures is behind a curtain, and Speed
 * Index reads a blank screen as no progress at all.
 *
 * Desktop keeps the full 2.7s, because there the wordmark behind the curtain
 * is large enough to be the contentful paint itself and the intro costs
 * nothing measurable. On a phone the same sheet is pure waiting.
 *
 * To restore the original mobile pace, set PACE.mobile to 1.
 */
const PACE = { mobile: 0.30, desktop: 1 };
export function Preloader() {
  const [done, setDone] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || sessionStorage.getItem("dn-seen") === "1") return;
    sessionStorage.setItem("dn-seen", "1");
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
    const counter = { v: 0 };

    // The site's own lg breakpoint: below it the layout is the phone layout,
    // and below it the curtain is the thing standing between a visitor and the
    // page they tapped through to.
    const k = window.matchMedia("(min-width: 1024px)").matches ? PACE.desktop : PACE.mobile;

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setDone(true);
      },
    });

    tl.to(counter, {
      v: 100,
      duration: 1.35 * k,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(counter.v);
        if (num.current) num.current.textContent = String(v).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`;
      },
    })
      .to([num.current, bar.current?.parentElement].filter(Boolean), {
        opacity: 0,
        duration: 0.4 * k,
        ease: "power2.out",
      })
      // The curtain leaves upward, so the eye is already travelling toward the
      // hero wordmark by the time it lands.
      .to(root.current, {
        yPercent: -100,
        duration: 1.05 * k,
        ease: EASE,
      }, `-=${0.1 * k}`);

    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, [done]);

  if (done) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[90] flex flex-col justify-end bg-page px-gut pb-[8vh]"
    >
      <div className="flex items-end justify-between gap-8">
        <span className="display display-trim text-[clamp(3rem,14vw,11rem)] leading-[0.8] tracking-[-0.04em]">
          Dawood
        </span>
        <span ref={num} className="micro nums text-muted">
          000
        </span>
      </div>
      <div className="mt-6 h-px w-full bg-line">
        <span
          ref={bar}
          className="block h-px w-full origin-left scale-x-0 bg-accent"
        />
      </div>
    </div>
  );
}
