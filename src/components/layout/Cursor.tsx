"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * CURSOR
 *
 * The system arrow is never hidden. A small filled dot tracks it exactly,
 * and a dashed ring trails a little behind with its own quiet, constant
 * spin — that idle rotation is the signature that makes this read as an
 * engineered instrument rather than a decoration, and it means the hover
 * state is a gear shifting up (faster spin, tighter solid ring) rather than
 * a different object appearing out of nowhere.
 *
 * Deliberately never grows into a solid fill and never carries a text
 * label: both of those made the old version big enough to sit on top of
 * whatever it was hovering (the nav bar's own links, most visibly), which
 * is the one thing a cursor should never do. The nav's colour change is
 * left to carry that signal on its own, same as it always did.
 *
 * Visibility is driven by real pointer events rather than a `matchMedia`
 * check taken once at mount — `(pointer: coarse)` can misreport on the very
 * first paint on some hybrid touch/mouse devices, which is what made the
 * cursor occasionally fail to appear until a reload. Reading `e.pointerType`
 * off every event is authoritative and has no such race. The show/hide state
 * is also idempotent: leaving the window hides it but does not latch it
 * hidden — the next real mouse movement always brings it back, where before
 * a single stray `pointerleave` (switching tabs, a system dialog, the
 * pointer grazing the very edge of the viewport) could leave it invisible
 * for the rest of the session.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    const reduced = prefersReducedMotion();

    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.4, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.4, ease: "power3" });

    // The idle spin. Composited alongside the x/y quickTo tweens above —
    // GSAP's transform cache tracks translate and rotate as independent
    // components on the same element, so this never fights the position
    // tweens for control of the `transform` property.
    const spin = reduced ? null : gsap.to(r, { rotate: 360, duration: 9, ease: "none", repeat: -1 });

    let live = false;

    const reveal = () => {
      if (live) return;
      live = true;
      gsap.to([d, r], { opacity: 1, duration: 0.35 });
    };
    const conceal = () => {
      if (!live) return;
      live = false;
      gsap.to([d, r], { opacity: 0, duration: 0.25 });
    };

    const isFine = (e: PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";

    const move = (e: PointerEvent) => {
      if (!isFine(e)) return;
      reveal();
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const over = (e: PointerEvent) => {
      if (!isFine(e)) return;
      const hit = (e.target as HTMLElement)?.closest?.(
        "a, button, [data-cursor], input, textarea, summary"
      );
      const active = !!hit;
      gsap.to(r, {
        width: active ? 50 : 30,
        height: active ? 50 : 30,
        backgroundColor: active ? "rgb(var(--accent) / 0.08)" : "rgb(var(--accent) / 0)",
        borderColor: active ? "rgb(var(--accent) / 0.85)" : "rgb(var(--accent) / 0.45)",
        duration: 0.4,
        ease: "expo.out",
        onStart: () => (r.style.borderStyle = active ? "solid" : "dashed"),
      });
      spin?.timeScale(active ? 2.6 : 1);
      gsap.to(d, { scale: active ? 0.4 : 1, duration: 0.3, ease: "expo.out" });
    };

    // A small tactile squeeze-and-release on click — cheap, transform-only,
    // and it is the one thing that makes a custom cursor feel alive instead
    // of just decorative.
    const down = () => {
      if (!live || reduced) return;
      gsap.to(r, { scale: 0.86, duration: 0.18, ease: "power3.out" });
    };
    const up = () => {
      if (!live || reduced) return;
      gsap.to(r, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.55)" });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointerleave", conceal);
    window.addEventListener("blur", conceal);

    return () => {
      spin?.kill();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", conceal);
      window.removeEventListener("blur", conceal);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
