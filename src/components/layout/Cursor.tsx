"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";

/**
 * CURSOR
 *
 * A dot that tracks the pointer exactly and a ring that trails it with a
 * quickTo lerp — the lag is what makes the pointer feel weighted rather than
 * glued on. Both use mix-blend-mode: difference, so a single white element
 * reads correctly over both themes and over imagery without any per-section
 * colour logic.
 *
 * Anything with [data-cursor] changes the ring: "grow" for links and buttons,
 * "drag" for the 3D scene.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 });

    // Hide the arrow only now — from script, on a fine pointer. Doing it in
    // the stylesheet would leave a visitor with no cursor at all if the bundle
    // never loads.
    document.documentElement.classList.add("has-cursor");

    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.55, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.55, ease: "power3" });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement)?.closest?.(
        "a, button, [data-cursor], input, textarea, summary"
      ) as HTMLElement | null;
      const mode = hit?.dataset?.cursor ?? (hit ? "grow" : "");
      const size = mode === "drag" ? 84 : mode === "grow" ? 62 : 38;
      gsap.to(r, {
        width: size,
        height: size,
        backgroundColor: mode ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0)",
        duration: 0.4,
        ease: "expo.out",
      });
      gsap.to(d, { scale: mode ? 0 : 1, duration: 0.3, ease: "expo.out" });
    };

    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.25 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
