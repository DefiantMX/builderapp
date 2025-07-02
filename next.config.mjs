/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      }
    ]
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  }
};

export default nextConfig;
