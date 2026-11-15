import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.tina.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
      }
    ],
  },
  async headers() {
    // these are also defined in the root layout since github pages doesn't support headers
    const headers = [
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'self'",
      },
    ];
    // Committed media (the Hero piece clips and stills, /uploads) was served `max-age=0, must-revalidate`,
    // so every visit revalidated megabytes of video (#177). A day fresh, then a week served stale while it
    // revalidates. Not `immutable`: the files aren't fingerprinted, and a re-render keeps its file name.
    const mediaCache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      {
        source: '/(.*)',
        headers,
      },
      { source: '/hero-piece/:path*', headers: mediaCache },
      { source: '/uploads/:path*', headers: mediaCache },
    ];
  },
  async redirects() {
    // Framer at designbyalex.dev only ever served /, /acacia and /mosurban (sitemap,
    // homepage links and the Wayback Machine agree), and those keep their paths here,
    // so no Framer URL needs a redirect (#15). /home is this site's own duplicate of
    // the homepage: the catch-all renders home.mdx there, so send it to /.
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: '/admin/index.html',
      },
    ];
  },
};

export default nextConfig