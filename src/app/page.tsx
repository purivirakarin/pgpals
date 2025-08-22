'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Gamepad2 } from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Gamepad2 className="w-4 h-4 text-white/90 mr-2" />
            <span className="text-white/90 text-sm font-medium">Prince George's Park Residence</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold heading-style mb-6">
            Welcome to PGPals
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            A 2-week buddy series for all PGPR residents. Complete exciting quests, upload proof via Telegram, 
            and climb the leaderboard in this community-driven platform where every achievement counts.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!session ? (
            <Link href="/auth/signin" className="btn-primary text-lg px-8 py-4">
              Get Started
            </Link>
          ) : (
            <Link href="/quests" className="btn-primary text-lg px-8 py-4">
              View Quests
            </Link>
          )}
          <Link href="/help" className="btn-ghost text-lg px-8 py-4">
            Learn More
          </Link>
        </div>
      </div>

      </div>
    </div>
  );
}