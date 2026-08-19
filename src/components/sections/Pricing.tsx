"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { tiers, profile } from "@/content/site";
import { SectionHead } from "@/components/ui/Type";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn } from "@/lib/cn";

/**
 * ENGAGEMENTS
 *
 * Three price cards side by side is the single most template-shaped pattern on
 * the web, and it makes the reader do the work: five columns of ticks to
 * cross-reference before they know which one is theirs.
 *
 * This inverts it. The tiers differ on exactly one axis — how many properties
 * you need — so that axis becomes the control. You answer one question on a
 * track, and the engagement resolves: the price counts to its new figure, the
 * scope list restacks, the CTA relabels. It is a decision tool rather than a
 * table.
 *
 * Comparison isn't lost, it's moved: the strip along the bottom keeps all
 * three visible at a glance, so nobody has to click through the options to
 * find out what they are.
 */

/** "$1,100" → 1100. The figures live as display strings in content. */
const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, ""));

export function Pricing() {
  const [active, setActive] = useState(1); // Pro — the one most people land on
  const priceRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = useRef(-1);
  const tier = tiers[active];

  /** Count the headline figure to its new value rather than swapping it. */
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return;
    const to = toNumber(tier.price);

    if (prefersReducedMotion() || shown.current < 0) {
      el.textContent = `$${to.toLocaleString("en-US")}`;
      shown.current = to;
      return;
    }

    const counter = { v: shown.current };
    const tween = gsap.to(counter, {
      v: to,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = `$${Math.round(counter.v).toLocaleString("en-US")}`;
      },
      onComplete: () => {
        shown.current = to;
      },
    });
    return () => {
      tween.kill();
    };
  }, [tier.price]);

  /** Restack the scope list on every change, so the swap has direction. */
  useEffect(() => {
    if (!listRef.current || prefersReducedMotion()) return;
    const rows = listRef.current.querySelectorAll("li");
    const tween = gsap.fromTo(
      rows,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: "expo.out", overwrite: true }
    );
    return () => {
      tween.kill();
    };
  }, [active]);

  /** Arrow keys move between stops — the track is a real radiogroup. */
  const onKey = useCallback((e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
      : 0;
    if (!step) return;
    e.preventDefault();
    setActive((i) => Math.max(0, Math.min(tiers.length - 1, i + step)));
  }, []);

  return (
    <section id="pricing" className="shell scroll-mt-24 py-[clamp(6rem,13vw,11rem)]">
      <div data-reveal>
        <SectionHead n="04" label="Engagements" className="mask" />
      </div>

      <div className="mt-8 grid grid-cols-12 gap-y-6" data-reveal data-stagger="0.08">
        <h2 className="col-span-12 lg:col-span-6">
          <span className="mask display display-trim text-d2">
            <span className="grad">
              Clear numbers,
              <br />
              before we start.
            </span>
          </span>
        </h2>
        <p className="rise col-span-12 self-end text-lead text-muted lg:col-span-4 lg:col-start-9">
          Fixed scopes with fixed prices. Anything outside them gets quoted before a line
          of code is written, not after.
        </p>
      </div>

      {/* ---- the console ---- */}
      <div
        className="relative mt-[clamp(3rem,6vw,5rem)] overflow-hidden rounded-panel border border-line"
        data-reveal
        data-start="top 85%"
      >
        {/* Accent wash anchored to the active tier, so the whole panel shifts
            temperature as you move along the track. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-all duration-900 ease-out"
          style={{
            background: `radial-gradient(120% 90% at ${12 + active * 38}% 0%, rgb(var(--accent) / 0.13), transparent 62%)`,
          }}
        />

        {/* ---- the question ---- */}
        <div className="relative border-b border-line p-6 md:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <span className="micro text-faint">How many properties do you need?</span>
            <span className="micro nums text-accent-ink">
              {String(active + 1).padStart(2, "0")} / {String(tiers.length).padStart(2, "0")}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Choose an engagement size"
            onKeyDown={onKey}
            className="relative mt-9"
          >
            {/* Track */}
            <span aria-hidden="true" className="absolute inset-x-0 top-[7px] h-px bg-line" />
            <span
              aria-hidden="true"
              className="absolute left-0 top-[7px] h-px bg-accent transition-all duration-700 ease-out"
              style={{ width: `${(active / (tiers.length - 1)) * 100}%` }}
            />

            <div className="relative flex justify-between">
              {tiers.map((t, i) => {
                const on = i === active;
                const passed = i <= active;
                return (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={cn(
                      "group flex flex-col gap-4 focus-visible:outline-offset-8",
                      i === 0 && "items-start",
                      i === tiers.length - 1 && "items-end",
                      i > 0 && i < tiers.length - 1 && "items-center"
                    )}
                  >
                    {/* Stop */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative grid h-[15px] w-[15px] place-items-center rounded-full border transition-all duration-500 ease-out",
                        passed ? "border-accent" : "border-faint group-hover:border-ink",
                        on ? "bg-accent" : "bg-page"
                      )}
                    >
                      {on && (
                        <span className="absolute h-[15px] w-[15px] animate-ping rounded-full bg-accent opacity-40" />
                      )}
                    </span>

                    <span
                      className={cn(
                        i === tiers.length - 1 && "text-right",
                        i > 0 && i < tiers.length - 1 && "text-center"
                      )}
                    >
                      <span
                        className={cn(
                          "display nums block text-[clamp(1.4rem,2.6vw,2.1rem)] leading-none transition-colors duration-500",
                          on ? "text-ink" : "text-faint group-hover:text-muted"
                        )}
                      >
                        {t.volume.split(" ")[0]}
                      </span>
                      <span
                        className={cn(
                          "micro mt-2 block transition-colors duration-500",
                          on ? "text-accent-ink" : "text-faint"
                        )}
                      >
                        {t.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- the resolved engagement ---- */}
        <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="border-b border-line p-6 md:border-b-0 md:border-r md:p-9">
            <div className="flex items-baseline gap-3">
              {/* aria-live so the figure is announced when the track moves;
                  the counting digits themselves are hidden from the reader. */}
              <span
                ref={priceRef}
                aria-hidden="true"
                className="display nums text-[clamp(3rem,7.5vw,5.5rem)] leading-[0.9]"
              />
              <span className="micro text-faint">{tier.unit}</span>
            </div>
            <p className="sr-only" aria-live="polite">
              {tier.name}: {tier.price} {tier.unit}, {tier.volume}.
            </p>

            <p className="mt-5 max-w-sm text-lead text-muted">{tier.tagline}</p>

            <dl className="mt-8 space-y-3 border-t border-line pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="micro text-faint">Includes</dt>
                <dd className="text-[0.92rem] text-ink">{tier.volume}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="micro text-faint">Line items</dt>
                <dd className="nums text-[0.92rem] text-ink">{tier.features.length}</dd>
              </div>
            </dl>

            <Magnetic
              as="a"
              href={`mailto:${profile.email}?subject=${encodeURIComponent(`${tier.name} engagement`)}`}
              data-cursor="grow"
              className="mt-9"
            >
              Start with {tier.name}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Magnetic>
          </div>

          {/* Scope */}
          <div className="p-6 md:p-9">
            <p className="micro text-faint">What is in it</p>
            <ul ref={listRef} className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 border-b border-line py-3 text-[0.92rem] last:border-b-0 sm:last:border-b"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="mt-1.5 shrink-0 text-accent-ink"
                    aria-hidden="true"
                  >
                    <path d="M2 6.5L4.8 9.2L10 3.4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="text-muted">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- comparison strip ----
            The selector answers "which one is mine"; this keeps "what are the
            others" on screen, so choosing never hides the alternatives. */}
        <div className="relative grid grid-cols-3 border-t border-line">
          {tiers.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              tabIndex={-1}
              aria-hidden="true"
              className={cn(
                "group flex items-baseline justify-between gap-2 px-5 py-4 text-left transition-colors duration-500",
                i > 0 && "border-l border-line",
                i === active ? "bg-ink text-page" : "hover:bg-ink/[0.04]"
              )}
            >
              <span className={cn("micro", i === active ? "text-page/70" : "text-faint")}>
                {t.name}
              </span>
              <span className="nums text-[0.92rem]">{t.price}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-[0.85rem] text-faint" data-reveal>
        <span className="rise">
          Indicative starting points for standard scopes. Complex full-stack, AI or 3D work
          is quoted per project.
        </span>
      </p>
    </section>
  );
}
