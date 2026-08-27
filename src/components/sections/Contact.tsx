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

/** Minimal monoline glyphs, 24×24, one weight — so the two CTAs and the
 *  directory rows all read as the same icon family instead of borrowing
 *  whatever weight a brand mark happens to ship in. */
function MailGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2.7C8.65 2.7 2.7 8.65 2.7 16c0 2.56.72 4.95 1.96 6.98L2.7 29.3l6.5-1.9A13.24 13.24 0 0 0 16 29.3c7.35 0 13.3-5.95 13.3-13.3S23.35 2.7 16 2.7Z"
        fill="currentColor"
      />
      <path
        d="M11.9 10.15c-.32-.7-.58-.7-.88-.72h-.63c-.28 0-.72.1-1.1.5-.37.4-1.42 1.4-1.42 3.4s1.45 3.94 1.65 4.2c.2.28 2.82 4.5 6.95 6.15 3.44 1.35 4.15 1.08 4.9 1.02.74-.07 2.4-.98 2.75-1.93.33-.95.33-1.77.23-1.94-.1-.16-.36-.26-.76-.46s-2.4-1.18-2.78-1.32c-.37-.14-.65-.2-.92.2-.27.4-1.04 1.32-1.28 1.6-.24.27-.47.3-.87.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.35-2.22-2.75-.23-.4-.02-.6.17-.8.18-.18.4-.47.6-.7.2-.24.26-.4.4-.66.13-.27.06-.5-.03-.7-.1-.2-.86-2.17-1.22-2.97Z"
        fill="rgb(var(--page))"
      />
    </svg>
  );
}
function PinGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21.5s7-6.35 7-12A7 7 0 0 0 5 9.5c0 5.65 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ClockGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3.3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/** Each mark's real brand colour, used only on hover/focus so the row reads
 *  as one neutral set at rest and lights up with an identity the moment it's
 *  actually being considered. Instagram gets its true four-stop gradient
 *  instead of one flat pink, since a single colour is the one thing that
 *  never reads as Instagram. */
const SOCIAL_STYLE: Record<string, string> = {
  GitHub:
    "hover:border-[#181717] hover:bg-[#181717] hover:text-white hover:shadow-[0_12px_30px_-10px_rgba(24,23,23,0.55)] focus-visible:border-[#181717] focus-visible:bg-[#181717] focus-visible:text-white",
  LinkedIn:
    "hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:shadow-[0_12px_30px_-10px_rgba(10,102,194,0.5)] focus-visible:border-[#0A66C2] focus-visible:bg-[#0A66C2] focus-visible:text-white",
  // X's own mark flips black-on-white in light mode and white-on-black in
  // dark mode. The icon colour has to flip with it (dark: variants below) —
  // a fixed white icon on a fixed white dark-mode fill is exactly how it
  // used to vanish on hover.
  X: "hover:border-black hover:bg-black hover:text-white focus-visible:border-black focus-visible:bg-black focus-visible:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black dark:focus-visible:border-white dark:focus-visible:bg-white dark:focus-visible:text-black",
  Instagram:
    "hover:border-transparent hover:bg-[linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)] hover:text-white hover:shadow-[0_12px_30px_-10px_rgba(238,42,123,0.55)] focus-visible:border-transparent focus-visible:bg-[linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)] focus-visible:text-white",
  Facebook:
    "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:shadow-[0_12px_30px_-10px_rgba(24,119,242,0.5)] focus-visible:border-[#1877F2] focus-visible:bg-[#1877F2] focus-visible:text-white",
};

/** Simplified single-path marks — enough to be legible at 16px in a circle
 *  button; every social row shares this exact viewBox and stroke weight. */
const SOCIAL_ICON: Record<string, string> = {
  GitHub:
    "M12 .3a12 12 0 0 0-3.8 23.38c.6.1.82-.26.82-.58l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.83.57A12 12 0 0 0 12 .3Z",
  LinkedIn:
    "M6.94 8.5v11H3.56v-11h3.38ZM5.28 3.5a1.96 1.96 0 1 1 0 3.92 1.96 1.96 0 0 1 0-3.92ZM20.45 19.5h-3.38v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.7H9.66v-11h3.24v1.5h.05c.45-.86 1.56-1.77 3.2-1.77 3.43 0 4.3 2.26 4.3 5.2v6.07Z",
  X: "M13.5 10.6 20 3.5h-2.2l-5.6 6.1-4.5-6.1H3l6.8 9.25L3 20.5h2.2l5.9-6.42 4.75 6.42h4.65l-7.02-9.9Zm-2.09 2.27-.68-.93-5.44-7.4h2.16l4.39 5.97.68.93 5.7 7.76H16l-4.6-6.33Z",
  Instagram:
    "M12 3.6c2.9 0 3.24.01 4.39.06 1.06.05 1.79.22 2.2.38.5.2.85.42 1.23.79.37.38.6.72.79 1.22.16.42.33 1.15.38 2.2.05 1.16.06 1.5.06 4.4 0 2.9-.01 3.24-.06 4.39-.05 1.06-.22 1.79-.38 2.2-.2.5-.42.85-.79 1.23a3.3 3.3 0 0 1-1.22.79c-.42.16-1.15.33-2.2.38-1.16.05-1.5.06-4.4.06-2.9 0-3.24-.01-4.39-.06-1.06-.05-1.79-.22-2.2-.38a3.3 3.3 0 0 1-1.23-.79 3.3 3.3 0 0 1-.79-1.22c-.16-.42-.33-1.15-.38-2.2-.05-1.16-.06-1.5-.06-4.4 0-2.9.01-3.24.06-4.39.05-1.06.22-1.79.38-2.2.2-.5.42-.85.79-1.23.38-.37.72-.6 1.22-.79.42-.16 1.15-.33 2.2-.38 1.16-.05 1.5-.06 4.4-.06ZM12 1.7c-2.95 0-3.32.01-4.48.07-1.15.05-1.94.24-2.63.5-.71.28-1.32.65-1.92 1.25S2.1 4.7 1.82 5.4c-.26.7-.45 1.48-.5 2.64C1.26 9.2 1.25 9.57 1.25 12.5s.01 3.3.07 4.46c.05 1.16.24 1.94.5 2.64.28.71.65 1.32 1.25 1.92s1.2.97 1.92 1.25c.7.26 1.48.45 2.63.5 1.16.06 1.53.07 4.48.07s3.32-.01 4.48-.07c1.15-.05 1.94-.24 2.63-.5a5.06 5.06 0 0 0 1.92-1.25c.6-.6.97-1.21 1.25-1.92.26-.7.45-1.48.5-2.64.06-1.16.07-1.53.07-4.46s-.01-3.3-.07-4.46c-.05-1.16-.24-1.94-.5-2.64a5.06 5.06 0 0 0-1.25-1.92 5.06 5.06 0 0 0-1.92-1.25c-.7-.26-1.48-.45-2.63-.5C15.32 1.71 14.95 1.7 12 1.7Zm0 5.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2Zm0 8.41a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6Zm5.3-9.8a1.19 1.19 0 1 0 0 2.38 1.19 1.19 0 0 0 0-2.38Z",
  Facebook:
    "M13.1 20.5v-7h2.35l.35-2.72h-2.7v-1.74c0-.79.22-1.32 1.35-1.32h1.44V4.98a19.5 19.5 0 0 0-2.1-.11c-2.08 0-3.5 1.27-3.5 3.6v2.31H7.9v2.72h2.4v7h2.8Z",
};

function SocialIcon({ label }: { label: string }) {
  const d = SOCIAL_ICON[label];
  if (!d) return <span className="micro">{label[0]}</span>;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

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
    <footer
      ref={root}
      id="contact"
      data-cv="contact"
      className="cv relative scroll-mt-24 pt-[clamp(5rem,11vw,9rem)]"
    >
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
              Send a short brief, you&apos;ll get scope, timeline and next steps back, usually
              within a day.
            </p>

            <div className="rise mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Magnetic as="a" href={`mailto:${profile.email}`} data-cursor="grow">
                <MailGlyph />
                {profile.email}
              </Magnetic>
              <Magnetic
                as="a"
                href={`https://wa.me/${profile.phoneHref.replace("+", "")}`}
                target="_blank"
                rel="noreferrer"
                data-cursor="grow"
                className="group/wa border-line text-muted hover:border-[#25D366] hover:text-[#25D366]"
              >
                {/* A quiet, always-on pulse behind the glyph, enough to read
                    as "live and reachable" without shouting over the CTA
                    beside it. It only brightens on hover/focus. */}
                <span className="relative flex h-4 w-4 items-center justify-center text-[#25D366]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366]/25 opacity-70 transition-opacity duration-400 group-hover/wa:opacity-100" />
                  <WhatsAppGlyph />
                </span>
                {profile.phone}
              </Magnetic>
            </div>
          </div>

          {/* Directory column */}
          <div className="col-span-12 lg:col-span-4 lg:col-start-9" data-reveal data-stagger="0.06">
            <dl className="glass-heavy overflow-hidden rounded-panel border border-line bg-raised/50 px-5 sm:px-6">
              <div className="rise flex flex-col gap-2 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <dt className="micro flex items-center gap-2 text-faint">
                  <PinGlyph />
                  Based in
                </dt>
                <dd className="text-[0.92rem] text-muted sm:text-right">{profile.location}</dd>
              </div>
              <div className="rise flex flex-col gap-2 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <dt className="micro flex items-center gap-2 text-faint">
                  <ClockGlyph />
                  Hours
                </dt>
                <dd className="text-[0.92rem] text-muted sm:text-right">{profile.timezone}</dd>
              </div>
              <div className="rise flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <dt className="micro flex items-center gap-2 text-faint">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
                  </span>
                  Status
                </dt>
                <dd>
                  <Availability className="border-0 px-0 py-0" />
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
              <span className="micro text-faint">Find me elsewhere</span>
              <span className="h-px w-10 bg-line lg:w-16" aria-hidden="true" />
            </div>

            <ul className="rise mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    data-cursor="none"
                    className={`grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-all duration-400 ease-out hover:-translate-y-1 hover:scale-110 focus-visible:-translate-y-1 focus-visible:scale-110 ${
                      SOCIAL_STYLE[s.label] ?? "hover:border-accent hover:bg-accent hover:text-page focus-visible:border-accent focus-visible:bg-accent focus-visible:text-page"
                    }`}
                  >
                    <SocialIcon label={s.label} />
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
      <div
        className="mt-[clamp(4rem,10vw,8rem)] overflow-hidden px-gut"
        aria-hidden="true"
        /* The ember band inside the signature is a main-thread repaint per
           frame (see `.wordmark` in globals.css); `data-reveal` is what
           holds it switched off until the footer is genuinely on screen. */
        data-reveal
        data-start="top 98%"
      >
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

      <div className="shell flex flex-col items-center gap-3 border-t border-line py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
