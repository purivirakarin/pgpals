import Link from 'next/link';
import { ArrowLeft, MessageCircle, Camera, Send, List, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';

export default function TelegramHelpPage() {
  const commands = [
    {
      command: '/start',
      description: 'Link your account and get your Telegram ID',
      icon: MessageCircle,
      example: 'Simply type /start to begin',
      response: 'Bot will provide your unique Telegram ID to link with your web account'
    },
    {
      command: '/quests',
      description: 'View all available quests you can complete',
      icon: List,
      example: '/quests',
      response: 'Shows a list of quests with IDs, titles, points, and requirements'
    },
    {
      command: '/submit [id]',
      description: 'Submit a photo for a specific quest',
      icon: Camera,
      example: '/submit 123',
      response: 'Bot will ask you to send a photo, then process your submission'
    },
    {
      command: '/status',
      description: 'Check your recent submissions and their status',
      icon: CheckCircle,
      example: '/status',
      response: 'Shows your recent submissions with approval status and feedback'
    },
    {
      command: '/leaderboard',
      description: 'View top participants and your ranking',
      icon: BarChart3,
      example: '/leaderboard',
      response: 'Displays current leaderboard with top players and your position'
    }
  ];

  const submissionSteps = [
    {
      step: 1,
      title: 'Choose Your Quest',
      description: 'Use /quests to find a quest you want to complete. Note the quest ID number.',
      tip: 'Read the quest description carefully to understand what\'s required.'
    },
    {
      step: 2,
      title: 'Complete the Activity',
      description: 'Go out and actually complete the quest requirement in real life.',
      tip: 'Make sure you have everything needed for a good proof photo.'
    },
    {
      step: 3,
      title: 'Take a Clear Photo',
      description: 'Capture a photo that clearly shows you completed the quest.',
      tip: 'Good lighting, clear subjects, and all participants visible are key.'
    },
    {
      step: 4,
      title: 'Submit via Bot',
      description: 'Type /submit [quest_id] and send your photo when prompted.',
      tip: 'Make sure to use the correct quest ID from step 1.'
    },
    {
      step: 5,
      title: 'Wait for Review',
      description: 'Our AI will review your submission, usually within minutes.',
      tip: 'Check /status to see if your submission was approved or needs revision.'
    }
  ];

  const photoTips = [
    {
      title: 'Good Lighting',
      description: 'Take photos in well-lit environments. Natural daylight works best.',
      icon: MessageCircle
    },
    {
      title: 'Clear Subjects',
      description: 'Make sure all people and objects in the quest are clearly visible.',
      icon: CheckCircle
    },
    {
      title: 'Full Frame',
      description: 'Include the complete scene or activity, don\'t crop important details.',
      icon: Camera
    },
    {
      title: 'No Filters',
      description: 'Submit original photos without heavy filters or editing.',
      icon: AlertCircle
    },
    {
      title: 'Context Visible',
      description: 'Include enough background to show the location or setting.',
      icon: BarChart3
    },
    {
      title: 'All Participants',
      description: 'For pair/group quests, ensure everyone required is in the photo.',
      icon: Send
    }
  ];

  const troubleshooting = [
    {
      issue: 'Bot not responding',
      solution: 'Make sure you\'re messaging the official PGPals bot. Try /start again.',
      severity: 'medium'
    },
    {
      issue: 'Can\'t find quest ID',
      solution: 'Use /quests to see all available quests with their ID numbers.',
      severity: 'low'
    },
    {
      issue: 'Photo won\'t send',
      solution: 'Check your internet connection and photo file size. Try a smaller image.',
      severity: 'medium'
    },
    {
      issue: 'Submission rejected',
      solution: 'Check the rejection reason and retake the photo following the guidelines.',
      severity: 'high'
    },
    {
      issue: 'Points not updating',
      solution: 'Allow a few minutes for processing. Check /status for submission status.',
      severity: 'low'
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
          <MessageCircle className="w-8 h-8 text-white mr-3" />
          Telegram Bot Guide
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Learn how to use our Telegram bot to submit quests and track your progress
        </p>
      </div>

      {/* Bot Commands */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Bot Commands</h2>
        <div className="space-y-4">
          {commands.map((cmd, index) => {
            const IconComponent = cmd.icon;
            return (
              <div key={index} className="card p-6">
                <div className="flex items-start">
                  <IconComponent className="w-8 h-8 text-primary-600 mr-4 flex-shrink-0 mt-1" />
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <code className="bg-primary-100 text-primary-800 px-3 py-1 rounded-lg font-mono text-lg font-semibold">
                        {cmd.command}
                      </code>
                      <span className="text-gray-600">{cmd.description}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Example:</p>
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                          {cmd.example}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Response:</p>
                        <p className="text-sm text-gray-600">{cmd.response}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Process */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Submission Process</h2>
        <div className="space-y-6">
          {submissionSteps.map((step) => (
            <div key={step.step} className="card p-6">
              <div className="flex items-start">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0 shadow-lg">
                  {step.step}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-primary-800 text-sm">
                      <strong>💡 Tip:</strong> {step.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Guidelines */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Photo Guidelines</h2>
        <div className="card p-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photoTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-3 flex justify-center">
                    <IconComponent className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Good vs Bad Examples</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Good Example */}
          <div className="card p-6 border-l-4 border-primary-400">
            <h3 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Good Submission
            </h3>
            <div className="bg-primary-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-primary-800">
                <strong>Quest:</strong> &quot;Dine at a new restaurant with your partner&quot;
              </p>
            </div>
            <ul className="space-y-2 text-sm text-primary-700">
              <li>✅ Both partners clearly visible</li>
              <li>✅ Restaurant setting obvious</li>
              <li>✅ Food on table shows dining activity</li>
              <li>✅ Good lighting and clear image</li>
            </ul>
          </div>

          {/* Bad Example */}
          <div className="card p-6 border-l-4 border-muted-400">
            <h3 className="text-xl font-semibold text-muted-800 mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              Poor Submission
            </h3>
            <div className="bg-muted-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-800">
                <strong>Quest:</strong> &quot;Dine at a new restaurant with your partner&quot;
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-700">
              <li>❌ Only one person visible</li>
              <li>❌ Can&apos;t tell it&apos;s a restaurant</li>
              <li>❌ No food or dining evidence</li>
              <li>❌ Poor image quality</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold subheading-style mb-8">Troubleshooting</h2>
        <div className="space-y-3">
          {troubleshooting.map((item, index) => {
            const severityColors: Record<string, string> = {
              low: 'border-primary-400 bg-primary-50',
              medium: 'border-primary-500 bg-primary-100',
              high: 'border-muted-400 bg-muted-50'
            };
            const textColors: Record<string, string> = {
              low: 'text-primary-800',
              medium: 'text-primary-800',
              high: 'text-muted-800'
            };
            
            return (
              <div key={index} className={`card p-4 border-l-4 ${severityColors[item.severity]}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold mb-1 ${textColors[item.severity]}`}>
                      {item.issue}
                    </h3>
                    <p className={`text-sm ${textColors[item.severity]}`}>
                      {item.solution}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${severityColors[item.severity]} ${textColors[item.severity]} capitalize`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Ready to Use the Bot?</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="btn-primary">
              Link Telegram ID
            </Link>
            <Link href="/help/quests" className="btn-secondary">
              Quest Guide
            </Link>
            <Link href="/my-submissions" className="btn-secondary">
              View Submissions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}