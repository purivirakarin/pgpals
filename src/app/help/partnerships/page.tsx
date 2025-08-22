import Link from 'next/link';
import { ArrowLeft, Users, Heart, Star, Target, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function PartnershipsHelpPage() {
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
          <Users className="w-8 h-8 text-white mr-3" />
          Partnership Guide
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Learn about the partnership system and how to collaborate with others
        </p>
      </div>

      {/* What are Partnerships */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Heart className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">What are Partnerships?</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Partnerships in PGPals allow you to complete quests together with another participant. 
          When you have a partner, you can tackle pair-specific quests and share the experience of completing challenges.
        </p>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-primary-800 text-sm">
            <strong>Important:</strong> Partnerships must be assigned by admin. Participants cannot choose or link partners themselves. 
            If you need a partner assignment or have issues with your current partner, please contact 
            <a href="https://t.me/Yyyyjjjj1" className="text-primary-700 hover:text-primary-900 underline">@Yyyyjjjj1</a> or <a href="https://t.me/gahin_r" className="text-primary-700 hover:text-primary-900 underline">@gahin_r</a> or <a href="https://t.me/purivirakarin" className="text-primary-700 hover:text-primary-900 underline">@purivirakarin</a>.
          </p>
        </div>
      </div>

      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <UserPlus className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">How Partnerships Work</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Admin Assignment</h3>
              <p className="text-gray-600 text-sm">
                Partnerships are assigned by admin based on preferences, compatibility, and availability. 
                You cannot choose or link partners yourself through the system.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Partner Notification</h3>
              <p className="text-gray-600 text-sm">
                Once assigned, both partners will be notified through the Telegram bot 
                <a href="https://t.me/pgpals_quest_bot" className="text-primary-600 hover:text-primary-800 underline">@pgpals_quest_bot</a> and can see 
                the partnership reflected in their profile.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-gray-600 text-sm">
                If you have issues with your partner assignment or need a new partner, contact 
                <a href="https://t.me/Yyyyjjjj1" className="text-primary-700 hover:text-primary-900 underline">@Yyyyjjjj1</a> or <a href="https://t.me/gahin_r" className="text-primary-700 hover:text-primary-900 underline">@gahin_r</a> or <a href="https://t.me/purivirakarin" className="text-primary-700 hover:text-primary-900 underline">@purivirakarin</a>
                on Telegram.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Start Questing Together</h3>
              <p className="text-gray-600 text-sm">
                Once your partnership is active, you&apos;ll see partnership-specific quests and can start completing challenges together. 
                Only one of you needs to submit proof for both to receive points.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Star className="w-8 h-8 text-accent-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Partnership Benefits</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Access to Pair Quests
            </h3>
            <p className="text-primary-700 text-sm">
              Unlock special quests designed specifically for partnerships that often have higher point values.
            </p>
          </div>
          
          <div className="bg-primary-100 p-4 rounded-lg border border-primary-300">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Shared Experiences
            </h3>
            <p className="text-primary-700 text-sm">
              Make new friends and create memories while completing fun challenges together.
            </p>
          </div>
          
          <div className="bg-muted-50 p-4 rounded-lg border border-muted-200">
            <h3 className="font-semibold text-muted-800 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Efficient Submissions
            </h3>
            <p className="text-muted-700 text-sm">
              Only one person needs to submit proof, but both partners receive the points automatically.
            </p>
          </div>
          
          <div className="bg-accent-50 p-4 rounded-lg border border-accent-200">
            <h3 className="font-semibold text-accent-800 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Team Competition
            </h3>
            <p className="text-accent-700 text-sm">
              Compete as a team and support each other to climb the leaderboard together.
            </p>
          </div>
        </div>
      </div>

      {/* Partnership Rules */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <AlertCircle className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Partnership Rules & Guidelines</h2>
        </div>
        
        <div className="space-y-4">
          <div className="border-l-4 border-primary-400 bg-primary-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-primary-800 mb-1">One Quest Per Partnership</h3>
            <p className="text-primary-700 text-sm">
              Each quest can only be completed once per partnership. If one partner has already done a quest, 
              the other cannot submit it again.
            </p>
          </div>
          
          <div className="border-l-4 border-primary-400 bg-primary-100 p-4 rounded-r-lg">
            <h3 className="font-semibold text-primary-800 mb-1">Admin Assignment Only</h3>
            <p className="text-primary-700 text-sm">
              Partnerships are assigned by admin. You cannot link or choose partners yourself. 
              Contact <a href="https://t.me/Yyyyjjjj1" className="text-primary-700 hover:text-primary-900 underline">@Yyyyjjjj1</a> or <a href="https://t.me/gahin_r" className="text-primary-700 hover:text-primary-900 underline">@gahin_r</a> or <a href="https://t.me/purivirakarin" className="text-primary-700 hover:text-primary-900 underline">@purivirakarin</a> for partnership requests.
            </p>
          </div>
          
          <div className="border-l-4 border-accent-400 bg-accent-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-accent-800 mb-1">Respect & Communication</h3>
            <p className="text-accent-700 text-sm">
              Communicate clearly about quest plans and respect your partner&apos;s schedule and preferences.
            </p>
          </div>
          
          <div className="border-l-4 border-muted-400 bg-muted-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-muted-800 mb-1">Can End Anytime</h3>
            <p className="text-muted-700 text-sm">
              Either partner can end the relationship at any time. Previously completed quests remain valid.
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Partnership Issues</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Q: How do I get a partner?</h3>
            <p className="text-gray-600 text-sm">
              Partnerships are assigned by admin. Contact <a href="https://t.me/Yyyyjjjj1" className="text-primary-700 hover:text-primary-900 underline">@Yyyyjjjj1</a> or <a href="https://t.me/gahin_r" className="text-primary-700 hover:text-primary-900 underline">@gahin_r</a> or <a href="https://t.me/purivirakarin" className="text-primary-700 hover:text-primary-900 underline">@purivirakarin</a> on Telegram to request a partnership.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Q: Can I choose my own partner?</h3>
            <p className="text-gray-600 text-sm">
              No, you cannot link or choose partners yourself. All partnerships must be assigned by admin to ensure fair matching and system integrity.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Q: Can I have multiple partners?</h3>
            <p className="text-gray-600 text-sm">
              Currently, the system supports one partner at a time. You need to end your current partnership before starting a new one.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Q: What happens to completed quests if we break up?</h3>
            <p className="text-gray-600 text-sm">
              All previously completed quests and earned points remain valid. Only future quest eligibility is affected.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Ready to Partner Up?</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://t.me/Yyyyjjjj1" className="btn-primary">
              Contact Yijie for Partnership
            </a>
            <a href="https://t.me/purivirakarin" className="btn-secondary">
              Contact Puri for Partnership
            </a>
            <Link href="/help/quests" className="btn-secondary">
              Quest Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}