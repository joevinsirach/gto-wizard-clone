import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gto-wizard/ui-components', '@gto-wizard/types'],
}

export default nextConfig