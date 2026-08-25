"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { hasWeakGPU } from "@/lib/gl";

/**
 * Client boundary for the living backdrop.
 *
 * The layout is a Server Component, and `next/dynamic` refuses `ssr: false`
 * there. This one-line client wrapper is the boundary that lets the WebGL
 * layer stay out of the server render and out of the main bundle — the page is
 * fully readable on the flat page colour before the canvas ever arrives.
 */
const Backdrop = dynamic(() => import("./Backdrop"), { ssr: false });

export function BackdropMount() {
  // Three.js + react-three-fiber is the single heaviest chunk on the page.
  // Deferring its fetch/parse to the browser's idle slot — after the page
  // has already painted and hydrated — keeps it from competing with the
  // hero portrait and the rest of the visible content for the main thread
  // on the first render, which is exactly what a throttled mobile Lighthouse
  // run penalises. The backdrop is decorative and behind everything, so a
  // fractional, imperceptible delay before it fades in costs nothing visible.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasWeakGPU()) return; // no real GPU behind this session — draw nothing
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <Backdrop />;
}
