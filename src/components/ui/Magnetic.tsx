"use client";

import { useRef } from "react";
import { gsap } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * MAGNETIC
 *
 * Pulls toward the pointer within its own bounds, with the label travelling
 * slightly further than the shell — a small parallax that makes the button
 * feel like an object with depth rather than a rectangle that slides.
 *
 * Strength is capped in pixels, not scaled to element size, so a wide CTA and
 * a small icon button feel like the same material.
 */
export function Magnetic({
  children,
  className,
  strength = 22,
  as = "button",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: "button" | "a";
} & React.HTMLAttributes<HTMLElement> &
  Record<string, unknown>) {
  const shell = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = shell.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    gsap.to(el, { x: x * strength, y: y * strength * 0.6, duration: 0.6, ease: "power3.out" });
    gsap.to(label.current, { x: x * strength * 0.35, y: y * strength * 0.25, duration: 0.6, ease: "power3.out" });
  };

  const reset = () => {
    gsap.to([shell.current, label.current], { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.55)" });
  };

  const Tag = as as "button";

  return (
    <Tag
      ref={shell as React.Ref<HTMLButtonElement>}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full",
        "border border-ink/85 px-7 py-3.5 will-change-transform",
        "transition-colors duration-600 ease-out hover:border-ink",
        className
      )}
      {...rest}
    >
      {/* Ink fill wipes up from the bottom edge on hover. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-bottom scale-y-0 rounded-full bg-ink transition-transform duration-600 ease-out group-hover:scale-y-100"
      />
      <span
        ref={label}
        className="relative z-10 flex items-center gap-2.5 text-[0.9rem] transition-colors duration-400 ease-out group-hover:text-page"
      >
        {children}
      </span>
    </Tag>
  );
}
