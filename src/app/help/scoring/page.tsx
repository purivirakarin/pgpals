import Link from 'next/link';
import { ArrowLeft, Trophy, Star, TrendingUp, Award, Users, Target, Camera } from 'lucide-react';

export default function ScoringHelpPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/help" 
          className="inline-flex items-center text-white/80 hover:text-white mb-4 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Help
        </Link>
        <h1 className="text-4xl font-bold heading-style mb-4 flex items-center">
          <Trophy className="w-8 h-8 text-white mr-3" />
          Scoring & Leaderboard
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Understand how points work and how to climb the leaderboard
        </p>
      </div>

      {/* Point Values */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Star className="w-8 h-8 text-accent-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">How Points Work</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center bg-primary-50 p-4 rounded-lg border border-primary-200">
            <div className="text-2xl font-bold text-primary-600 mb-2">10-20</div>
            <div className="text-sm text-primary-800 font-semibold mb-1">Easy Quests</div>
            <p className="text-xs text-primary-700">Quick activities, basic requirements</p>
          </div>
          
          <div className="text-center bg-primary-100 p-4 rounded-lg border border-primary-300">
            <div className="text-2xl font-bold text-primary-700 mb-2">25-40</div>
            <div className="text-sm text-primary-800 font-semibold mb-1">Medium Quests</div>
            <p className="text-xs text-primary-700">Social activities, more planning needed</p>
          </div>
          
          <div className="text-center bg-accent-50 p-4 rounded-lg border border-accent-200">
            <div className="text-2xl font-bold text-accent-600 mb-2">45-75</div>
            <div className="text-sm text-accent-800 font-semibold mb-1">Hard Quests</div>
            <p className="text-xs text-accent-700">Complex challenges, group coordination</p>
          </div>
        </div>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
            <Star className="w-4 h-4 mr-2" />
            Bonus Points
          </h3>
          <p className="text-primary-700 text-sm">
            Special time-limited quests and exceptional submissions can earn bonus points (+5 to +25).
            Keep an eye out for seasonal events and creative interpretations!
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Trophy className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Leaderboard System</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Rankings</h3>
              <p className="text-gray-600 text-sm">
                Your position updates immediately when you complete quests and earn points.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Total Points Ranking</h3>
              <p className="text-gray-600 text-sm">
                Rankings are based on your total accumulated points from all completed quests.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Competition Period</h3>
              <p className="text-gray-600 text-sm">
                The leaderboard runs for the entire event period with final rankings determined at the end.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competition Info */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Award className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Competition & Rewards</h2>
        </div>
        
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary-800 mb-3 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Event Period: August 25 - September 9
          </h3>
          <p className="text-primary-700 text-sm mb-4">
            The competition runs for 2 weeks with amazing prizes for top performers!
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center bg-white/50 p-3 rounded-lg">
              <div className="text-2xl mb-1 flex justify-center">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <div className="font-semibold text-primary-800 text-sm">Top 5 Pairs</div>
              <div className="text-xs text-primary-700">Premium prizes + surprises</div>
            </div>
            
            <div className="text-center bg-white/50 p-3 rounded-lg">
              <div className="text-2xl mb-1 flex justify-center">
                <Award className="w-6 h-6 text-accent-600" />
              </div>
              <div className="font-semibold text-primary-800 text-sm">Top 15 Pairs</div>
              <div className="text-xs text-primary-700">Valuable rewards</div>
            </div>
            
            <div className="text-center bg-white/50 p-3 rounded-lg">
              <div className="text-2xl mb-1 flex justify-center">
                <Star className="w-6 h-6 text-muted-600" />
              </div>
              <div className="font-semibold text-primary-800 text-sm">All Participants</div>
              <div className="text-xs text-primary-700">Achievement recognition</div>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-semibold text-primary-800 mb-2">Prize Examples</h3>
          <ul className="text-primary-700 text-sm space-y-1">
            <li>• Sony Headphone WH-1000 XM4 (Top performers)</li>
            <li>• Gaming accessories and tech gadgets</li>
            <li>• Gift vouchers and special experiences</li>
            <li>• Recognition certificates and badges</li>
          </ul>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <TrendingUp className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Tips to Maximize Points</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Plan Your Schedule
            </h3>
            <p className="text-primary-700 text-sm">
              Some quests are time-sensitive or seasonal. Plan ahead to maximize opportunities.
            </p>
          </div>
          
          <div className="bg-primary-100 p-4 rounded-lg border border-primary-300">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Partner Collaboration
            </h3>
            <p className="text-primary-700 text-sm">
              If you have an assigned partner, coordinate with them to tackle pair-specific quests for higher points. 
              Contact <a href="https://t.me/Yyyyjjjj1" className="text-primary-600 hover:text-primary-800 underline">@Yyyyjjjj1</a> or 
              <a href="https://t.me/purivirakarin" className="text-primary-600 hover:text-primary-800 underline">@purivirakarin</a> for partnership requests.
            </p>
          </div>
          
          <div className="bg-accent-50 p-4 rounded-lg border border-accent-200">
            <h3 className="font-semibold text-accent-800 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Focus on High-Value Quests
            </h3>
            <p className="text-accent-700 text-sm">
              Prioritize medium and hard quests for better point efficiency, but don&apos;t ignore easy wins.
            </p>
          </div>
          
          <div className="bg-muted-50 p-4 rounded-lg border border-muted-200">
            <h3 className="font-semibold text-muted-800 mb-2 flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              Quality Submissions
            </h3>
            <p className="text-muted-700 text-sm">
              Clear, well-composed photos get approved faster and may earn bonus recognition.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Ready to Compete?</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/leaderboard" className="btn-primary">
              View Leaderboard
            </Link>
            <Link href="/quests" className="btn-secondary">
              Browse Quests
            </Link>
            <Link href="/my-submissions" className="btn-secondary">
              Track Progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}