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
      
      <div className="mt-8 card p-6">
        <h2 className="text-xl font-semibold mb-4">How Points Work</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">🎯 Quest Completion</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Points vary by quest difficulty</li>
              <li>• Bonus points for streaks</li>
              <li>• Early completion bonuses</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">📊 Ranking System</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Real-time point updates</li>
              <li>• Top 20 participants shown</li>
              <li>• Updated after each validation</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}