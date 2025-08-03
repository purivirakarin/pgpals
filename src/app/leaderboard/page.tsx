import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🏆 Leaderboard
        </h1>
        <p className="text-lg text-gray-600">
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
  );
}