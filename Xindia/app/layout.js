import './globals.css';

export const metadata = {
  title: "XINDIA — India's Business Launchpad",
  description:
    "XINDIA - India's Business Launchpad. Start your brand with verified manufacturers. Find qualified buyers for your factory. All on one trusted platform.",
  keywords: 'XINDIA, business, manufacturers, entrepreneurs, India, startup, brand launch',
  icons: {
    icon: '/xindia-logo.svg',
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
