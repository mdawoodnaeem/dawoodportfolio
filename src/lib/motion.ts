"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * MOTION CORE
 *
 * One registration point, one easing vocabulary, one reduced-motion switch.
 * Everything animated on the site pulls its timing from here so the whole
 * page shares a single sense of weight.
 *
 * GSAP IS IMPORTED STATICALLY, AND THAT IS DELIBERATE.
 *
 * It was moved to a dynamic import at one point, on the reasoning that 47KB
 * and a second of script bootup should not sit on the critical path when
 * nothing it drives can fire before the visitor has scrolled or moved.
 *
 * Measured, that made things worse, and the reason is priority rather than
 * size. As a static import the chunk is requested at ~41ms, in the same
 * parallel batch as everything else and at Low priority — it is finished and
 * out of the way long before the fold needs anything. Deferred, it is
 * requested at ~730ms instead: alone, later, and squarely on top of the window
 * in which the hero portrait is trying to arrive. Moving work later is not the
 * same as removing it, and a request that no longer overlaps the initial batch
 * competes with the one request that actually matters.
 *
 * The call sites are still asynchronous (`loadMotion().then(...)`), which
 * costs nothing here and keeps the option open — if the initial batch ever
 * gets small enough that GSAP is the thing holding it up, this is the only
 * function that has to change.
 */
export type Motion = { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger };

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const motion: Motion = { gsap, ScrollTrigger };
const ready = Promise.resolve(motion);

export function loadMotion(): Promise<Motion> {
  return ready;
}

/** Kept as a distinct name so scroll-linked call sites stay self-documenting. */
export function loadMotionOnScroll(): Promise<Motion> {
  return ready;
}

export function refreshTriggers() {
  ScrollTrigger.refresh();
}

export function updateTriggers() {
  ScrollTrigger.update();
}

/** Expo-out. Fast departure, long settle — the house curve. */
export const EASE = "expo.out";
/** Symmetric in-out for state changes that have no direction of travel. */
export const EASE_IO = "power3.inOut";

export const DUR = {
  micro: 0.35,
  fast: 0.6,
  base: 0.9,
  slow: 1.3,
} as const;

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True for phones and tablets — anything driven by a finger rather than a
 * pointing device. Several behaviours on this site exist only to answer a
 * mouse (the custom cursor, the magnetic buttons, the scroll rail, Lenis's
 * wheel smoothing) and every one of them costs main-thread time on a device
 * that can never trigger them.
 */
export function isTouch() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints ?? 0) > 0
  );
}

/**
 * Reveal-on-enter.
 *
 * One IntersectionObserver for the whole page rather than a ScrollTrigger per
 * element. Both approaches end at the same place — a single `.is-in` class,
 * with the transitions themselves living in CSS (`.mask`, `.rise` in
 * globals.css) — but they cost very different amounts to get there.
 *
 * ScrollTrigger measures every registered element against the scroller on
 * creation and again on every `refresh()` (a resize, a font landing, a
 * `ScrollTrigger.refresh()` call from any other section). With ~100 reveal
 * targets on this page that is ~100 forced synchronous layouts in a burst,
 * during hydration, which is precisely the window a throttled mobile audit
 * measures as blocking time.
 *
 * IntersectionObserver does the same geometry off the main thread and reports
 * back asynchronously, so the identical reveal costs no layout at all. The
 * `data-start` syntax is preserved: "top 88%" means "fire when the element's
 * top crosses 88% of the viewport", which is a bottom root margin of -12%.
 */
export function observeReveals(root: HTMLElement | Document = document) {
  if (typeof IntersectionObserver === "undefined") {
    // No observer (very old browser): show everything immediately rather than
    // leaving the page's content sitting at opacity 0.
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    return () => {};
  }

  const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
    (el) => !el.classList.contains("is-in")
  );

  // Elements are grouped by their threshold so one observer serves every
  // element sharing a start position — in practice two observers for the
  // whole page instead of a hundred triggers.
  const groups = new Map<number, HTMLElement[]>();
  for (const el of targets) {
    const raw = el.dataset.start ?? "top 88%";
    const pct = Number(/(\d+(?:\.\d+)?)%/.exec(raw)?.[1] ?? 88);
    const margin = Math.round(100 - pct);
    const list = groups.get(margin);
    if (list) list.push(el);
    else groups.set(margin, [el]);
  }

  const observers: IntersectionObserver[] = [];

  const reveal = (el: HTMLElement) => {
    // The stagger is applied at reveal time, not at setup. Walking every
    // reveal block's children up front means touching several hundred inline
    // styles before the page has finished painting; doing it here touches
    // only the block that is actually arriving, and the delay still lands in
    // the same style resolution as the class flip.
    const step = Number(el.dataset.stagger ?? 0);
    if (step) {
      const kids = el.querySelectorAll<HTMLElement>(".mask > *, .rise");
      for (let i = 0; i < kids.length; i++) {
        kids[i].style.transitionDelay = `${(i * step).toFixed(3)}s`;
      }
    }
    el.classList.add("is-in");
  };

  groups.forEach((list, margin) => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: `0px 0px -${margin}% 0px`, threshold: 0 }
    );
    list.forEach((el) => io.observe(el));
    observers.push(io);
  });

  return () => observers.forEach((io) => io.disconnect());
}

/**
 * Splits a string into per-character spans.
 *
 * Currently unused: the hero wordmark moved to a word-level reveal because a
 * transformed descendant breaks `background-clip: text`, and the wordmark's
 * gradient has to survive. Kept because it is the one primitive that cannot be
 * expressed in CSS alone.
 */
export function splitChars(text: string) {
  return text.split("").map((c, i) => ({ c: c === " " ? " " : c, i }));
}

/** Kept for the handful of call sites that only need the easing vocabulary. */
