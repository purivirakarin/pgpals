import Leaderboard from '@/components/Leaderboard';
import { MessageCircle, Target, Trophy, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to PGPals! 🎮
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete exciting quests, upload proof via Telegram, and climb the leaderboard. 
          Join our community-driven quest platform where every achievement counts!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-6 text-center">
          <Target className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Complete Quests</h3>
          <p className="text-gray-600 text-sm">
            Browse available quests and complete fun challenges
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <MessageCircle className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Submit via Telegram</h3>
          <p className="text-gray-600 text-sm">
            Upload proof photos directly through our Telegram bot
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Earn Points</h3>
          <p className="text-gray-600 text-sm">
            Get points for completed quests and build your score
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <Users className="w-12 h-12 text-primary-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Compete & Win</h3>
          <p className="text-gray-600 text-sm">
            Climb the leaderboard and compete with other participants
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Start with Telegram</h3>
                  <p className="text-gray-600">
                    Find our Telegram bot and use <code className="bg-gray-100 px-2 py-1 rounded">/start</code> to link your account
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Browse Quests</h3>
                  <p className="text-gray-600">
                    Use <code className="bg-gray-100 px-2 py-1 rounded">/quests</code> to see available challenges and their point values
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Submit Proof</h3>
                  <p className="text-gray-600">
                    Take a photo and send it with <code className="bg-gray-100 px-2 py-1 rounded">/submit [quest_id]</code>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-4 mt-1">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Validated & Earn Points</h3>
                  <p className="text-gray-600">
                    Our AI validates your submission automatically, and you earn points instantly!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🤖 Telegram Bot Commands</h3>
              <div className="space-y-1 text-sm">
                <p><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">/start</code> - Link your account</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">/quests</code> - View available quests</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">/submit [id]</code> - Submit quest proof</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">/status</code> - Check your submissions</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded text-blue-800">/leaderboard</code> - View top participants</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Leaderboard limit={10} />
        </div>
      </div>
    </div>
  );
}