"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { manifesto } from "@/content/site";
import { SectionHead } from "@/components/ui/Type";
import { PortraitSlot } from "@/components/ui/Portrait";

/**
 * MANIFESTO
 *
 * The breath between the fold and the work, and the middle stop on the
 * travelling portrait's route. The card arrives here showing its reverse face
 * — a monitor running code — at exactly the point the page says "I build
 * things that are used". That pairing is the reason this section, and not
 * another, holds the second slot.
 *
 * The second statement line is scrubbed against scroll: an ember front travels
 * across it as the section crosses the reading position. It is the one place
 * on the site where colour itself is the animation, which is why it appears
 * exactly once.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const words = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Sweep the gradient rather than fading each word.
      //
      // This was a per-word opacity scrub. Once the line became gradient-filled
      // that stopped working: an animated opacity on a descendant gives it its
      // own compositing layer, which drops the parent's `background-clip: text`
      // and renders the whole line invisible. Moving the animation onto the
      // parent's own background-position keeps one paint layer and one
      // element, and reads as the words catching light in sequence.
      gsap.fromTo(
        words.current,
        { backgroundPosition: "100% 50%" },
        {
          backgroundPosition: "0% 50%",
          ease: "none",
          scrollTrigger: {
            trigger: words.current,
            start: "top 82%",
            end: "bottom 55%",
            scrub: 0.8,
          },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="manifesto" className="shell scroll-mt-24 py-[clamp(6rem,14vw,12rem)]">
      <div data-reveal>
        <SectionHead n="00" label="Position" className="mask" />
      </div>

      {/* Statement.
          One block, two lines — not two <p> elements. As separate paragraphs
          the display trim on each pulled them into one another, and with
          sentence case (which has real descenders, unlike caps) they
          overlapped outright. */}
      <div className="mt-12 display display-trim text-d2" data-reveal data-stagger="0.09">
        <span className="mask block">
          <span className="grad">{manifesto.statement[0]}</span>
        </span>
        <p ref={words} className="grad-scrub block lg:pl-[7vw]">
          {manifesto.statement[1]}
        </p>
      </div>

      {/* The travelling portrait's middle stop, with the argument beside it. */}
      <div className="mt-[clamp(3rem,7vw,6rem)] grid grid-cols-12 items-center gap-x-10 gap-y-12">
        <div className="col-span-12 sm:col-span-8 sm:col-start-3 lg:col-span-4 lg:col-start-1">
          <PortraitSlot id="manifesto" />
        </div>

        <div
          className="col-span-12 lg:col-span-6 lg:col-start-7"
          data-reveal
          data-stagger="0.09"
        >
          <div className="max-w-[36rem] space-y-5">
            {manifesto.body.map((para, i) => (
              <p
                key={i}
                className={`rise ${i === 0 ? "text-lead text-ink" : "text-[1rem] leading-relaxed text-muted"}`}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Principles */}
      <ul className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line md:grid-cols-3">
        {manifesto.principles.map((p, i) => (
          <li
            key={p.n}
            data-reveal
            data-start="top 90%"
            className="relative px-6 py-9 md:px-8"
          >
            {/* Drawn as a pseudo-border so the first and last cells still bleed
                to the gutter and the rhythm stays even. */}
            {i > 0 && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden w-px bg-line md:block"
              />
            )}
            <div className="rise">
              <div className="flex items-baseline gap-4">
                <span className="micro nums text-accent-ink">{p.n}</span>
                <h3 className="text-d4 font-semibold">{p.title}</h3>
              </div>
              <p className="mt-4 max-w-[32rem] text-[0.95rem] leading-relaxed text-muted">
                {p.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
