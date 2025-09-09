import Leaderboard from '@/components/Leaderboard';
import { Trophy } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';

  // Check if leaderboard is visible to participants
  let leaderboardVisible = true;
  try {
    const { data: settingData } = await supabaseAdmin
      .rpc('get_system_setting', { setting_name: 'leaderboard_visible' });
    leaderboardVisible = settingData === true;
  } catch (error) {
    console.error('Error checking leaderboard visibility:', error);
    // Default to visible if there's an error
  }

  // Redirect non-admin users to home page if leaderboard is disabled
  if (!isAdmin && !leaderboardVisible) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Admin Notice when leaderboard is hidden */}
        {isAdmin && !leaderboardVisible && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Admin View - Leaderboard Hidden from Participants
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  The leaderboard is currently hidden from participants. You can manage this setting in the{' '}
                  <a href="/admin/controls" className="font-medium underline hover:text-yellow-600">
                    Admin Controls
                  </a>{' '}
                  panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
            <Trophy className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {isAdmin && !leaderboardVisible 
              ? "Monitor participant rankings and performance (currently hidden from participants)."
              : "Monitor participant rankings and performance in the quest challenge."
            }
          </p>
        </div>

        <Leaderboard limit={20} className="max-w-none" />
        
        <div className="mt-8 card p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">How Points Work</h2>
          <p className="text-gray-600 mb-4">
            Points are awarded based on quest difficulty and completion speed. Rankings update in real-time after validation.
          </p>
          <a 
            href="/help/scoring" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Learn more about scoring system →
          </a>
        </div>
      </div>
    </div>
  );
}