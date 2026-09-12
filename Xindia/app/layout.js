import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "XINDIA — India's Business Launchpad",
  description:
    "XINDIA - India's Business Launchpad. Start your brand with verified manufacturers. Find qualified buyers for your factory. All on one trusted platform.",
  keywords: 'XINDIA, business, manufacturers, entrepreneurs, India, startup, brand launch',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/xindia-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "XINDIA — India's Business Launchpad",
    description:
      "Start your brand with verified manufacturers. Find qualified buyers for your factory. All on one trusted platform.",
    url: '/',
    siteName: 'XINDIA',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "XINDIA — India's Business Launchpad",
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "XINDIA — India's Business Launchpad",
    description:
      "Connecting entrepreneurs with verified manufacturers across India. All on one trusted platform.",
    images: ['/og-image.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
