import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import { StatsProvider } from '@/contexts/StatsContext';
import TelegramAutoLogin from '@/app/components/telegram-auto-login';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PGPals - Prince George\'s Park Residence',
  description: 'Complete quests, earn points, and climb the leaderboard!',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <StatsProvider>
            <div className="min-h-screen bg-gray-50">
              <TelegramAutoLogin />
              <main>{children}</main>
            </div>
          </StatsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}