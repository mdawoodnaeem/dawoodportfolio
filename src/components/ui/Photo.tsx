import { cn } from "@/lib/cn";

/**
 * PHOTO
 *
 * A plain <picture> over the pre-built variants in /public/img/gen (see
 * scripts/images.mjs), filling its positioned parent exactly the way
 * `next/image` with `fill` did.
 *
 * Why not next/image: the project runs with `images: { unoptimized: true }` —
 * a deliberate choice, because it takes the server-side sharp pipeline out of
 * the request path entirely. The cost of that choice was that every visitor
 * got the 900px master no matter what they were looking at it on: a phone
 * showing the portrait in a 304px column downloaded 900x1125 pixels of JPEG,
 * twice, once per theme grade. `unoptimized` also meant no AVIF and no WebP,
 * so the page was shipping 2019-era bytes.
 *
 * Doing the resizing at author time instead keeps both halves of that trade:
 * no runtime image service, and the browser still picks the smallest file that
 * covers its own pixel density. The original JPEG stays as the final <img
 * src>, so a browser with neither AVIF nor WebP gets exactly what it got
 * before.
 *
 * Server component — there is nothing interactive here, so none of it needs to
 * reach the client bundle.
 */
export function Photo({
  base,
  fallback,
  widths,
  sizes,
  alt,
  priority = false,
  className,
  hidden = false,
  themed = false,
}: {
  /** Basename inside /img/gen, without width or extension. */
  base: string;
  /** The untouched original, used when neither AVIF nor WebP is supported. */
  fallback: string;
  widths: number[];
  sizes: string;
  alt: string;
  /**
   * Marks this as the image the fold is waiting on: eager, high priority, and
   * therefore requested ahead of the scripts the preload scanner also finds.
   * The hero portrait is the page's LCP element, so it is the one image that
   * gets this.
   */
  priority?: boolean;
  className?: string;
  /** Purely decorative duplicate (the off-theme grade). */
  hidden?: boolean;
  /**
   * This image may be switched off by the theme (see `.solo-grade` in
   * globals.css), and must not be fetched while it is.
   *
   * `display: none` alone does not stop a browser downloading an image —
   * verified, not assumed. `loading="lazy"` does, but only in combination:
   * a lazy image inside a hidden subtree is never near the viewport, so it
   * is never requested; a lazy image that IS in the viewport is requested
   * immediately, at the first layout. So the pair gives exactly the wanted
   * behaviour — the grade the visitor is looking at loads at once, the grade
   * they are not does not load at all.
   *
   * The LCP image being `lazy` would normally be a mistake, because the
   * preload scanner skips lazy images and discovers them late. That does not
   * apply here: the theme script in <head> emits an explicit high-priority
   * preload for the exact grade about to be shown, so its bytes are already
   * in flight before the <img> is even parsed, and the tag resolves straight
   * out of cache.
   */
  themed?: boolean;
}) {
  const set = (ext: string) =>
    widths.map((w) => `/img/gen/${base}-${w}.${ext} ${w}w`).join(", ");

  return (
    // display:contents — the <picture> must not become a box of its own, or it
    // would sit between the absolutely-positioned <img> and the parent that is
    // meant to be its containing block.
    <picture className="contents">
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        {...(hidden ? { "aria-hidden": "true" as const } : null)}
        loading={priority && !themed ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        /* `decoding="async"` is right for everything the page can afford to
           show late — it lets the browser paint around an image rather than
           wait for it. For the one image the fold is actually waiting on that
           is the wrong instruction: it explicitly permits the first frame to
           go out without the portrait in it, which is the frame LCP measures.
           The priority image gets the default (auto) and lets the browser
           decide, which in practice means it is decoded in time to be in the
           first contentful frame rather than the one after it. */
        /* `sync` for the one image the fold is waiting on.
           `async` (and `auto`, which behaves like it here) explicitly permits
           the browser to put out a frame without this image in it and paint it
           into the next one. For the LCP element that is precisely the wrong
           permission: the portrait finishes downloading well before the intro
           curtain mounts, but was being held back a frame and so first painted
           on the far side of it. Decoding it synchronously puts it in the same
           frame as the rest of the fold. */
        decoding={priority ? "sync" : "async"}
        className={cn("absolute inset-0 h-full w-full text-transparent", className)}
      />
    </picture>
  );
}
