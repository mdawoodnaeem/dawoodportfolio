"use client";

import { useState } from "react";
import { faqs, profile } from "@/content/site";
import { SectionHead } from "@/components/ui/Type";
import { cn } from "@/lib/cn";

/**
 * QUESTIONS
 *
 * A disclosure list. Multiple rows can be open at once here (unlike the
 * capabilities index) because these are reference answers people scan and
 * compare, not a showcase with one focal point.
 */
export function Questions() {
  const [open, setOpen] = useState<number[]>([0]);
  const toggle = (i: number) =>
    setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <section id="questions" className="shell scroll-mt-24 py-[clamp(6rem,13vw,11rem)]">
      <div className="grid grid-cols-12 gap-y-12 lg:gap-x-10">
        {/* Sticky heading column keeps the section title in view while the
            answers scroll — the list is long enough for that to matter. */}
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
            <div data-reveal>
              <SectionHead n="05" label="Questions" className="mask" />
            </div>
            <h2 className="mt-8" data-reveal data-stagger="0.07">
              <span className="mask display display-trim text-d3">
                <span className="grad">
                  Before you
                  <br />
                  write in.
                </span>
              </span>
            </h2>
            <p className="rise mt-6 max-w-sm text-[0.95rem] leading-relaxed text-muted" data-reveal>
              Anything not covered here, ask directly —{" "}
              <a href={`mailto:${profile.email}`} className="uline text-ink">
                {profile.email}
              </a>
              .
            </p>
          </div>
        </div>

        {/* Answers */}
        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
          <ul className="border-t border-line">
            {faqs.map((f, i) => {
              const isOpen = open.includes(i);
              return (
                <li key={f.q} className="border-b border-line">
                  <h3>
                    <button
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      className="group flex w-full items-start gap-5 py-6 text-left"
                    >
                      <span
                        className={cn(
                          "micro nums mt-1.5 shrink-0 transition-colors duration-500",
                          isOpen ? "text-accent-ink" : "text-faint"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-[1.05rem] leading-snug text-ink md:text-[1.2rem]">
                        {f.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative mt-1 grid h-6 w-6 shrink-0 place-items-center transition-colors duration-500",
                          isOpen ? "text-accent" : "text-faint group-hover:text-ink"
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
                  </h3>

                  <div
                    id={`faq-${i}`}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-600 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[42rem] pb-7 pl-10 text-[0.98rem] leading-relaxed text-muted">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
