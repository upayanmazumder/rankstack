import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates, Red_Hat_Mono, Red_Hat_Text } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import './globals.css';

import { MotionProvider } from '@/components/motion';
import {
  QueryProvider,
  SessionExpiredRedirect,
  SessionRevalidator,
  ThemeProvider,
} from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Montserrat Alternates for display headings, Montserrat for section
// headings and numerals, Red Hat Text for reading, Red Hat Mono for code.
const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const redHatText = Red_Hat_Text({
  variable: '--font-red-hat-text',
  subsets: ['latin'],
});

const redHatMono = Red_Hat_Mono({
  variable: '--font-red-hat-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rankstack | Contest Platform & Live Leaderboard',
  description: 'Run programming contests, evaluate submissions, and track live leaderboards.',
  openGraph: {
    title: 'Rankstack | Contest Platform & Live Leaderboard',
    description: 'Run programming contests, evaluate submissions, and track live leaderboards.',
    type: 'website',
    siteName: 'Rankstack',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'h-full',
        'antialiased',
        montserratAlternates.variable,
        montserrat.variable,
        redHatText.variable,
        redHatMono.variable,
        'font-sans'
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <SessionExpiredRedirect />
            <SessionRevalidator />
            <NuqsAdapter>
              <MotionProvider>{children}</MotionProvider>
            </NuqsAdapter>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
