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
  // Runs before paint. Explicit choice wins; otherwise follow the OS.
  const code = `(function(){try{var s=localStorage.getItem("${KEY}");var m=window.matchMedia("(prefers-color-scheme: light)").matches;var t=s==="ink"||s==="paper"?s:(m?"paper":"ink");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","ink");}})();`;
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
