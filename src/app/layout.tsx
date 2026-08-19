import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Archivo } from "next/font/google";
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
 * Both are self-hosted by next/font at build time: no runtime request to a
 * font CDN, no layout shift, no third-party dependency at all.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});

const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

const url = "https://dawood.dev";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${profile.short} — Full-Stack, 3D Web & Agentic AI Engineer`,
    template: `%s — ${profile.short}`,
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
    title: `${profile.short} — Systems that run.`,
    description: profile.intro,
    siteName: profile.name,
    images: [{ url: "/img/avatar.jpg", width: 400, height: 400, alt: profile.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.short} — Systems that run.`,
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
