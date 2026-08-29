import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ThemeProvider, ThemeScript } from "@/lib/theme";
import { SmoothProvider } from "@/lib/smooth";
import { Nav } from "@/components/layout/Nav";
import { Cursor } from "@/components/layout/Cursor";
import { Preloader } from "@/components/layout/Preloader";
import { ScrollRail } from "@/components/layout/ScrollRail";
import { PortraitProvider, PortraitStage } from "@/components/ui/Portrait";
import { BackdropMount } from "@/components/three/BackdropMount";
import { profile } from "@/content/site";

/**
 * TYPE SYSTEM — two families.
 *
 * BRICOLAGE GROTESQUE (display) is the voice of the site. It is a variable
 * face with three axes — weight, width and optical size — and at 800 weight
 * its letterforms have real character: flat-cut terminals, a tall x-height,
 * and an `opsz` axis that automatically tightens the drawing as the size goes
 * up. That last part is why it holds together from an 8rem wordmark down to a
 * 1.2rem subhead without ever being reset by hand.
 *
 * It is deliberately *not* set in caps. A condensed all-caps display face
 * shouts at every size and flattens the hierarchy; sentence case lets the
 * scale do the work and reads as typeset rather than as a poster.
 *
 * ARCHIVO (text/UI) carries its own weight and width axes, so the same family
 * covers body copy, subheads and the condensed micro labels. It shares
 * Bricolage's grotesk skeleton, so the page reads as one voice at two volumes.
 *
 * Both are self-hosted at build time: no runtime request to a font CDN, no
 * layout shift, no third-party dependency at all.
 *
 * SUBSET, NOT SIMPLIFIED.
 *
 * These are the same two variable faces, with every axis intact — Bricolage
 * still carries opsz 12-96, wght 200-800 and wdth 75-100; Archivo still
 * carries wght 100-900 and wdth 62-125 — so `font-optical-sizing` still tunes
 * the drawing with size and every `font-variation-settings` rule in
 * globals.css still resolves exactly as before. What has been removed is the
 * ~100 glyphs per face that this site never renders.
 *
 * It matters more than it sounds. Google's `latin` cut of these two faces is
 * 216KB, and a trace of the live site shows nothing paints until it has
 * arrived: on the connection a mobile audit simulates, that is over a second
 * of the critical path spent on outlines for characters the page does not
 * contain. The subset is built from the characters the site actually renders,
 * collected off the built pages in both themes with every accordion open, plus
 * the whole printable ASCII range and the usual typographic punctuation as a
 * margin (scripts/fonts.mjs).
 *
 * The fallback metric overrides below are the ones Google's own cut produced,
 * pinned explicitly so the no-font-yet frame is laid out identically and CLS
 * stays at zero.
 */
const display = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  weight: "200 800",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
  variable: "--font-display",
  display: "swap",
  // Next's own computed fallback is switched off in favour of the pinned
  // metrics in globals.css, so the pre-swap frame matches the original exactly.
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback", "system-ui", "sans-serif"],
});

const sans = localFont({
  src: "./fonts/archivo-latin.woff2",
  weight: "100 900",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Archivo Fallback", "system-ui", "sans-serif"],
});

/** Kept in step with PORTRAIT_WIDTHS/PORTRAIT_SIZES in ui/Portrait.tsx. */
const PORTRAIT_SRCSET = (grade: "ink" | "paper") =>
  [384, 448, 544, 640, 768, 900].map((w) => `/img/gen/portrait-${grade}-${w}.avif ${w}w`).join(", ");
const PORTRAIT_SIZES =
  "(min-width: 1280px) 384px, (min-width: 1024px) 352px, (min-width: 390px) 304px, 78vw";

const url = "https://dawood.dev";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${profile.short} | Full-Stack, 3D Web & Agentic AI Engineer`,
    template: `%s | ${profile.short}`,
  },
  description: profile.intro,
  keywords: [
    "full-stack developer",
    "3D web developer",
    "WebGL",
    "Three.js",
    "agentic AI engineer",
    "Next.js developer",
    "Pakistan",
  ],
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    type: "website",
    title: `${profile.short} | Systems that run.`,
    description: profile.intro,
    siteName: profile.name,
    images: [{ url: "/img/avatar.jpg", width: 400, height: 400, alt: profile.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.short} | Systems that run.`,
    description: profile.intro,
    images: ["/img/avatar.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090B" },
    { media: "(prefers-color-scheme: light)", color: "#EDE9E0" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        {/* Blocking: stamps data-theme before first paint so there is no flash. */}
        <ThemeScript />
        {/*
          The hero portrait, preloaded by the parser rather than by a script.

          These used to be emitted by the inline theme script, which is why
          PSI reported a 370ms "resource load delay" on the LCP image: a
          script-injected <link> cannot be seen by the preload scanner, so the
          request could not begin until the document had been parsed and the
          script had run. Declared statically the scanner finds them in the
          first bytes of the response and the image starts immediately.

          `media` is what keeps it to one grade. The scanner honours it, so a
          dark-mode visitor fetches only the ink grade and a light-mode visitor
          only the paper one — the same single-grade behaviour the theme script
          was arranging, half a second earlier. (A returning visitor who has
          explicitly toggled against their OS preference gets the other grade
          the ordinary way; it is one request, not a wasted one.)
        */}
        <link
          rel="preload"
          as="image"
          type="image/avif"
          media="(prefers-color-scheme: dark)"
          imageSrcSet={PORTRAIT_SRCSET("ink")}
          imageSizes={PORTRAIT_SIZES}
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          type="image/avif"
          media="(prefers-color-scheme: light)"
          imageSrcSet={PORTRAIT_SRCSET("paper")}
          imageSizes={PORTRAIT_SIZES}
          fetchPriority="high"
        />
        {/* The grain tile is a CSS background, so the browser cannot see it
            until the stylesheet has been parsed and the layer is laid out —
            by which point it is competing with the hero portrait for the same
            connection, at low priority, and the blended overlay it feeds sits
            above every pixel on the page. Naming it in the document lets the
            preload scanner start it with the first bytes of HTML instead. */}
        <link rel="preload" as="image" href="/textures/grain.webp" type="image/webp" fetchPriority="low" />
      </head>
      {/* Lenis writes inline styles onto <body> the moment it initialises,
          which React's hydration pass reports as a mismatch. The markup itself
          matches — only the third-party mutation differs. */}
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <SmoothProvider>
            <a
              href="#work"
              className="sr-only rounded-full bg-ink px-5 py-3 text-page focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
            >
              Skip to content
            </a>

            <PortraitProvider>
              <BackdropMount />

              <Preloader />
              <Cursor />
              <Nav />
              <ScrollRail />
              <PortraitStage />

              <main id="main" className="above">
                {children}
              </main>
            </PortraitProvider>

            <div className="grain" aria-hidden="true" />
          </SmoothProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
