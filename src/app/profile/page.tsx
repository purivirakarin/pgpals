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
import Image from 'next/image'
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
  faculty?: string;
  major?: string;
  profile_image_url?: string;
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
    if (!session) return;
    fetchProfile();
  }, [session, status, fetchProfile]);

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
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {profile.profile_image_url ? (
              <Image src={profile.profile_image_url} alt={profile.name} fill sizes="64px" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            {profile.telegram_username && (
              <p className="text-gray-600">@{profile.telegram_username}</p>
            )}
          </div>
        </div>
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

          {/* Telegram section simplified: display-only */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-2">Telegram</h2>
            <div className="text-gray-700">
              {profile.telegram_username ? (
                <p>Username: @{profile.telegram_username}</p>
              ) : (
                <p className="text-gray-500">No Telegram username available</p>
              )}
            </div>
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