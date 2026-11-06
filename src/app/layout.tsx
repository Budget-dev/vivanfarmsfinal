import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { WhatsAppButton } from '@/components/vivaan/WhatsAppButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Local font configuration to avoid network font download timeouts during build
const oswald = {
  variable: '--font-oswald',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0D3B2E',
};

export const metadata: Metadata = {
  title: 'Vivaan Farms | Natural Products Directly From Farm',
  description: 'Bringing farm freshness closer to your home. Fresh buffalo milk, pure traditional ghee, and natural farm products directly from Chandravelli, Bellampalli, Telangana.',
  openGraph: {
    title: 'Vivaan Farms | Natural Products Directly From Farm',
    description: 'Bringing farm freshness closer to your home. Fresh buffalo milk, pure traditional ghee, and natural farm products directly from Chandravelli, Bellampalli, Telangana.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://vivanfa.sirv.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vivanfa.sirv.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <WhatsAppButton />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
