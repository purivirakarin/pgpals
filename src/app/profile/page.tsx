'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Users, 
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
  Activity,
  MessageCircle
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
      
      // Pre-fill Telegram ID if already linked
      if (data.telegram_id) {
        setTelegramId(data.telegram_id);
        // Telegram username is read-only, fetched automatically
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
          telegram_id: telegramId
          // Don't send telegram_username, let the system fetch it automatically
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Telegram account');
      }

      setProfile(data.user);
      await update(); // Update session
      setError(null);
      // Note: Telegram username will be fetched automatically by the system
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
      // Telegram username is managed automatically by the system
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

// Calculate completed quests from all sources (self, partner, group) - avoid duplicates by quest_id
const completedQuestIds = new Set();
const completedSubmissions = profile.submissions?.filter(s => {
  const isCompleted = s.status === 'approved' || s.status === 'ai_approved';
  if (isCompleted && !completedQuestIds.has(s.quest_id || s.quest?.id)) {
    completedQuestIds.add(s.quest_id || s.quest?.id);
    return true;
  }
  return false;
}) || [];

const completedQuests = completedSubmissions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
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
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-primary-600 mr-2" />
                    <span className="text-primary-800 font-medium">You are partnered with:</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-primary-700 font-semibold">
                      {profile.partner_name}
                      {profile.partner_telegram && (
                        <span className="text-primary-600 font-normal ml-2">(@{profile.partner_telegram})</span>
                      )}
                    </p>
                    <p className="text-primary-600 text-xs mt-2 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      You share points and leaderboard ranking with your partner
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-accent-600 mr-2" />
                    <span className="text-accent-800 font-medium">No Partnership Assigned</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-accent-700">
                      You are currently not partnered with anyone.
                    </p>
                    <p className="text-accent-700">
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
              <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                <span className="text-primary-800 text-sm">{error}</span>
              </div>
            )}

            {profile.telegram_id ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-primary-600 mr-2" />
                    <span className="text-primary-800 font-medium">Telegram Account Linked</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-primary-700">Telegram ID: {profile.telegram_id}</span>
                      <button
                        onClick={() => copyToClipboard(profile.telegram_id!)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {profile.telegram_username && (
                      <p className="text-primary-700">Username: @{profile.telegram_username}</p>
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
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <h3 className="font-medium text-primary-900 mb-2">How to link your Telegram account:</h3>
                  <ol className="text-sm text-primary-800 space-y-1">
                    <li>1. <a href="https://t.me/pgpals_quest_bot" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 underline">Open our Telegram bot</a></li>
                    <li>2. Send <code className="bg-primary-100 px-1 rounded">/start</code> to get your Telegram ID</li>
                    <li>3. Copy the Telegram ID from the bot&apos;s message</li>
                    <li>4. Paste it in the field below and click &quot;Link Account&quot;</li>
                  </ol>
                  <div className="mt-2 p-2 bg-primary-100 rounded text-xs text-primary-700">
                    <strong>Note:</strong> You must create your website account first before linking Telegram! Your Telegram username is managed automatically and cannot be manually edited.
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
                      Send /start to our bot to get your Telegram ID. Username is managed automatically.
                    </p>
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

          {/* Completed Quests */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Trophy className="w-5 h-5 text-primary-500 mr-2" />
              Completed Quests ({completedQuests})
            </h2>
            
            {completedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No completed quests yet</p>
                <a href="/quests" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
                  Browse Available Quests →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {completedSubmissions.slice(0, 10).map((submission) => {
                  const quest = submission.quest || {};
                  const getSubmitterIcon = (submittedBy: string) => {
                    switch (submittedBy) {
                      case 'self': return <User className="w-4 h-4 text-primary-500" />;
                      case 'partner': return <Users className="w-4 h-4 text-accent-500" />;
                      case 'group': return <Users className="w-4 h-4 text-purple-500" />;
                      default: return <Target className="w-4 h-4 text-gray-400" />;
                    }
                  };

                  const getSubmitterText = (submittedBy: string, submitterName: string) => {
                    switch (submittedBy) {
                      case 'self': return 'You';
                      case 'partner': return `Partner: ${submitterName}`;
                      case 'group': return `Group: ${submitterName}`;
                      default: return submitterName || 'Unknown';
                    }
                  };

                  return (
                    <div key={`${submission.id}-${submission.quest_id}`} className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {quest.title || 'Unknown Quest'}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {quest.category} • +{submission.points_awarded} points
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            {getSubmitterIcon(submission.submitted_by)}
                            <span className="ml-1.5">
                              Submitted by {getSubmitterText(submission.submitted_by, submission.submitter_name)}
                            </span>
                          </div>
                          <span>
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {completedSubmissions.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      Showing 10 of {completedSubmissions.length} completed quests
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <ActivityFeed 
              userId={session?.user?.id} 
              limit={10} 
              enableSearch={false} 
              enablePagination={true} 
              showRefresh={true}
              maxHeight="600px"
              showHeader={true}
            />
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
                  <Trophy className="w-5 h-5 text-primary-500 mr-2" />
                  <span className="text-gray-600">Current Rank</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">
                  #{userStats?.current_rank || '-'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-primary-500 mr-2" />
                  <span className="text-gray-600">Total Points</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">{profile.total_points}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-primary-500 mr-2" />
                  <span className="text-gray-600">Completed Quests</span>
                </div>
                <span className="text-lg font-semibold">{completedQuests}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-primary-500 mr-2" />
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
                <div className={`w-3 h-3 rounded-full mr-2 ${profile.telegram_id ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                <span>{profile.telegram_id ? 'Connected' : 'Not connected'}</span>
              </div>
              
              {profile.telegram_id ? (
                <div className="space-y-1 text-gray-600">
                  <p className="flex items-center"><CheckCircle className="w-3 h-3 text-primary-500 mr-2" /> Submit quests via Telegram</p>
                  <p className="flex items-center"><CheckCircle className="w-3 h-3 text-primary-500 mr-2" /> Get instant notifications</p>
                  <p className="flex items-center"><CheckCircle className="w-3 h-3 text-primary-500 mr-2" /> Check status anytime</p>
                </div>
              ) : (
                <div className="space-y-1 text-gray-500">
                  <p>• Submit quests via Telegram</p>
                  <p>• Get instant notifications</p>
                  <p>• Check status anytime</p>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <a 
                  href="https://t.me/pgpals_quest_bot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Open Telegram Bot
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}