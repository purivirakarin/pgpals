import Link from 'next/link';
import { ArrowLeft, Users, Star, Clock, Target, Camera, CheckCircle, AlertTriangle } from 'lucide-react';

export default function QuestsHelpPage() {
  const questTypes = [
    {
      title: 'Pair Tasks',
      icon: Users,
      color: 'primary',
      description: 'Standard quests designed for you and your partner to complete together',
      points: '10-50 points',
      examples: ['Take a photo together at a landmark', 'Complete a challenge as a team', 'Share a meal at a specific location'],
      requirements: ['Must have an assigned partner', 'Both participants get points', 'One submission per partnership']
    },
    {
      title: 'Multiple-Pair Tasks',
      icon: Target,
      color: 'green',
      description: 'Group activities where multiple pairs can participate together',
      points: '20-100 points',
      examples: ['Group dining at a restaurant', 'Team sports activity', 'Community event participation'],
      requirements: ['Multiple pairs can join', 'Group organizer submits for all', 'Higher point values due to coordination']
    },
    {
      title: 'Bonus Tasks',
      icon: Star,
      color: 'purple',
      description: 'Special time-limited challenges with extra rewards',
      points: '15-75 points + bonus',
      examples: ['Weekend special events', 'Holiday-themed activities', 'Seasonal challenges'],
      requirements: ['Limited time availability', 'Often seasonal or event-based', 'May have special requirements']
    }
  ];

  const submissionTips = [
    {
      icon: Camera,
      title: 'Take Clear Photos',
      description: 'Ensure your photo clearly shows you completing the quest requirement. Good lighting and clear subjects are essential.'
    },
    {
      icon: CheckCircle,
      title: 'Follow Instructions',
      description: 'Read quest descriptions carefully and make sure you meet all requirements before submitting.'
    },
    {
      icon: Users,
      title: 'Include All Participants',
      description: 'For pair or group quests, make sure all required participants are visible in the photo.'
    },
    {
      icon: Clock,
      title: 'Submit Promptly',
      description: 'Submit your proof as soon as possible after completing the quest, especially for time-sensitive activities.'
    }
  ];

  const pointSystem = [
    {
      range: '10-20 points',
      difficulty: 'Easy',
      description: 'Simple activities that take minimal time and effort',
      examples: ['Visit a specific location', 'Take a photo with an object', 'Try a new food item']
    },
    {
      range: '25-40 points',
      difficulty: 'Medium',
      description: 'Activities requiring more planning or social interaction',
      examples: ['Attend an event', 'Complete a group activity', 'Learn a new skill']
    },
    {
      range: '45-75 points',
      difficulty: 'Hard',
      description: 'Challenging activities requiring significant time or coordination',
      examples: ['Organize a group event', 'Complete a complex challenge', 'Multi-day activities']
    },
    {
      range: 'Bonus +5-25',
      difficulty: 'Special',
      description: 'Additional points for exceptional completion or special circumstances',
      examples: ['Creative interpretation', 'Going above and beyond', 'Time-limited bonuses']
    }
  ];

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
          <Target className="w-8 h-8 text-white mr-3" />
          Quest Guide
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Learn about different quest types, how to complete them, and maximize your points
        </p>
      </div>

      {/* Quest Types */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Quest Types</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {questTypes.map((type) => {
            const IconComponent = type.icon;
            const colorClasses: Record<string, string> = {
              primary: 'from-primary-500 to-primary-600 border-primary-200',
              green: 'from-primary-400 to-primary-500 border-primary-200',
              purple: 'from-primary-600 to-primary-700 border-primary-300'
            };
            
            return (
              <div key={type.title} className="card p-6 h-full">
                <div className={`bg-gradient-to-r ${colorClasses[type.color]} text-white rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <IconComponent className="w-8 h-8" />
                    <span className="text-sm font-semibold bg-white/20 px-2 py-1 rounded">
                      {type.points}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mt-2">{type.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-4">{type.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Examples:</h4>
                  <ul className="space-y-1">
                    {type.examples.map((example, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 mt-1.5"></div>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Requirements:</h4>
                  <ul className="space-y-1">
                    {type.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-3 h-3 text-primary-600 mr-2 mt-1 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Point System */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Point System</h2>
        <div className="card p-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pointSystem.map((level, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold">{level.range}</div>
                  <div className="text-sm opacity-90">{level.difficulty}</div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{level.description}</p>
                <div className="space-y-1">
                  {level.examples.map((example, exIndex) => (
                    <div key={exIndex} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission Tips */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Submission Tips</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {submissionTips.map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div key={index} className="card p-6">
                <div className="flex items-start">
                  <IconComponent className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{tip.title}</h3>
                    <p className="text-gray-600 text-sm">{tip.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Common Issues */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Common Issues & Solutions</h2>
        <div className="space-y-4">
          <div className="card p-6 border-l-4 border-muted-400">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-muted-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-muted-800 mb-2">Submission Rejected</h3>
                <p className="text-muted-700 mb-2">Your photo doesn&apos;t clearly show the quest requirement.</p>
                <p className="text-sm text-muted-600"><strong>Solution:</strong> Retake the photo with better lighting, clear view of all participants, and obvious completion of the requirement.</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 border-l-4 border-primary-400">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-primary-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary-800 mb-2">Quest Already Completed</h3>
                <p className="text-primary-700 mb-2">You or your partner has already submitted this quest.</p>
                <p className="text-sm text-primary-600"><strong>Solution:</strong> Check your submission history and try a different quest. Each quest can only be completed once per user/partnership.</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 border-l-4 border-primary-400">
            <div className="flex items-start">
              <Users className="w-6 h-6 text-primary-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary-800 mb-2">Partner Required</h3>
                <p className="text-primary-700 mb-2">This quest requires a partner but you don&apos;t have one assigned.</p>
                <p className="text-sm text-primary-600"><strong>Solution:</strong> Contact <a href="https://t.me/Yyyyjjjj1" className="text-primary-600 hover:text-primary-800 underline">@Yyyyjjjj1 (Yijie)</a> or <a href="https://t.me/purivirakarin" className="text-primary-600 hover:text-primary-800 underline">@purivirakarin (Puri)</a> to request a partner assignment, or choose a quest that doesn&apos;t require partnerships.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Ready to Start Questing?</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/quests" className="btn-primary">
              Browse Quests
            </Link>
            <Link href="/help/telegram" className="btn-secondary">
              Telegram Guide
            </Link>
            <Link href="/help/partnerships" className="btn-secondary">
              Partnership Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}