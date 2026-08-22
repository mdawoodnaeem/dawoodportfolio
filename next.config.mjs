/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
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
