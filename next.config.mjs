/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `unoptimized: true` means the browser gets these files exactly as they
  // sit in /public — no dependency on the server-side `sharp` pipeline at
  // request time. The portrait/avatar/grain files are pre-built by
  // `scripts/images.mjs` into AVIF, WebP and JPEG at every size the layout
  // actually asks for, and the markup picks between them with a plain
  // <picture>, so there is nothing left for Next's own re-encoding to add —
  // and it removes an entire class of "image optimizer failed on this host"
  // failure (the npm allow-scripts warning around sharp's install script is
  // exactly that risk surfacing).
  images: { unoptimized: true },
  // three ships untranspiled ESM examples; letting Next optimise the barrel
  // keeps the client bundle from pulling in the whole library.
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
    // The single stylesheet is ~11 KB over the wire and every browser must
    // fetch and parse it before it may paint a single pixel — on a throttled
    // mobile connection that is most of a second of guaranteed blank screen,
    // spent on a round trip for a file smaller than the HTML that references
    // it. Inlining it into the document removes the request from the critical
    // path entirely: first paint now needs exactly one response.
    inlineCss: true,
  },
  // Next's own dev-mode route badge (bottom-left "N" circle) sits on top of
  // page content and is easy to mistake for a design bug. It only ever
  // renders in local development, never on a production build, but we turn
  // it off outright so nothing floats over the footer while iterating.
  devIndicators: false,
  // Long-lived immutable caching for the pre-built image variants. They are
  // content-addressed by name (portrait-ink-640.avif and so on), so a new
  // grade ships under a new filename rather than by expiring an old one.
  async headers() {
    return [
      {
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/textures/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};
export default nextConfig;
