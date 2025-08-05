'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  MessageCircle, 
  Award, 
  Target, 
  Calendar,
  Link,
  Unlink,
  Copy,
  CheckCircle,
  Loader,
  AlertCircle,
  Trophy,
  Activity
} from 'lucide-react';
import ActivityFeed from '@/components/ActivityFeed';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  telegram_id?: string;
  telegram_username?: string;
  partner_id?: number;
  partner_name?: string;
  partner_telegram?: string;
  total_points: number;
  streak_count: number;
  created_at: string;
  submissions?: any[];
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkLoading, setLinkLoading] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      // Fetch profile data
      const response = await fetch(`/api/users/${session?.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      
      // Fetch user stats including rank
      const statsResponse = await fetch('/api/users/me/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData);
      }
      
      // Pre-fill Telegram fields if already linked
      if (data.telegram_id) {
        setTelegramId(data.telegram_id);
        setTelegramUsername(data.telegram_username || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchProfile();
  }, [session, status, router, fetchProfile]);

  const linkTelegramAccount = async () => {
    if (!telegramId) {
      setError('Telegram ID is required');
      return;
    }

    setLinkLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          telegram_username: telegramUsername
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Telegram account');
      }

      setProfile(data.user);
      await update(); // Update session
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link Telegram account');
    } finally {
      setLinkLoading(false);
    }
  };

  const unlinkTelegramAccount = async () => {
    setLinkLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/link-telegram', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Telegram account');
      }

      setProfile(data.user);
      setTelegramId('');
      setTelegramUsername('');
      await update(); // Update session
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink Telegram account');
    } finally {
      setLinkLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

const completedQuests = profile.submissions?.filter(s => s.status === 'approved' || s.status === 'ai_approved').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account and view your quest progress</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Member since</p>
                  <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Partnership Info */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Partnership Status</h2>
            {profile.partner_id && profile.partner_name ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">You are partnered with:</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700 font-semibold">{profile.partner_name}</p>
                    {profile.partner_telegram && (
                      <p className="text-green-700">@{profile.partner_telegram}</p>
                    )}
                    <p className="text-green-600 text-xs mt-2">
                      🤝 You share points and leaderboard ranking with your partner
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                    <span className="text-amber-800 font-medium">No Partnership Assigned</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-amber-700">
                      You are currently not partnered with anyone.
                    </p>
                    <p className="text-amber-700">
                      Please contact an admin to assign you a partner for shared points and team collaboration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telegram Linking */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Telegram Integration</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {profile.telegram_id ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Telegram Account Linked</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Telegram ID: {profile.telegram_id}</span>
                      <button
                        onClick={() => copyToClipboard(profile.telegram_id!)}
                        className="text-green-600 hover:text-green-700"
                      >
                        {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {profile.telegram_username && (
                      <p className="text-green-700">Username: @{profile.telegram_username}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={unlinkTelegramAccount}
                  disabled={linkLoading}
                  className="btn-secondary flex items-center"
                >
                  {linkLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4 mr-2" />
                  )}
                  Unlink Telegram Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">How to link your Telegram account:</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Find our bot on Telegram</li>
                    <li>2. Send <code className="bg-blue-100 px-1 rounded">/start</code> to get your Telegram ID</li>
                    <li>3. Copy the Telegram ID from the bot's message</li>
                    <li>4. Paste it in the field below and click "Link Account"</li>
                  </ol>
                  <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                    <strong>Note:</strong> You must create your website account first before linking Telegram!
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram ID *
                    </label>
                    <input
                      type="text"
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                      placeholder="Enter your Telegram ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Send /start to our bot to get your Telegram ID
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram Username (optional)
                    </label>
                    <input
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
                      placeholder="Enter your username (without @)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <button
                    onClick={linkTelegramAccount}
                    disabled={linkLoading || !telegramId}
                    className="btn-primary flex items-center"
                  >
                    {linkLoading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4 mr-2" />
                    )}
                    Link Telegram Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <ActivityFeed userId={session?.user?.id} limit={5} />
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Quest Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Quest Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-amber-500 mr-2" />
                  <span className="text-gray-600">Current Rank</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  #{userStats?.current_rank || '-'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-gray-600">Total Points</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">{profile.total_points}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Completed Quests</span>
                </div>
                <span className="text-lg font-semibold">{completedQuests}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-gray-600">Current Streak</span>
                </div>
                <span className="text-lg font-semibold">{profile.streak_count}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/quests"
                className="block w-full btn-primary text-center"
              >
                Browse Quests
              </a>
              <a
                href="/leaderboard"
                className="block w-full btn-secondary text-center"
              >
                View Leaderboard
              </a>
            </div>
          </div>

          {/* Telegram Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Telegram Bot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${profile.telegram_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>{profile.telegram_id ? 'Connected' : 'Not connected'}</span>
              </div>
              
              {profile.telegram_id ? (
                <div className="space-y-1 text-gray-600">
                  <p>✅ Submit quests via Telegram</p>
                  <p>✅ Get instant notifications</p>
                  <p>✅ Check status anytime</p>
                </div>
              ) : (
                <div className="space-y-1 text-gray-500">
                  <p>• Submit quests via Telegram</p>
                  <p>• Get instant notifications</p>
                  <p>• Check status anytime</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}