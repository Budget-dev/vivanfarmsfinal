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
  title: 'Vivaan Organic Farms | Pure A2 Desi Buffalo Ghee',
  description: 'Authentic Vedic Bilona A2 Desi Buffalo Ghee, hand-churned in earthen pots and delivered fresh in 14 days.',
  openGraph: {
    title: 'Vivaan Organic Farms | Pure A2 Desi Buffalo Ghee',
    description: 'Authentic Vedic Bilona A2 Desi Buffalo Ghee, hand-churned in earthen pots and delivered fresh in 14 days.',
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
