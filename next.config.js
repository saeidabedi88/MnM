/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  // Enable static file serving for development
  output: 'standalone',
  // Disable strict mode for development
  reactStrictMode: false,
}

module.exports = nextConfig 