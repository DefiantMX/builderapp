/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions: true, // This can be removed as it's available by default now
  },
  env: {
    // Force the correct URL for authentication
    NEXTAUTH_URL: 'http://localhost:3000',
  }
}

module.exports = nextConfig 