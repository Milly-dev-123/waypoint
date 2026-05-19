// Waypoint — Next.js config.
// Hardens HTTP responses with CSP + a handful of standard security headers.
// CSP includes the local Supabase port (54321) for dev and a wildcard
// *.supabase.co for prod, plus CartoDB's tile CDN for the Leaflet map.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js requires 'unsafe-inline' for its hydration script in
              // dev; tighten with a nonce in Phase 2 once we have a server
              // component that emits one.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // CartoDB Positron tiles served from basemaps.cartocdn.com (dev only — will swap providers before non-dev deploy).
              "img-src 'self' data: blob: https://*.basemaps.cartocdn.com",
              "font-src 'self' data:",
              "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321 https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
