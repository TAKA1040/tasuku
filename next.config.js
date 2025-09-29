/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors will now block builds for better code quality
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig