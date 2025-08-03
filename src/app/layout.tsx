import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PGPals - Quest Gamification Platform',
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
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">PGPals</h1>
                  <span className="ml-2 text-sm text-gray-500">Quest Platform</span>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                    Home
                  </a>
                  <a href="/leaderboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                    Leaderboard
                  </a>
                  <a href="/quests" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                    Quests
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}