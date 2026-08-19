"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * MOTION CORE
 *
 * One registration point, one easing vocabulary, one reduced-motion switch.
 * Everything animated on the site pulls its timing from here so the whole
 * page shares a single sense of weight.
 */

// Registered once per module instance; the module is a singleton per bundle.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
 * Reveal-on-enter.
 *
 * Deliberately just toggles a class: the transitions themselves live in CSS
 * (`.mask`, `.rise` in globals.css). That keeps GSAP out of the paint
 * path for the ~100 elements that only need to appear once, and means content
 * is still styled correctly if the bundle fails to load.
 */
export function observeReveals(root: HTMLElement | Document = document) {
  const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
  const triggers: ScrollTrigger[] = [];

  targets.forEach((el) => {
    if (el.classList.contains("is-in")) return;

    // Stagger children by walking the CSS transition-delay, not by animating
    // each one — a single class flip stays cheap however many children exist.
    const step = Number(el.dataset.stagger ?? 0);
    if (step) {
      Array.from(el.querySelectorAll<HTMLElement>(".mask > *, .rise")).forEach((child, i) => {
        child.style.transitionDelay = `${(i * step).toFixed(3)}s`;
      });
    }

    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: el.dataset.start ?? "top 88%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      })
    );
  });

  return () => triggers.forEach((t) => t.kill());
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
  return text.split("").map((c, i) => ({ c: c === " " ? " " : c, i }));
}

export { gsap, ScrollTrigger };
