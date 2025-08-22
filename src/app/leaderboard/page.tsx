import Leaderboard from '@/components/Leaderboard';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
            <Trophy className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            See how you rank against other participants in the quest challenge!
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