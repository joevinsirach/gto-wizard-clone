const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gto-wizard/ui-components', '@gto-wizard/types'],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
