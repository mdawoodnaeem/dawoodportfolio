"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * NEAR-VIEWPORT GATE
 *
 * Returns true once the referenced element comes within `margin` of the
 * viewport, and stays true afterwards.
 *
 * It exists to keep GSAP's ScrollTrigger out of the page's first second.
 *
 * Creating a ScrollTrigger is not free: on `enable()` it reads the scroller's
 * geometry and its own trigger's box, which is a forced synchronous layout of
 * the whole document. In a trace of this page that showed up as two layouts of
 * 275ms and 172ms, back to back, during hydration — a quarter of a second of
 * blocked main thread spent measuring where the work deck and the playground
 * camera should start, for sections several screens below the fold that the
 * visitor has not begun scrolling toward.
 *
 * Gating each section's triggers behind its own approach means the same
 * measurement happens later, spread out, and against a page whose fonts have
 * already landed — so it is both cheaper and more accurate. Nothing about the
 * animations themselves changes: by the time any of these sections is close
 * enough to scrub, its timeline exists.
 */
export function useNearViewport(
  ref: RefObject<HTMLElement | null>,
  margin = "60% 0px 60% 0px"
) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);

  return near;
}
