/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // 在构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig