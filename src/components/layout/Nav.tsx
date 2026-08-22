"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { sections, profile } from "@/content/site";
import { gsap } from "@/lib/motion";
import { useTheme } from "@/lib/theme";
import { useSmooth } from "@/lib/smooth";
import { cn } from "@/lib/cn";

/**
 * NAV
 *
 * Hides on scroll-down and returns on scroll-up, so the fold is never fighting
 * a bar for attention but the navigation is always one gesture away. It grows
 * a hairline and a blur once it leaves the top of the page.
 *
 * The mobile sheet is a full-screen panel with staggered line reveals rather
 * than a dropdown — at that size the menu is the page, so it should look like it.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  const { theme, toggle } = useTheme();
  const { scrollTo } = useSmooth();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setLifted(y > 24);
      setHidden(y > 320 && y > last.current);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page while the sheet is up, and let Escape close it.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // Let the sheet finish closing before the scroll starts, or the two
    // animations land on top of each other.
    setTimeout(() => scrollTo(`#${id}`, { offset: -8 }), open ? 220 : 0);
  };

  return (
    <>
      {/* A floating pill rather than a full-width bar: it keeps the fold's
          full height for the wordmark, and reads as an object on the page
          instead of browser chrome. */}
      <header
        className={cn(
          "fixed inset-x-0 top-4 z-50 flex justify-center px-gut transition-all duration-600 ease-out",
          hidden && !open ? "-translate-y-[150%] opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "glass flex items-center gap-2 rounded-full border p-1.5 transition-colors duration-500 ease-out",
            lifted
              ? "border-line bg-raised/72 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.45)]"
              : "border-line/60 bg-raised/40"
          )}
        >
          {/* Avatar chip doubles as back-to-top. */}
          <button
            onClick={() => scrollTo(0)}
            aria-label="Back to top"
            className="group flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3"
          >
            <span className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-inset ring-ink/15">
              <Image
                src="/img/avatar.jpg"
                alt=""
                fill
                sizes="32px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </span>
            <span className="display text-[0.95rem] leading-none">Dawood</span>
          </button>

          <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden="true" />

          <NavLinks onGo={go} />

          {/* The one filled control in the bar, so it stays the obvious action.
              Hover swaps ink for ember rather than fading the opacity — a
              dimming button reads as disabling, which is the opposite of what
              the primary call to action should signal. */}
          <a
            href={`mailto:${profile.email}`}
            className="ml-1 hidden rounded-full bg-ink px-4 py-2.5 text-[0.85rem] text-page transition-colors duration-400 ease-out hover:bg-accent hover:text-on-accent focus-visible:bg-accent focus-visible:text-on-accent sm:block"
          >
            Contact
          </a>

          <ThemeToggle theme={theme} onToggle={toggle} />

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-sheet"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          >
            <span className="relative flex h-4 w-5 flex-col justify-between">
              <span
                className={cn(
                  "block h-[1.5px] w-full origin-center rounded-full bg-ink transition-transform duration-300 ease-out",
                  open && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-[1.5px] w-full rounded-full bg-ink transition-opacity duration-200 ease-out",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "block h-[1.5px] w-full origin-center rounded-full bg-ink transition-transform duration-300 ease-out",
                  open && "-translate-y-[7px] -rotate-45"
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile sheet */}
      <div
        id="menu-sheet"
        className={cn(
          "fixed inset-0 z-40 bg-page transition-[clip-path] duration-700 ease-out md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{ clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col justify-between px-gut pb-10 pt-[calc(var(--nav-h)+3rem)]">
          <ul>
            {sections.map((s, i) => (
              <li key={s.id} className="overflow-hidden border-b border-line">
                <button
                  onClick={() => go(s.id)}
                  tabIndex={open ? 0 : -1}
                  className="flex w-full items-baseline gap-4 py-5 text-left transition-transform duration-700 ease-out"
                  style={{
                    transform: open ? "translateY(0)" : "translateY(110%)",
                    transitionDelay: `${(open ? i * 0.055 + 0.1 : 0).toFixed(3)}s`,
                  }}
                >
                  <span className="micro nums text-faint">{s.n}</span>
                  <span className="display text-[2.6rem] leading-[1.05]">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <a href={`mailto:${profile.email}`} className="uline w-fit text-muted">
              {profile.email}
            </a>
            <span className="micro text-faint">{profile.locationShort}</span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * NAV LINKS
 *
 * One highlight pill that travels between the items rather than a background
 * appearing under each on hover. Two reasons it is worth the extra state:
 *
 * · Moving between adjacent items reads as a single object sliding across,
 *   which is the segmented-control behaviour the pill shape already implies.
 *   Independent per-item backgrounds blink on and off instead.
 * · The pill measures the real button box every time it moves, so it stays
 *   correct when the labels reflow or the font finishes loading.
 *
 * The pill is aria-hidden decoration; the buttons underneath carry all the
 * semantics, and keyboard focus drives the highlight through onFocus so the
 * effect is not mouse-only.
 */
function NavLinks({ onGo }: { onGo: (id: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const items = sections.filter((sec) => sec.id !== "contact");

  const moveTo = (el: HTMLElement | null) => {
    const box = wrap.current;
    const p = pill.current;
    if (!box || !p) return;
    if (!el) {
      gsap.to(p, { opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.out" });
      return;
    }
    const a = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    gsap.to(p, {
      x: a.left - b.left,
      width: a.width,
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: "expo.out",
      overwrite: true,
    });
  };

  return (
    <div
      ref={wrap}
      className="relative hidden items-center md:flex"
      onPointerLeave={() => moveTo(null)}
    >
      <span
        ref={pill}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-accent/[0.14] opacity-0 ring-1 ring-inset ring-accent/25"
      />
      {items.map((sec) => (
        <button
          key={sec.id}
          onClick={() => onGo(sec.id)}
          onPointerEnter={(e) => moveTo(e.currentTarget)}
          onFocus={(e) => moveTo(e.currentTarget)}
          onBlur={() => moveTo(null)}
          className="relative rounded-full px-3.5 py-2 text-[0.875rem] text-muted transition-colors duration-300 hover:text-accent-ink focus-visible:text-accent-ink"
        >
          {sec.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Theme toggle. Passes the button's own centre to the provider so the View
 * Transition wipe originates exactly where the user clicked.
 */
function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: string;
  onToggle: (o?: { x: number; y: number }) => void;
}) {
  return (
    <button
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onToggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={`Switch to ${theme === "ink" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "ink" ? "light" : "dark"} mode`}
      className={cn(
        "group relative ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        // Same ember highlight the nav links get, so every interactive thing
        // in the bar answers to the pointer in one language.
        "text-muted ring-1 ring-inset ring-transparent transition-colors duration-400 ease-out",
        "hover:bg-accent/[0.14] hover:text-accent-ink hover:ring-accent/25",
        "focus-visible:bg-accent/[0.14] focus-visible:text-accent-ink focus-visible:ring-accent/25"
      )}
    >
      {/* Two glyphs on one axis: the outgoing one rotates out as the incoming
          one rotates in, so the control reads as a single object turning over
          rather than two icons swapping places. */}
      <span className="relative block h-4 w-4" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            "absolute inset-0 transition-all duration-600 ease-out",
            theme === "ink" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          )}
        >
          {/* Moon — shown while the dark theme is active. */}
          <path
            d="M13.2 9.6A5.8 5.8 0 0 1 6.4 2.8a5.8 5.8 0 1 0 6.8 6.8Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            "absolute inset-0 transition-all duration-600 ease-out",
            theme === "paper" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          )}
        >
          {/* Sun */}
          <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M8 .9v2M8 13.1v2M.9 8h2M13.1 8h2M3 3l1.4 1.4M11.6 11.6 13 13M13 3l-1.4 1.4M4.4 11.6 3 13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}
