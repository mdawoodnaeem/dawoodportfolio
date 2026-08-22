"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { SectionHead } from "@/components/ui/Type";

/**
 * PLAYGROUND
 *
 * The one section on the site with no job to do. It exists so that somebody
 * who has read this far gets something back — a thing they can shove around
 * that shoves back.
 *
 * The scene is code-split and only requested once the section is within a
 * viewport of the fold, so nobody pays for three.js unless they scroll this
 * far. Reduced-motion visitors get the still frame and the copy, and never
 * load the canvas at all.
 */
const Workshop = dynamic(() => import("@/components/three/Workshop"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

export function Playground() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [mount, setMount] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  // Only fetch the bundle when the section is genuinely approaching.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Feed section scroll progress to the camera rig.
  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to(progress, {
        current: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="playground"
      className="relative overflow-hidden py-[clamp(5rem,11vw,9rem)]"
      aria-labelledby="playground-heading"
    >
      {/* Ember bloom behind the canvas. Doing this in CSS rather than as a
          post-processing pass keeps a whole render target off the GPU. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.14), rgb(var(--accent) / 0.04) 45%, transparent 70%)",
        }}
      />

      <div className="shell relative">
        <div data-reveal>
          <SectionHead n="—" label="Playground" className="mask" />
        </div>

        <div className="mt-8 grid grid-cols-12 items-end gap-y-6" data-reveal data-stagger="0.08">
          <h2 id="playground-heading" className="col-span-12 lg:col-span-7">
            <span className="mask display display-trim text-d2">
              <span className="grad">Go on. Push them.</span>
            </span>
          </h2>
          <p className="rise col-span-12 text-lead text-muted lg:col-span-4 lg:col-start-9">
            {reduced
              ? "An interactive arrangement of glass, metal and ember. Paused, because your system asks for reduced motion."
              : "Grab any of them and throw it, the rest get out of the way. Click empty space to scatter the lot. Nothing here breaks; it all comes back."}
          </p>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative mt-10 h-[clamp(24rem,62vh,40rem)] w-full"
        data-cursor="drag"
        role="img"
        aria-label="An interactive cluster of tumbling glass, metal and ember-coloured objects. They lean away from the pointer, can be picked up and thrown, and scatter when the background is clicked."
      >
        {mount && !reduced ? (
          <Workshop progress={progress} onPush={() => setPushed(true)} />
        ) : (
          <SceneSkeleton />
        )}

        {/* Hint retires itself the first time the visitor actually pushes. */}
        {!reduced && (
          <span
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-700 ease-out"
            style={{ opacity: pushed ? 0 : 1 }}
          >
            {/* nowrap, or the pill wraps to two lines and the rounded ends
                break apart into two overlapping fragments. The label is
                shortened below sm rather than allowed to run onto a second
                line inside a shape that cannot hold one. */}
            <span className="glass-soft micro whitespace-nowrap rounded-full border border-line bg-page/55 px-4 py-2 text-faint">
              <span className="sm:hidden">Drag · tap to scatter</span>
              <span className="hidden sm:inline">Drag a shape · click to scatter</span>
            </span>
          </span>
        )}
      </div>
    </section>
  );
}

/**
 * Placeholder that occupies the exact stage box while the scene loads, so the
 * section never reflows when the canvas arrives.
 */
function SceneSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center" aria-hidden="true">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <span className="micro text-faint">Warming up the workshop</span>
      </div>
    </div>
  );
}
