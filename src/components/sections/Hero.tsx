"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/motion";
import { onReady } from "@/lib/ready";
import { profile, capabilities } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { Availability } from "@/components/ui/Type";
import { PortraitSlot } from "@/components/ui/Portrait";
import { useSmooth } from "@/lib/smooth";

/**
 * HERO
 *
 * One wordmark, split around the portrait: FULL-STACK (photo) DEVELOPER.
 * The photo is not beside the type, it is inside it, holding the two halves
 * apart. That is what makes the fold read as a single object rather than a
 * headline with a picture next to it.
 *
 * The card in the middle is a slot, not an image: the travelling portrait
 * (ui/Portrait.tsx) flies through here on its way down the page. On desktop
 * the slot only reserves space; below lg it renders the photo itself.
 *
 * The two halves are decorative spans and the real <h1> is a single
 * screen-reader string - a portrait is flow content and cannot legally sit
 * inside a heading, and repeating the words visually would be worse.
 */

const LEFT = "Full-Stack";
const RIGHT = "Developer";

/**
 * Shared shell for both halves of the wordmark. `.mask` clips; the span inside
 * is what actually moves and what carries the gradient. Sizing lives here
 * rather than in `text-d1` because each half has to fit a side column roughly
 * a third of the viewport wide, not the viewport itself.
 */
const WORD =
  "mask block overflow-hidden whitespace-nowrap caps text-[clamp(2.4rem,11vw,4.5rem)] " +
  "leading-[0.95] lg:text-[clamp(2.4rem,5.1vw,6.4rem)]";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const type = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => onReady(() => setLit(true)), []);

  useEffect(() => {
    if (!lit || !root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // The fold drifts up and dims as it leaves, so the manifesto arrives on
      // a clean page rather than sliding over a busy one.
      gsap.to(type.current, {
        yPercent: -14,
        opacity: 0.12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [lit]);

  return (
    <section
      ref={root}
      id="top"
      className={`relative flex min-h-[100svh] flex-col pt-[calc(var(--nav-h)+1.5rem)] ${
        lit ? "is-in" : ""
      }`}
      // The card width is shared by the wordmark grid and the footing grid
      // below it. Declaring it once is what keeps the two aligned when either
      // is tweaked.
      //
      // It is clamped against viewport *height* as well as width. The card is
      // the tallest thing in the fold, so on a wide-but-short window (a laptop
      // at 1789x844, say) a purely width-based size pushed the footing off the
      // bottom edge and cut the positioning sentence in half. Tying it to svh
      // too means the fold shrinks to fit instead of overflowing.
      style={
        { "--card": "clamp(13rem, min(21vw, 38svh), 23rem)" } as React.CSSProperties
      }
    >
      <div ref={type} className="shell flex flex-1 flex-col justify-center gap-y-8 py-6">
        <div className="mask w-fit">
          <span className="micro block text-muted">{profile.name}</span>
        </div>

        <h1 className="sr-only">
          {profile.name} - {profile.role}. {profile.intro}
        </h1>

        {/* ---- the split wordmark ----
            Three columns at lg: word, portrait, word. Below that it collapses
            to a stack with the photo under the type, because two ten-character
            words either side of a card cannot survive a phone. */}
        <div
          aria-hidden="true"
          className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-10"
        >
          {/* Each half is a clipping shell wrapping one moving span.
              The gradient has to live on the element that transforms:
              `background-clip: text` is broken by a transformed *descendant*,
              because the descendant composites on its own layer and leaves the
              parent's clipped background behind. Word-level reveal it is —
              which also suits a wordmark better than a character stagger. */}
          <span className={`${WORD} lg:col-start-1 lg:row-start-1 lg:text-right`}>
            <span
              className="mark mark-l display display-trim block"
              style={{ transitionDelay: "0.28s" }}
            >
              {LEFT}
            </span>
          </span>

          <div className="order-last mx-auto w-[min(78vw,21rem)] lg:order-none lg:col-start-2 lg:row-start-1 lg:mx-0 lg:w-[var(--card)]">
            <PortraitSlot id="hero" />
          </div>

          <span className={`${WORD} lg:col-start-3 lg:row-start-1`}>
            <span
              className="mark mark-r display display-trim block"
              style={{ transitionDelay: "0.4s" }}
            >
              {RIGHT}
            </span>
          </span>
        </div>

        {/* ---- footing ----
            This used to hang off the bottom-right corner, tucked under the
            right-hand word in a three-column grid that mirrored the wordmark.
            On any viewport shorter than about 900px it fell below the fold and
            got cut mid-sentence, which is the worst possible place to lose a
            positioning statement.

            It now sits inside the same centred stack as the wordmark, split
            across the full width: the sentence on the left, the actions on the
            right. The fold has one vertical rhythm instead of a headline and a
            loose block trailing after it, and nothing depends on there being
            spare height underneath. */}
        {/* The footing repeats the wordmark's own three columns, so the two
            rows lock together instead of being a headline with a loose block
            underneath:

              [ FULL-STACK ]  [ photo ]  [ DEVELOPER ]
              [    actions ]  [       ]  [ sentence  ]

            The sentence starts on exactly the same x as DEVELOPER and the
            actions end on the same x as FULL-STACK, so both inner edges run
            to the photo. Spanning it full-width across the bottom instead —
            which is where it was — left it floating in the corner with nothing
            to align to.

            DOM order is sentence-then-actions because that is the reading
            order; the columns are placed explicitly, so the visual arrangement
            does not depend on it. */}
        <div className="grid grid-cols-1 items-start gap-y-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-10">
          <p
            className="rise max-w-[34rem] text-lead text-muted lg:col-start-3 lg:row-start-1"
            style={{ transitionDelay: "0.78s" }}
          >
            {profile.intro}
          </p>

          {/* Holds the centre column open to the card's width. */}
          <div
            aria-hidden="true"
            className="hidden lg:col-start-2 lg:row-start-1 lg:block lg:w-[var(--card)]"
          />

          <div
            className="rise flex flex-wrap items-center gap-3.5 lg:col-start-1 lg:row-start-1 lg:justify-end"
            style={{ transitionDelay: "0.86s" }}
          >
            <Availability />
            <Magnetic as="a" href="#work">
              See the work
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 11L11 3M11 3H5M11 3V9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </Magnetic>
          </div>
        </div>
      </div>

      <div className="shell flex items-end justify-between gap-6 pb-4">
        <span className="rise micro text-faint" style={{ transitionDelay: "0.94s" }}>
          {profile.locationShort} &mdash; {profile.timezone}
        </span>
        <ScrollCue />
      </div>

      <CapabilityTicker items={capabilities.map((c) => c.title)} />
    </section>
  );
}

/** A label beside a hairline that drains downward. Quieter than an arrow. */
function ScrollCue() {
  const { scrollTo } = useSmooth();
  return (
    <button
      onClick={() => scrollTo("#manifesto")}
      className="hidden items-center gap-3 lg:flex"
      aria-label="Scroll to the next section"
    >
      <span className="micro text-faint">Scroll</span>
      <span className="relative block h-8 w-px overflow-hidden bg-line">
        <span className="absolute inset-x-0 top-0 h-1/2 animate-[drain_2.4s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-ink" />
      </span>
    </button>
  );
}

/**
 * Capability ticker. Duplicated once and translated by exactly -50%, so the
 * loop is seamless at any width without measuring anything.
 */
function CapabilityTicker({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !track.current) return;
    const tween = gsap.to(track.current, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="marquee-mask shrink-0 overflow-hidden border-y border-line py-4">
      <div ref={track} className="marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {items.map((label) => (
              <span key={label} className="flex items-center">
                <span className="micro whitespace-nowrap px-7 text-faint">{label}</span>
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
