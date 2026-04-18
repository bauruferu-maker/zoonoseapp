import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Necessário para Netlify SSR (App Router + API Routes)
  // NÃO usar output: 'export' — quebra API routes e Server Components com cookies
}

export default nextConfig
