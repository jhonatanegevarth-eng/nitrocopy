/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    trustHostHeader: true,
  },
};

export default nextConfig;
