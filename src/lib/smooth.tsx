"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, observeReveals, prefersReducedMotion } from "./motion";

/**
 * SMOOTH SCROLL
 *
 * Lenis drives the page, GSAP's ticker drives Lenis, and ScrollTrigger reads
 * from Lenis. Wiring all three to one clock is what stops pinned sections from
 * juddering a frame behind the content that scrolls past them.
 *
 * Duration/easing are tuned for control rather than float: a 0.9 lerp with a
 * short exponential tail tracks the wheel closely and settles without drift.
 */

type Ctx = { scrollTo: (target: string | number, opts?: { offset?: number }) => void };
const SmoothCtx = createContext<Ctx>({ scrollTo: () => {} });
export const useSmooth = () => useContext(SmoothCtx);

export function SmoothProvider({ children }: { children: React.ReactNode }) {
  const lenis = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      setReady(true);
      return;
    }

    // Deferred to idle rather than set up in the first effect that runs.
    // Lenis + GSAP's ticker + ScrollTrigger are real, necessary work, but
    // none of it needs to happen before the hero is on screen — the hero's
    // own entrance is gated by the preloader (`onReady`), not by anything
    // here. Running this setup synchronously on mount put it right in the
    // middle of the browser's busiest window (hydration + first paint),
    // which is exactly the "long main-thread task" a throttled mobile CPU
    // reports as render-delay on the LCP image: the pixels are decoded and
    // ready, the thread just isn't free to paint them yet. Same fallback
    // shape as `BackdropMount`'s idle defer for the WebGL layer.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cleanup: (() => void) | undefined;

    const setup = () => {
      if (cancelled) return;
      const instance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        // Native scrolling on touch: momentum there is already good, and
        // hijacking it costs more than it buys.
        syncTouch: false,
      });
      lenis.current = instance;

      instance.on("scroll", ScrollTrigger.update);

      const tick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      setReady(true);
      cleanup = () => {
        gsap.ticker.remove(tick);
        instance.destroy();
        lenis.current = null;
      };
    };

    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(setup, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(setup, 200);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      cleanup?.();
    };
  }, []);

  // Wire up reveals once the DOM below has mounted. Re-running on `ready`
  // means triggers are created after Lenis exists, so their start positions
  // are measured against the real scroll height.
  useEffect(() => {
    if (!ready) return;
    const kill = observeReveals();
    const refresh = () => ScrollTrigger.refresh();
    // Late-loading webfonts change every measurement on the page.
    document.fonts?.ready.then(refresh);
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
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    else if (typeof target === "number") window.scrollTo(0, target + offset);
  };

  return <SmoothCtx.Provider value={{ scrollTo }}>{children}</SmoothCtx.Provider>;
}
