import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import Header from '@/components/Header';
import { StatsProvider } from '@/contexts/StatsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PGPals - Prince George\'s Park Residence Event',
  description: 'Complete quests, earn points, and climb the leaderboard!',
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
              <Header />
              <main>{children}</main>
            </div>
          </StatsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}