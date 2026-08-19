"use client";

import { useRef } from "react";
import { profile } from "@/content/site";
import { SectionHead, Availability } from "@/components/ui/Type";
import { PortraitSlot } from "@/components/ui/Portrait";

/**
 * ABOUT
 *
 * The portrait's final appearance, and the one that gets to be big.
 *
 * This is also the travelling portrait's final stop: the card that started
 * between the two halves of the hero wordmark lands here, back on its photo
 * face, after turning through the manifesto.
 */
export function About() {
  const frame = useRef<HTMLDivElement>(null);

  return (
    <section id="about" className="shell scroll-mt-24 py-[clamp(6rem,13vw,11rem)]">
      <div data-reveal>
        <SectionHead n="01" label="About" className="mask" />
      </div>

      <div className="mt-12 grid grid-cols-12 items-center gap-y-14 md:gap-x-10">
        {/* Portrait column */}
        <div className="col-span-12 md:order-2 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
          <div ref={frame}>
            <div data-reveal>
              <PortraitSlot id="about" />
            </div>

            {/* Only for the static, in-flow card below lg. On desktop the
                travelling card carries its own caption, and this one would
                sit underneath it. */}
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3 lg:hidden">
              <span className="micro text-faint">{profile.short}</span>
              <span className="micro text-faint">{profile.locationShort}</span>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className="col-span-12 md:order-1 md:col-span-7 md:col-start-1 md:row-start-1 lg:col-span-7 lg:col-start-1">
          <h2 data-reveal data-stagger="0.07">
            <span className="mask display display-trim text-d2">
              <span className="grad">
                Two years at the
                <br />
                intersection.
              </span>
            </span>
          </h2>

          <div className="mt-8 max-w-[42rem] space-y-6" data-reveal data-stagger="0.08">
            {profile.about.map((para, i) => (
              <p
                key={i}
                className={`rise ${i === 0 ? "text-lead text-ink" : "text-[1.02rem] leading-relaxed text-muted"}`}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Stack. Three plain columns of small type — the one place on the
              page where density is the right answer. */}
          <div
            className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line sm:grid-cols-3"
            data-reveal
            data-stagger="0.07"
          >
            {profile.stack.map((group, gi) => (
              <div key={group.label} className="rise relative px-6 py-7">
                {gi > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 hidden w-px bg-line sm:block"
                  />
                )}
                <p className="micro text-faint">{group.label}</p>
                <ul className="mt-4 space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[0.9rem] text-muted">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" data-reveal>
            <Availability className="rise" />
            <span className="rise micro text-faint">{profile.timezone}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
