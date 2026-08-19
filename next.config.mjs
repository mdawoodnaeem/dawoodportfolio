/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  // three ships untranspiled ESM examples; letting Next optimise the barrel
  // keeps the client bundle from pulling in the whole library.
  experimental: { optimizePackageImports: ["@react-three/drei"] },
};
export default nextConfig;
