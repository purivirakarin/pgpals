import Link from 'next/link';
import { ArrowLeft, User, Settings, Shield, MessageCircle, Eye, Lock } from 'lucide-react';

export default function AccountHelpPage() {
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
          <Settings className="w-8 h-8 text-white mr-3" />
          Account & Settings
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Manage your profile, privacy settings, and account security
        </p>
      </div>

      {/* Profile Setup */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <User className="w-8 h-8 text-primary-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Profile Setup</h2>
        </div>
        
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-semibold text-primary-800 mb-2">Basic Information</h3>
            <ul className="text-primary-700 text-sm space-y-1">
              <li>• <strong>Name:</strong> Choose a display name that represents you</li>
              <li>• <strong>Email:</strong> Used for account verification and important updates</li>
              <li>• <strong>Username:</strong> Your unique identifier in the system</li>
            </ul>
          </div>
          
          <div className="bg-primary-100 border border-primary-300 rounded-lg p-4">
            <h3 className="font-semibold text-primary-800 mb-2">Telegram Integration</h3>
            <ul className="text-primary-700 text-sm space-y-1">
              <li>• <strong>Telegram ID:</strong> Link your Telegram account to submit quests</li>
              <li>• <strong>Username:</strong> Optional Telegram username for easy identification</li>
              <li>• <strong>Bot Access:</strong> Ensure you&apos;ve messaged our bot with /start</li>
            </ul>
          </div>
          
          <div className="bg-muted-50 border border-muted-200 rounded-lg p-4">
            <h3 className="font-semibold text-muted-800 mb-2">Partnership Settings</h3>
            <ul className="text-muted-700 text-sm space-y-1">
              <li>• <strong>Partner ID:</strong> Shows your assigned partner for pair quests (assigned by admin)</li>
              <li>• <strong>Status:</strong> Shows if partnership is active or pending</li>
              <li>• <strong>History:</strong> View past partnerships and shared achievements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Shield className="w-8 h-8 text-primary-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Privacy & Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <Lock className="w-6 h-6 text-primary-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Password Security</h3>
              <p className="text-gray-600 text-sm mb-3">
                Use a strong, unique password for your PGPals account. You can change it anytime in your profile settings.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded p-3">
                <p className="text-primary-800 text-xs">
                  <strong>Tip:</strong> Use a combination of letters, numbers, and symbols for better security.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <Eye className="w-6 h-6 text-accent-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Profile Visibility</h3>
              <p className="text-gray-600 text-sm mb-3">
                Your name and achievements are visible to other participants on leaderboards. 
                Your email and Telegram ID remain private.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <span className="text-primary-600">✓ Public:</span> Name, points, rank, completed quests</li>
                <li>• <span className="text-muted-600">✗ Private:</span> Email, Telegram ID, submission photos</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start">
            <MessageCircle className="w-6 h-6 text-muted-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Communication Settings</h3>
              <p className="text-gray-600 text-sm">
                We only contact you for important account updates, quest notifications, and competition results. 
                Your information is never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="card p-8 mb-8">
        <div className="flex items-center mb-6">
          <Settings className="w-8 h-8 text-gray-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Account Management</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Common Tasks</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-800 text-sm">Update Profile Information</h4>
                <p className="text-gray-600 text-xs">Visit your Profile page to edit name, email, or Telegram details</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-800 text-sm">Change Password</h4>
                <p className="text-gray-600 text-xs">Use the &quot;Change Password&quot; option in your profile settings</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-800 text-sm">Request Partner Assignment</h4>
                <p className="text-gray-600 text-xs">Contact <a href="https://t.me/Yyyyjjjj1" className="text-primary-600 hover:text-primary-800 underline">@Yyyyjjjj1</a> or <a href="https://t.me/purivirakarin" className="text-primary-600 hover:text-primary-800 underline">@purivirakarin</a> for partnership requests</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Troubleshooting</h3>
            <div className="space-y-3">
              <div className="bg-primary-50 p-3 rounded-lg border border-primary-200">
                <h4 className="font-medium text-primary-800 text-sm">Forgot Password?</h4>
                <p className="text-primary-700 text-xs">Use the &quot;Forgot Password&quot; link on the login page</p>
              </div>
              
              <div className="bg-accent-50 p-3 rounded-lg border border-accent-200">
                <h4 className="font-medium text-accent-800 text-sm">Telegram Not Linking?</h4>
                <p className="text-accent-700 text-xs">Ensure you&apos;ve messaged our bot and copied the ID correctly</p>
              </div>
              
              <div className="bg-muted-50 p-3 rounded-lg border border-muted-200">
                <h4 className="font-medium text-muted-800 text-sm">Account Issues?</h4>
                <p className="text-muted-700 text-xs">Contact support through the Telegram bot or check help guides</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Privacy Policy */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Data & Privacy</h2>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-primary-800 mb-3">How We Handle Your Data</h3>
          <div className="space-y-3 text-primary-700 text-sm">
            <p>• <strong>Account Data:</strong> Stored securely and used only for platform functionality</p>
            <p>• <strong>Quest Photos:</strong> Used for validation only, not shared publicly</p>
            <p>• <strong>Performance Data:</strong> Anonymized statistics may be used for platform improvement</p>
            <p>• <strong>Third-Party Sharing:</strong> We never sell or share your personal information</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <div className="card p-6 inline-block">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Manage Your Account</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="btn-primary">
              Edit Profile
            </Link>
            <Link href="/my-submissions" className="btn-secondary">
              View Submissions
            </Link>
            <Link href="/help" className="btn-secondary">
              More Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}