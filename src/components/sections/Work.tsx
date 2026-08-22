"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { projects, type Project } from "@/content/site";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { SectionHead } from "@/components/ui/Type";
import { cn } from "@/lib/cn";

/**
 * WORK
 *
 * A stacked deck. Each project is a full-width plate that sticks to the top of
 * the viewport while the next one rises from below and settles over it,
 * leaving a sliver of the card underneath showing at the upper edge.
 *
 * Why this and not a horizontal track: horizontal scroll hijacks the one
 * gesture the visitor already understands, and it collapses to a plain list on
 * touch anyway. Stacking keeps the vertical gesture, gives each project the
 * full width of the page, and produces the depth cue for free — the deck
 * physically shows how many are left.
 *
 * The plate underneath scales down and dims as the next one covers it. That
 * recession is what sells the stack as physical rather than as overlapping
 * divs, and it costs one scrubbed tween per card.
 */
export function Work() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

      cards.forEach((card, i) => {
        // Which plate is on top right now, for the counter.
        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 40%",
            end: "bottom 40%",
            onEnter: () => setActive(i),
            onEnterBack: () => setActive(i),
          },
        });

        // Recede as the next plate covers this one. The last card has nothing
        // coming over it, so it never recedes.
        const inner = card.querySelector<HTMLElement>("[data-plate]");
        const scrim = card.querySelector<HTMLElement>("[data-recede-scrim]");
        if (!inner || prefersReducedMotion() || i === cards.length - 1) return;
        const recede = gsap.timeline({
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: 0.5,
          },
        });
        recede.fromTo(inner, { scale: 1 }, { scale: 0.94, ease: "none" }, 0);
        if (scrim) recede.fromTo(scrim, { opacity: 0 }, { opacity: 0.3, ease: "none" }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="work" className="scroll-mt-24 py-[clamp(4rem,9vw,8rem)]">
      <div className="shell">
        <div data-reveal>
          <SectionHead n="02" label="Selected Work" className="mask" />
        </div>

        <div className="mt-8 grid grid-cols-12 gap-y-6" data-reveal data-stagger="0.08">
          <h2 className="col-span-12 lg:col-span-7">
            <span className="mask display display-trim text-d2">
              <span className="grad">
                Seven builds,
                <br />
                moved onto software.
              </span>
            </span>
          </h2>
          <p className="rise col-span-12 self-end text-lead text-muted lg:col-span-4 lg:col-start-9">
            Each one came off paper, off spreadsheets, or off manual trust, and onto
            something that scales.
          </p>
        </div>

        {/* Deck counter */}
        <div className="mt-10 flex items-center gap-5">
          <span className="micro nums text-ink">{String(active + 1).padStart(2, "0")}</span>
          <div className="flex h-px flex-1 gap-1.5" aria-hidden="true">
            {projects.map((p, i) => (
              <span
                key={p.n}
                className={cn(
                  "h-px flex-1 transition-colors duration-600 ease-out",
                  i <= active ? "bg-accent" : "bg-line"
                )}
              />
            ))}
          </div>
          <span className="micro nums text-faint">
            {String(projects.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div ref={root} className="shell mt-8">
        {projects.map((p, i) => (
          <Plate key={p.n} project={p} i={i} total={projects.length} />
        ))}
      </div>
    </section>
  );
}

function Plate({ project: p, i, total }: { project: Project; i: number; total: number }) {
  const [hot, setHot] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const flip = i % 2 === 1;

  // Only run a diagram's frame loop while its plate is near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), {
      rootMargin: "25% 0px 25% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-card
      className="sticky"
      style={{
        // Each plate parks slightly lower than the one before, so the stack
        // leaves a visible edge rather than hiding the cards underneath.
        top: `calc(var(--nav-h) + 1.25rem + ${i * 1.15}rem)`,
        // The trailing gap is the runway the next plate travels up through.
        marginBottom: i === total - 1 ? 0 : "5rem",
        zIndex: i + 1,
      }}
    >
      <article
        data-plate
        data-reveal
        data-start="top 90%"
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        className={cn(
          "group relative overflow-hidden rounded-panel border border-line",
          // Deeper frost than the rest of the site, and a thinner fill to let
          // it show: a heavy blur behind an opaque panel is work the GPU does
          // that nobody sees.
          "glass-heavy bg-raised/60 p-6 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.6)]",
          "transition-colors duration-700 ease-out hover:border-accent/40 md:p-9 lg:p-11"
        )}
        style={{ transformOrigin: "50% 0%" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(90% 70% at 70% 0%, rgb(var(--accent) / 0.10), transparent 65%)",
          }}
        />
        {/* Darkens as the next plate covers this one — an opacity fade, not a
            filter. Animating `filter` forces the browser to repaint this
            (already-blurred) panel on the main thread every scroll frame;
            layering a plain black scrim underneath keeps the same "receding
            into shadow" read while staying on the compositor. */}
        <span
          data-recede-scrim
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-black opacity-0"
        />

        <div className="relative flex items-center justify-between gap-6 border-b border-line pb-5">
          <span className="micro nums text-accent-ink">
            {p.n} — {p.role}
          </span>
          <span className="micro nums text-faint">{p.year}</span>
        </div>

        <div
          className={cn(
            "relative mt-7 grid grid-cols-12 items-center gap-y-8 lg:gap-x-10",
            flip && "lg:[direction:rtl] lg:[&>*]:[direction:ltr]"
          )}
        >
          <div className="col-span-12 lg:col-span-6">
            <div className="relative aspect-[5/4] overflow-hidden rounded-card border border-line lg:aspect-[4/3]">
              <ProjectVisual
                variant={p.visual}
                active={seen}
                boost={hot ? 2.4 : 1}
                className="absolute inset-0 h-full w-full"
              />
              <span className="micro absolute left-4 top-4 text-faint">{p.tag}</span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <h3 className="display display-trim text-[clamp(1.9rem,3.8vw,3.2rem)] leading-[0.92]">
              {p.name}
            </h3>

            <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-relaxed text-muted">
              {p.description}
            </p>

            {/* Three across needs ~80px a column on a phone, which wraps
                "Secure fintech app" onto three lines. It stacks below sm. */}
            <dl className="mt-7 grid grid-cols-1 gap-x-4 gap-y-3 rounded-tile border border-line px-5 py-4 sm:grid-cols-3">
              {p.facts.map((f) => (
                <div key={f.k}>
                  <dt className="micro text-faint">{f.k}</dt>
                  <dd className="mt-2 text-[0.9rem] text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>

            <a
              href={p.href}
              target="_blank"
              rel="noreferrer"
              data-cursor="grow"
              className="group/link mt-7 inline-flex items-center gap-3"
            >
              <span className="uline text-[0.95rem]">Visit {p.domain}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line transition-all duration-600 ease-out group-hover/link:border-accent group-hover/link:bg-accent group-hover/link:text-page">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3 11L11 3M11 3H5M11 3V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
