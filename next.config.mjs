/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  serverActions: {
    bodySizeLimit: '50mb',
  },
  experimental: {
    middlewareClientMaxBodySize: 50 * 1024 * 1024,
  },
}

export default nextConfig
