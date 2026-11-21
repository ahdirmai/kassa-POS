/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pos/shared"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
