"use client";

import { useState } from "react";
import { capabilities } from "@/content/site";
import { SectionHead } from "@/components/ui/Type";
import { cn } from "@/lib/cn";

/**
 * CAPABILITIES
 *
 * An index, not a card grid. Five rows, one open at a time — so the section
 * has a single focal point and the page height stays predictable while the
 * user reads across it.
 *
 * Opening is driven by pointer on desktop and by click/keyboard everywhere,
 * with real <button aria-expanded> semantics underneath, so the hover nicety
 * never becomes the only way in.
 */
export function Capabilities() {
  const [open, setOpen] = useState(0);

  return (
    <section
      id="capabilities"
      data-cv="capabilities"
      className="cv shell scroll-mt-24 py-[clamp(6rem,13vw,11rem)]"
    >
      <div data-reveal>
        <SectionHead n="03" label="Capabilities" className="mask" />
      </div>

      <div className="mt-8 grid grid-cols-12 gap-y-6" data-reveal data-stagger="0.08">
        <h2 className="col-span-12 lg:col-span-6">
          <span className="mask display display-trim text-d2">
            <span className="grad">
              What runs when
              <br />
              you hire me.
            </span>
          </span>
        </h2>
        <p className="rise col-span-12 self-end text-lead text-muted lg:col-span-4 lg:col-start-9">
          Five disciplines, one operator. No hand-offs, no translation layer between the
          people who design it and the people who ship it.
        </p>
      </div>

      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-line">
        {capabilities.map((c, i) => {
          const isOpen = open === i;
          return (
            <li
              key={c.id}
              className="border-b border-line"
              onPointerEnter={() => {
                // Pointer opens rows on real pointers only — on touch the tap
                // would fire this and the click, double-toggling the row.
                if (window.matchMedia("(hover: hover)").matches) setOpen(i);
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`cap-${c.id}`}
                className="group flex w-full items-center gap-5 py-7 text-left md:gap-8 md:py-9"
              >
                <span
                  className={cn(
                    "micro nums shrink-0 transition-colors duration-500 ease-out",
                    isOpen ? "text-accent-ink" : "text-faint"
                  )}
                >
                  {c.n}
                </span>

                <span
                  className={cn(
                    "display flex-1 text-[clamp(1.7rem,4.1vw,3.4rem)] leading-[1.02] tracking-[-0.03em]",
                    "transition-transform duration-700 ease-out",
                    isOpen ? "translate-x-1.5 md:translate-x-3" : "translate-x-0"
                  )}
                >
                  {c.title}
                </span>

                {/* Plus that rotates into a minus. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-500 ease-out",
                    isOpen ? "border-accent text-accent" : "border-line text-muted"
                  )}
                >
                  <span className="absolute h-px w-3 bg-current" />
                  <span
                    className={cn(
                      "absolute h-3 w-px bg-current transition-transform duration-600 ease-out",
                      isOpen ? "scale-y-0" : "scale-y-100"
                    )}
                  />
                </span>
              </button>

              {/* Grid-rows trick: animates to the content's real height with no
                  JS measurement, and stays correct when the text reflows. */}
              <div
                id={`cap-${c.id}`}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-700 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="grid grid-cols-12 gap-y-6 pb-10 md:pl-[3.6rem]">
                    <p className="col-span-12 max-w-[38rem] text-lead text-muted lg:col-span-6">
                      {c.summary}
                    </p>
                    <ul className="col-span-12 lg:col-span-5 lg:col-start-8">
                      {c.items.map((item, k) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 border-b border-line py-3 text-[0.9rem] text-muted last:border-b-0"
                          style={{
                            transitionDelay: `${k * 0.05}s`,
                          }}
                        >
                          <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
