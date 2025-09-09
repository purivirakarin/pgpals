'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Users, Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLeaderboardVisibility } from '@/hooks/useLeaderboardVisibility';

export default function Footer() {
  const { data: session } = useSession();
  const { leaderboard_visible, loading: leaderboardLoading } = useLeaderboardVisibility();

  // Show leaderboard link if user is admin OR if leaderboard is visible to everyone
  const showLeaderboard = !leaderboardLoading && (session?.user?.role === 'admin' || leaderboard_visible);

  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'Quests', href: '/quests' },
    ...(showLeaderboard ? [{ name: 'Leaderboard', href: '/leaderboard' }] : []),
    { name: 'Help & Support', href: '/help' }
  ];
  return (
    <footer className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 text-white border-t border-primary-600/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-white">PGPals</h3>
            </div>
            <p className="text-primary-200 leading-relaxed max-w-sm">
              2-week buddy series connecting all PGPR residents through fun quests and meaningful partnerships.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white flex items-center">
              <span className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <span className="w-2 h-2 bg-white rounded-full"></span>
              </span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-primary-200 hover:text-white transition-colors duration-200 hover:translate-x-1 transform inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white flex items-center">
              <MessageCircle className="w-5 h-5 mr-3 text-primary-300" />
              Support & Contact
            </h4>
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-primary-200 mb-3 font-medium">General Inquiries</p>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://t.me/Yyyyjjjj1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    @Yyyyjjjj1
                  </a>
                  <a 
                    href="https://t.me/gahin_r" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors duration-200"
                  >
                    @gahin_r
                  </a>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-primary-200 mb-3 font-medium">Technical Support</p>
                <a 
                  href="https://t.me/purivirakarin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors duration-200"
                >
                  @purivirakarin
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-600/30 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-300 text-sm">
              © 2025 Prince George&apos;s Park Residence. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-primary-300 text-sm">Quest submissions:</span>
              <a 
                href="https://t.me/pgpals_quest_bot" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-primary-100 text-sm rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                @pgpals_quest_bot
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}