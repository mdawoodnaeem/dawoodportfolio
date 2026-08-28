"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { refreshTriggers, updateTriggers, observeReveals, prefersReducedMotion, isTouch } from "./motion";

/**
 * SMOOTH SCROLL
 *
 * Lenis drives the page, GSAP's ticker drives Lenis, and ScrollTrigger reads
 * from Lenis. Wiring all three to one clock is what stops pinned sections from
 * juddering a frame behind the content that scrolls past them.
 *
 * Duration/easing are tuned for control rather than float: a 0.9 lerp with a
 * short exponential tail tracks the wheel closely and settles without drift.
 *
 * TOUCH DEVICES DO NOT GET LENIS.
 *
 * They never did in any meaningful sense — `syncTouch: false` means Lenis
 * hands the gesture straight back to the platform, because iOS and Android
 * momentum is already better than anything a rAF lerp can fake. What the
 * instance still did on a phone was run a requestAnimationFrame loop for the
 * entire life of the session and push a `ScrollTrigger.update()` through it on
 * every scroll event, for a smoothing effect that was switched off. Skipping
 * the instance outright removes a permanent main-thread tick from every mobile
 * visit and changes nothing anybody can see — native scrolling behaves
 * identically, and ScrollTrigger falls back to its own passive scroll
 * listener, which is what it uses on any site without a smooth-scroll library.
 *
 * The library is also loaded lazily rather than bundled into the page's first
 * chunk, so a phone never downloads or parses it at all.
 */

type Ctx = { scrollTo: (target: string | number, opts?: { offset?: number }) => void };
const SmoothCtx = createContext<Ctx>({ scrollTo: () => {} });
export const useSmooth = () => useContext(SmoothCtx);

type LenisLike = {
  raf: (time: number) => void;
  on: (event: "scroll", cb: () => void) => void;
  destroy: () => void;
  scrollTo: (target: string | number, opts?: { offset?: number; duration?: number }) => void;
};

export function SmoothProvider({ children }: { children: React.ReactNode }) {
  const lenis = useRef<LenisLike | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || isTouch()) {
      setReady(true);
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // Lenis only — no animation library. This branch is skipped on touch
    // anyway, but even on a pointer device smooth scrolling has no reason to
    // wait for, or to drag in, GSAP.
    void import("lenis").then(({ default: Lenis }) => {
      if (disposed) return;
      const instance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        // Native scrolling on touch: momentum there is already good, and
        // hijacking it costs more than it buys.
        syncTouch: false,
      });
      lenis.current = instance as unknown as LenisLike;

      instance.on("scroll", updateTriggers);

      let frame = 0;
      const tick = (time: number) => {
        instance.raf(time);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        instance.destroy();
        lenis.current = null;
      };
    });

    setReady(true);
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  // Wire up reveals once the DOM below has mounted. Re-running on `ready`
  // means triggers are created after Lenis exists, so their start positions
  // are measured against the real scroll height.
  useEffect(() => {
    if (!ready) return;
    const kill = observeReveals();
    // The reveals themselves are IntersectionObserver-driven now and need no
    // re-measurement, but the handful of genuine scrub timelines (the hero
    // parallax, the manifesto sweep, the work deck) still do once a late
    // webfont has changed every measurement on the page. One refresh on the
    // load event covers it; `document.fonts.ready` used to add a second,
    // earlier one, which forced the same full layout twice.
    const refresh = () => refreshTriggers();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      kill();
    };
  }, [ready]);

  const scrollTo: Ctx["scrollTo"] = (target, opts) => {
    const offset = opts?.offset ?? 0;
    if (lenis.current) {
      lenis.current.scrollTo(target, { offset, duration: 1.4 });
      return;
    }

    const el = typeof target === "string" ? document.querySelector(target) : null;
    if (typeof target === "string" && !el) return;
    const to =
      typeof target === "number"
        ? target + offset
        : el!.getBoundingClientRect().top + window.scrollY + offset;

    if (prefersReducedMotion()) {
      window.scrollTo(0, to);
      return;
    }
    // Touch devices no longer carry a Lenis instance (see above), but a nav tap
    // still has to travel the way it always did. This is the same journey Lenis
    // was making — 1.4s on the identical exponential curve the instance was
    // configured with — driven by a one-shot rAF that exists only while the
    // scroll is running, rather than by a ticker that idles for the whole
    // session. The platform's own `behavior: "smooth"` was the obvious
    // substitute and is what this replaced: it is a different duration on a
    // different curve, so a jump that used to glide arrived with a snap.
    jump(to);
  };

  return <SmoothCtx.Provider value={{ scrollTo }}>{children}</SmoothCtx.Provider>;
}

/** The easing Lenis was constructed with, so a jump is the same shape it was. */
const ease = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

let running = 0;

function jump(to: number) {
  cancelAnimationFrame(running);
  const from = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const end = Math.max(0, Math.min(max, to));
  const dist = end - from;
  if (Math.abs(dist) < 1) return;

  const t0 = performance.now();
  const DUR = 1400;

  // Any real gesture during the travel hands control straight back, the way a
  // smooth-scroll library does. Without this the page fights the user's thumb.
  const stop = () => {
    cancelAnimationFrame(running);
    running = 0;
    detach();
  };
  const detach = () => {
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };
  window.addEventListener("wheel", stop, { passive: true, once: true });
  window.addEventListener("touchstart", stop, { passive: true, once: true });
  window.addEventListener("keydown", stop, { once: true });

  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / DUR);
    window.scrollTo(0, from + dist * ease(p));
    if (p < 1) running = requestAnimationFrame(step);
    else {
      running = 0;
      detach();
    }
  };
  running = requestAnimationFrame(step);
}
