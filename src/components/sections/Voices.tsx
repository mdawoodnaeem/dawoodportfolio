"use client";

import { testimonials } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * VOICES
 *
 * Three quotes, set at display size rather than shrunk into cards — a
 * testimonial that has to be squinted at is decoration. Alignment alternates
 * so the eye zig-zags down the section, and each quote is a real <blockquote>
 * with its attribution in <cite>.
 */
export function Voices() {
  return (
    <section className="shell py-[clamp(5rem,11vw,9rem)]">
      <ul className="border-t border-line">
        {testimonials.map((t, i) => (
          <li key={t.name} className="border-b border-line">
            <figure
              data-reveal
              data-start="top 85%"
              data-stagger="0.06"
              className={cn(
                "grid grid-cols-12 gap-y-6 py-[clamp(2.5rem,5vw,4.5rem)]",
                i % 2 === 1 && "lg:text-right"
              )}
            >
              <blockquote
                className={cn(
                  "col-span-12 lg:col-span-8",
                  i % 2 === 1 && "lg:col-start-5"
                )}
              >
                <span className="mask display display-trim block text-[clamp(1.5rem,3.1vw,2.6rem)] leading-[1.14] tracking-[-0.02em]">
                  <span>
                    <span className="text-faint" aria-hidden="true">
                      &ldquo;
                    </span>
                    {t.quote}
                    <span className="text-faint" aria-hidden="true">
                      &rdquo;
                    </span>
                  </span>
                </span>
              </blockquote>

              <figcaption
                className={cn(
                  "rise col-span-12 flex items-center gap-3 self-end lg:col-span-3",
                  i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-10"
                )}
              >
                <span className="h-px w-8 bg-accent" aria-hidden="true" />
                <span>
                  <cite className="block not-italic text-[0.95rem] text-ink">{t.name}</cite>
                  <span className="micro mt-1.5 block text-faint">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
