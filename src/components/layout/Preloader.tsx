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
 */
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

    // Total timeline lands at ~0.9s end-to-end (0.55 + 0.22 + 0.5 - 0.35
    // overlap), matching the "~900ms" the hero actually needs — the previous
    // 1.35 + 0.4 + 1.05 timings added up to ~2.7s. The hero's own entrance
    // (`onReady`/`is-in`) doesn't start until this timeline completes, and
    // its `.mask`/`.rise` content sits translated out of view / at opacity 0
    // until then, so every extra second here was a second the real content
    // stayed hidden behind an opaque curtain — directly costing Speed Index
    // and LCP on a fresh (non-`sessionStorage`) visit, which is exactly what
    // every Lighthouse/PSI run is. Same choreography, same design, just
    // paced the way the comment already said it should be.
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setDone(true);
      },
    });

    tl.to(counter, {
      v: 100,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(counter.v);
        if (num.current) num.current.textContent = String(v).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`;
      },
    })
      .to([num.current, bar.current?.parentElement].filter(Boolean), {
        opacity: 0,
        duration: 0.22,
        ease: "power2.out",
      })
      // The curtain leaves upward, so the eye is already travelling toward the
      // hero wordmark by the time it lands.
      .to(root.current, {
        yPercent: -100,
        duration: 0.5,
        ease: EASE,
      }, "-=0.35");

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
