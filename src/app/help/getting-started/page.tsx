import Link from 'next/link';
import { ArrowLeft, CheckCircle, User, MessageCircle, Target, Trophy, Lightbulb, Wrench } from 'lucide-react';

export default function GettingStartedPage() {
  const steps = [
    // {
    //   number: 1,
    //   title: 'Create Your Account',
    //   description: 'Sign up for PGPals using your email address',
    //   icon: User,
    //   details: [
    //     'Visit the sign-up page and enter your details',
    //     'Choose a unique username that represents you',
    //     'Verify your email address',
    //     'Complete your profile with basic information'
    //   ]
    // },
    {
      number: 1,
      title: 'Find Our Telegram Bot',
      description: 'Connect with our bot to start submitting quests',
      icon: MessageCircle,
      details: [
        'Search for @pgpals_quest_bot on Telegram or visit https://t.me/pgpals_quest_bot',
        'Send the /start command to begin',
        'The bot will provide you with your Telegram ID',
        'Copy this ID for the next step'
      ]
    },
    {
      number: 2,
      title: 'Link Your Accounts',
      description: 'Connect your web account with Telegram',
      icon: CheckCircle,
      details: [
        'Go to your Profile page on the website',
        'Find the "Telegram ID" field',
        'Paste the ID you received from the bot',
        'Save your profile to complete the connection'
      ]
    },
    {
      number: 3,
      title: 'Explore Available Quests',
      description: 'Browse and understand different quest types',
      icon: Target,
      details: [
        'Visit the Quests page to see all available challenges',
        'Read quest descriptions and requirements carefully',
        'Note the point values and difficulty levels',
        'Check if quests require partnerships or can be done solo'
      ]
    },
    {
      number: 4,
      title: 'Complete Your First Quest',
      description: 'Start earning points and climbing the leaderboard',
      icon: Trophy,
      details: [
        'Choose a quest that matches your interests',
        'Complete the quest requirement in real life',
        'Take exactly ONE clear photo showing proof of completion',
        'Submit using /submit [quest_id] on Telegram with your single photo'
      ]
    }
  ];

  const tips = [
    {
      title: 'Read Quest Details Carefully',
      description: 'Make sure you understand exactly what\'s required before attempting a quest.'
    },
    {
      title: 'Take ONE Clear Photo',
      description: 'Submit exactly ONE photo that clearly shows you\'ve completed the quest requirement.'
    },
    {
      title: 'Check Point Values',
      description: 'Different quests have different point values based on difficulty and time investment.'
    },
    {
      title: 'Consider Partnerships',
      description: 'Some quests are more fun with a partner, and you can share the experience!'
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/help" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 hover:bg-primary-50 rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Help
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
          <Trophy className="w-8 h-8 text-primary-600 mr-3" />
          Getting Started with PGPals
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Follow this step-by-step guide to set up your account and complete your first quest
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8 mb-12">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div key={step.number} className="card p-8">
              <div className="flex items-start">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-6 flex-shrink-0 shadow-lg">
                  {step.number}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center mb-3">
                    <IconComponent className="w-6 h-6 text-primary-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">{step.title}</h2>
                  </div>
                  <p className="text-gray-600 mb-4 text-lg">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, index) => (
                      <li key={index} className="flex items-start text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Lightbulb className="w-6 h-6 text-primary-600 mr-2" />
          Pro Tips for Success
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {tips.map((tip, index) => (
            <div key={index} className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <h3 className="font-semibold text-primary-800 mb-2">{tip.title}</h3>
              <p className="text-primary-700 text-sm">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Wrench className="w-6 h-6 text-primary-600 mr-2" />
          Common Setup Issues
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-primary-400 bg-primary-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-primary-800 mb-1">Can&apos;t find the Telegram bot?</h3>
            <p className="text-primary-700 text-sm">Make sure you&apos;re searching for the official PGPals bot. Check for verification badges and ask administrators if you&apos;re unsure.</p>
          </div>
          <div className="border-l-4 border-accent-400 bg-accent-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-accent-800 mb-1">Telegram ID not working?</h3>
            <p className="text-accent-700 text-sm">Double-check that you&apos;ve copied the entire ID correctly. Make sure there are no extra spaces or characters.</p>
          </div>
          <div className="border-l-4 border-primary-400 bg-primary-50 p-4 rounded-r-lg">
            <h3 className="font-semibold text-primary-800 mb-1">No quests showing up?</h3>
            <p className="text-primary-700 text-sm">Ensure your account is properly set up and your Telegram is linked. Some quests may have specific requirements or time restrictions.</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Learn more</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {/* <Link href="/auth/signup" className="btn-primary">
              Sign Up Now
            </Link> */}
            <Link href="/help/quests" className="btn-secondary">
              Learn About Quests
            </Link>
            <Link href="/help/telegram" className="btn-secondary">
              Telegram Guide
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}