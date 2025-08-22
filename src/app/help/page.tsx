import Link from 'next/link';
import { BookOpen, MessageCircle, Trophy, Users, Target, HelpCircle, Settings, Shield, Bot, Rocket, Lightbulb } from 'lucide-react';

export default function HelpPage() {
  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of PGPals and how to get started',
      icon: BookOpen,
      href: '/help/getting-started',
      topics: ['Account Setup', 'Telegram Integration', 'First Quest']
    },
    {
      title: 'Quest Guide',
      description: 'Everything about finding, completing, and submitting quests',
      icon: Target,
      href: '/help/quests',
      topics: ['Quest Types', 'Submission Process', 'Point System']
    },
    {
      title: 'Telegram Bot',
      description: 'Complete guide to using our Telegram bot',
      icon: MessageCircle,
      href: '/help/telegram',
      topics: ['Bot Commands', 'Photo Submission', 'Status Checking']
    },
    {
      title: 'Partnership System',
      description: 'Learn about team partnerships and collaboration',
      icon: Users,
      href: '/help/partnerships',
      topics: ['Partner Assignment', 'Group Quests', 'Team Benefits']
    },
    {
      title: 'Leaderboard & Points',
      description: 'Understanding the scoring system and competitions',
      icon: Trophy,
      href: '/help/scoring',
      topics: ['Point Values', 'Rankings', 'Competitions']
    },
    {
      title: 'Account & Settings',
      description: 'Manage your profile and account settings',
      icon: Settings,
      href: '/help/account',
      topics: ['Profile Setup', 'Privacy Settings', 'Account Security']
    }
  ];

  const quickHelp = [
    {
      question: 'How do I link my Telegram account?',
      answer: 'Go to your profile page and enter your Telegram ID. You can find this by messaging our bot with /start.'
    },
    {
      question: 'Why was my submission rejected?',
      answer: 'Submissions may be rejected if the photo doesn\'t clearly show the quest requirement or if it doesn\'t match the quest description.'
    },
    {
      question: 'Can I submit a quest multiple times?',
      answer: 'No, each quest can only be completed once per user or partnership.'
    },
    {
      question: 'How do group submissions work?',
      answer: 'For group quests, one person submits on behalf of all participants, and points are distributed to all members.'
    }
  ];

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
          <HelpCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Help & Support
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Find answers to your questions and learn how to make the most of PGPals
        </p>
      </div>

      {/* Help Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {helpCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Link
              key={category.title}
              href={category.href}
              className="card p-6 hover:scale-105 transition-all duration-200 group"
            >
              <div className="flex items-center mb-4">
                <IconComponent className="w-8 h-8 text-primary-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {category.description}
              </p>
              <div className="space-y-1">
                {category.topics.map((topic) => (
                  <div key={topic} className="text-sm text-gray-500 flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                    {topic}
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Help Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* FAQ */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-primary-600" />
            Quick Answers
          </h2>
          <div className="space-y-6">
            {quickHelp.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="font-semibold text-gray-800 mb-2">{item.question}</h3>
                <p className="text-gray-600 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Support */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary-600" />
            Need More Help?
          </h3>
          <p className="text-gray-600 mb-4">
            Can&apos;t find what you&apos;re looking for? Here are additional ways to get support:
          </p>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Message our Telegram bot directly</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Check your submission status in the dashboard</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Review quest details carefully before submitting</span>
            </div>
          </div>
        </div>

        {/* Safety & Guidelines */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-600" />
            Safety & Guidelines
          </h3>
          <p className="text-gray-600 mb-4">
            Important reminders for a safe and fun experience:
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Always prioritize your safety when completing quests</p>
            <p>• Respect others and follow community guidelines</p>
            <p>• Don&apos;t share personal information in submissions</p>
            <p>• Report inappropriate content or behavior</p>
          </div>
        </div>
      </div>

      {/* Getting Started CTA */}
      <div className="mt-12 text-center">
        <div className="card p-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary-600 mr-2" />
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Your account has been created by admin. Start your PGPals journey by connecting with our Telegram bot to link your account and unlock quests!
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <a 
              href="https://t.me/pgpals_quest_bot" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary text-sm flex items-center"
            >
              <Bot className="w-4 h-4 mr-2" />
              Start with Telegram Bot
            </a>
            <Link href="/help/getting-started" className="btn-secondary text-sm flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Read Getting Started Guide
            </Link>
          </div>
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary-500 mr-2" />
            Tip: Use /start command in the bot to get your Telegram ID for account linking
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}