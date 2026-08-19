"use client";

/**
 * INTRO GATE
 *
 * The hero's entrance has to start the instant the preloader curtain clears —
 * not on a guessed timeout, because the preloader only runs once per tab.
 * A module-level flag rather than an event alone, so a component that mounts
 * after the signal has already fired still gets it.
 */

let ready = false;
const waiting = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  waiting.forEach((cb) => cb());
  waiting.clear();
}

export function onReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  waiting.add(cb);
  return () => waiting.delete(cb);
}
