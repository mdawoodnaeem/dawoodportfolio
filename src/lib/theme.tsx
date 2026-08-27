"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "ink" | "paper";

const KEY = "dn-theme";

/**
 * THEME
 *
 * The initial value is resolved by a blocking inline script in <head> (see
 * `ThemeScript` below) so `data-theme` is on <html> before first paint — there
 * is no flash, and no need for a hydration-safe placeholder.
 *
 * Switching uses the View Transitions API to wipe the new theme in as a circle
 * originating at the toggle. Browsers without it fall back to the 600ms body
 * colour transition defined in globals.css.
 */

type Ctx = { theme: Theme; toggle: (origin?: { x: number; y: number }) => void };
const ThemeCtx = createContext<Ctx>({ theme: "ink", toggle: () => {} });

export const useTheme = () => useContext(ThemeCtx);

export function ThemeScript() {
  /**
   * Runs before paint. Explicit choice wins; otherwise follow the OS.
   *
   * It also emits the preload for the hero portrait, and that second job is
   * why it has to be a script rather than static markup.
   *
   * The portrait ships as two grades — one lit for bone stock, one for
   * graphite — and the page renders both, letting CSS reveal whichever the
   * theme calls for. That is what makes a theme switch instant, but it means
   * the markup alone cannot say which of the two the fold is actually waiting
   * on. Marking both as high priority would have them race each other for the
   * connection; marking neither leaves the LCP image to be discovered halfway
   * down the body, behind the nav.
   *
   * By the time this line runs the theme has just been decided, so it knows
   * exactly which grade is about to be visible, and can ask for that one — at
   * high priority, at the right width for this screen, from the first bytes of
   * the document. The other grade loads normally, and is in cache long before
   * anyone reaches the toggle.
   */
  const code = `(function(){var t;try{var s=localStorage.getItem("${KEY}");var m=window.matchMedia("(prefers-color-scheme: light)").matches;t=s==="ink"||s==="paper"?s:(m?"paper":"ink");}catch(e){t="ink";}document.documentElement.setAttribute("data-theme",t);try{var w=[384,512,640,768,900];var l=document.createElement("link");l.rel="preload";l.as="image";l.type="image/avif";l.imageSrcset=w.map(function(x){return "/img/gen/portrait-"+t+"-"+x+".avif "+x+"w"}).join(", ");l.imageSizes="(min-width: 1280px) 384px, (min-width: 1024px) 352px, (min-width: 390px) 304px, 78vw";l.fetchPriority="high";document.head.appendChild(l);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("ink");

  // Adopt whatever the inline script already decided.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "ink" || current === "paper") setTheme(current);
  }, []);

  const apply = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — the theme just won't persist */
    }
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === "ink" ? "paper" : "ink";
      const root = document.documentElement;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // @ts-expect-error - startViewTransition is not in lib.dom yet
      const start = root.startViewTransition?.bind(root);

      if (!start || reduced) {
        apply(next);
        return;
      }

      // Anchor the circular wipe on the button that was pressed.
      root.style.setProperty("--tx", `${origin?.x ?? window.innerWidth / 2}px`);
      root.style.setProperty("--ty", `${origin?.y ?? 0}px`);
      root.classList.add("theme-switching");

      const transition = start(() => apply(next));
      transition.finished.finally(() => root.classList.remove("theme-switching"));
    },
    [theme, apply]
  );

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
