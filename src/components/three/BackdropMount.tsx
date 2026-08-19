"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the living backdrop.
 *
 * The layout is a Server Component, and `next/dynamic` refuses `ssr: false`
 * there. This one-line client wrapper is the boundary that lets the WebGL
 * layer stay out of the server render and out of the main bundle — the page is
 * fully readable on the flat page colour before the canvas ever arrives.
 */
const Backdrop = dynamic(() => import("./Backdrop"), { ssr: false });

export function BackdropMount() {
  return <Backdrop />;
}
