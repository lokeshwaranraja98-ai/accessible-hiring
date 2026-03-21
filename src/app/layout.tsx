import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'Accessible Hire',
    template: '%s | Accessible Hire',
  },
  description: 'An inclusive digital hiring platform that removes barriers for people with disabilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <AccessibilityProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
