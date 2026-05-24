/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'sql.js']
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['sql.js'],
  },
}
module.exports = nextConfig
