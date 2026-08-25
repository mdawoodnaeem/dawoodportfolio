"use client";

import { useEffect, useRef, useState } from "react";
import { sections } from "@/content/site";
import { useSmooth } from "@/lib/smooth";
import { cn } from "@/lib/cn";

/**
 * SCROLL RAIL
 *
 * A fixed right-hand index: one tick per section, filling as the page moves,
 * with the active label revealed on approach. It doubles as jump navigation.
 *
 * Position is read from a single rAF-throttled scroll listener rather than one
 * IntersectionObserver per section — the rail needs a continuous 0–1 value for
 * the progress line anyway, so the observer would be a second source of truth.
 */
export function ScrollRail() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const frame = useRef(0);
  const { scrollTo } = useSmooth();

  useEffect(() => {
    // The rail is `hidden` below `lg` in the markup below, so on a phone or
    // tablet none of this is ever seen — but without this guard the scroll
    // listener still ran there anyway, reading `getBoundingClientRect` on
    // every section on every scroll frame purely to update state nobody
    // could see. That's wasted forced-reflow work on exactly the devices
    // that can least afford it. `lg` here has to match the `lg:block` below.
    const mq = window.matchMedia("(min-width: 1024px)");
    let cleanup: (() => void) | undefined;

    const setup = () => {
      const read = () => {
        frame.current = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);

        // "Active" is the last section whose top has crossed 45% of the viewport.
        const line = window.innerHeight * 0.45;
        let idx = -1;
        sections.forEach((s, i) => {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= line) idx = i;
        });
        setActive(idx);
      };
      const onScroll = () => {
        if (!frame.current) frame.current = requestAnimationFrame(read);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      read();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        cancelAnimationFrame(frame.current);
      };
    };

    const sync = () => {
      cleanup?.();
      cleanup = mq.matches ? setup() : undefined;
    };

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cleanup?.();
    };
  }, []);

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed right-[max(1rem,2.2vw)] top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col items-end gap-4">
        {sections.map((s, i) => (
          <li key={s.id} className="pointer-events-auto">
            <button
              onClick={() => scrollTo(`#${s.id}`, { offset: -8 })}
              className="group flex items-center justify-end gap-3"
              tabIndex={-1}
            >
              {/* Labels appear on hover only.
                  Keeping the active one permanently visible pushed a word out
                  into the page's right gutter, where it collided with any
                  section whose content runs the full width of the shell — the
                  engagements console being the obvious one. The active tick
                  already carries that state, in a column that is always empty. */}
              <span
                className={cn(
                  "micro translate-x-2 whitespace-nowrap rounded-full bg-page/80 px-2 py-1 text-[0.5625rem]",
                  "glass-soft opacity-0 transition-all duration-500 ease-out",
                  "group-hover:translate-x-0 group-hover:opacity-100",
                  i === active && "text-accent-ink"
                )}
              >
                {s.label}
              </span>
              <span
                className={cn(
                  "block h-px transition-all duration-600 ease-out",
                  i === active
                    ? "w-8 bg-accent"
                    : "w-4 bg-faint group-hover:w-6 group-hover:bg-ink"
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Overall progress, as a share of a fixed-length track. */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <span className="micro nums text-[0.5625rem] text-faint">
          {String(Math.round(progress * 100)).padStart(2, "0")}
        </span>
        <span className="relative block h-16 w-px bg-line">
          <span
            className="absolute left-0 top-0 w-px origin-top bg-ink"
            style={{ height: `${progress * 100}%` }}
          />
        </span>
      </div>
    </aside>
  );
}
