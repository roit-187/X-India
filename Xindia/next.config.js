// Extract dynamic API origin and WebSocket protocol from NEXT_PUBLIC_API_URL
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
let dynamicApiOrigins = '';
if (rawApiUrl) {
  try {
    const parsed = new URL(rawApiUrl);
    const httpOrigin = parsed.origin;
    const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsOrigin = `${wsProto}//${parsed.host}`;
    dynamicApiOrigins = `${httpOrigin} ${wsOrigin}`;
  } catch (_) {}
}

const connectSrcDirective = [
  "connect-src 'self'",
  "http://localhost:*",
  "ws://localhost:*",
  "https://*.onrender.com",
  "wss://*.onrender.com",
  dynamicApiOrigins,
  "https://firebaseinstallations.googleapis.com",
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://www.googleapis.com",
].filter(Boolean).join(' ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.googleusercontent.com",
              connectSrcDirective,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-src 'self' https://www.youtube-nocookie.com",
              "media-src 'self' https://res.cloudinary.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
