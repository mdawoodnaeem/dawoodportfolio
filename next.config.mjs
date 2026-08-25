/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `unoptimized: true` means the browser gets these files exactly as they
  // sit in /public — no dependency on the server-side `sharp` pipeline at
  // request time. The portrait/avatar/grain files are already hand-resized
  // and compressed to their real display size, so there's very little left
  // for Next's own re-encoding to add — and it removes an entire class of
  // "image optimizer failed on this host" failure (the npm allow-scripts
  // warning around sharp's install script is exactly that risk surfacing).
  images: { unoptimized: true },
  // three ships untranspiled ESM examples; letting Next optimise the barrel
  // keeps the client bundle from pulling in the whole library.
  experimental: { optimizePackageImports: ["@react-three/drei"] },
  // Next's own dev-mode route badge (bottom-left "N" circle) sits on top of
  // page content and is easy to mistake for a design bug. It only ever
  // renders in local development, never on a production build, but we turn
  // it off outright so nothing floats over the footer while iterating.
  devIndicators: false,
};
export default nextConfig;
