/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors will now block builds for better code quality
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/today',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig