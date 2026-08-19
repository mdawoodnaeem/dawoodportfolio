"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { profile } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { SectionHead, Availability } from "@/components/ui/Type";

/**
 * CONTACT
 *
 * The close. One instruction, two ways to act on it, and no form — a contact
 * form on a solo portfolio is a queue between a client and the person they
 * are trying to hire.
 *
 * The name across the footer is a kinetic wordmark: it drifts against scroll
 * direction, so the page has a last piece of movement on the way out.
 */
export function Contact() {
  const root = useRef<HTMLElement>(null);
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Drift is deliberately small now. The old ±6% was tuned for a watermark
      // that was meant to bleed off both edges; the name has to stay whole.
      gsap.fromTo(
        mark.current,
        { xPercent: -1.6 },
        {
          xPercent: 1.6,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer ref={root} id="contact" className="relative scroll-mt-24 pt-[clamp(5rem,11vw,9rem)]">
      <div className="shell">
        <div data-reveal>
          <SectionHead n="06" label="Contact" className="mask" />
        </div>

        <div className="mt-10 grid grid-cols-12 gap-y-12">
          <div className="col-span-12 lg:col-span-7" data-reveal data-stagger="0.08">
            <h2 className="display display-trim text-d2">
              <span className="mask">
                <span className="grad">Have something</span>
              </span>
              <span className="mask">
                <span className="grad">worth building?</span>
              </span>
            </h2>

            <p className="rise mt-8 max-w-[34rem] text-lead text-muted">
              Open to focused engagements across full-stack, mobile, agentic AI and 3D web.
              Send a short brief — you&apos;ll get scope, timeline and next steps back, usually
              within a day.
            </p>

            <div className="rise mt-10 flex flex-wrap items-center gap-4">
              <Magnetic as="a" href={`mailto:${profile.email}`} data-cursor="grow">
                {profile.email}
              </Magnetic>
              <a
                href={`https://wa.me/${profile.phoneHref.replace("+", "")}`}
                target="_blank"
                rel="noreferrer"
                className="uline text-[0.95rem] text-muted"
              >
                {profile.phone} · WhatsApp
              </a>
            </div>
          </div>

          {/* Directory column */}
          <div className="col-span-12 lg:col-span-4 lg:col-start-9" data-reveal data-stagger="0.06">
            <dl className="overflow-hidden rounded-card border border-line px-5">
              <div className="rise flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="micro text-faint">Based in</dt>
                <dd className="text-right text-[0.92rem] text-muted">{profile.location}</dd>
              </div>
              <div className="rise flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="micro text-faint">Hours</dt>
                <dd className="text-right text-[0.92rem] text-muted">{profile.timezone}</dd>
              </div>
              <div className="rise flex items-baseline justify-between gap-6 py-4">
                <dt className="micro text-faint">Status</dt>
                <dd className="text-right">
                  <Availability className="border-0 px-0 py-0" />
                </dd>
              </div>
            </dl>

            <ul className="rise mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="uline micro text-muted transition-colors duration-400 hover:text-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* The signature.
          This used to be a 9%-opacity watermark reading "Dawood", which made
          the last thing on the page the faintest thing on it. It is now the
          full name at full strength, with an ember band sweeping through it.

          Two lines, not one: twenty-one characters on a single line either
          bleed off both edges or shrink to the size of a subhead. Broken after
          the given name, both lines land near the same width. */}
      <div className="mt-[clamp(4rem,10vw,8rem)] overflow-hidden px-gut" aria-hidden="true">
        <span
          ref={mark}
          className="wordmark display block text-center leading-[0.84] tracking-[-0.04em]"
          style={{ fontSize: "clamp(2.4rem, 10.5vw, 10.5rem)" }}
        >
          Muhammad
          <br />
          Dawood Naeem
        </span>
      </div>

      <div className="shell flex flex-col gap-3 border-t border-line py-7 sm:flex-row sm:items-center sm:justify-between">
        <span className="micro text-faint">
          © {year} {profile.name}
        </span>
        <span className="micro text-faint">
          Designed &amp; built in {profile.locationShort}
        </span>
      </div>
    </footer>
  );
}
