/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["replicate", "@upstash/redis"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.replicate.delivery"
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net"
      },
      {
        protocol: "https",
        hostname: "fal.media"
      }
    ]
  }
};

export default nextConfig;
