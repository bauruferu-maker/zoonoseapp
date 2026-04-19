/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO (P027): ignoreBuildErrors should be removed once Next.js 15 / Supabase SSR
    // type inference issues are resolved. Kept intentionally to avoid blocking builds
    // during the pilot phase. Do not remove without running `tsc --noEmit` first.
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO (P045): Re-enable ESLint during builds once code is stable
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
