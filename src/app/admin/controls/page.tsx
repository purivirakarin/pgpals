'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Settings,
  ToggleLeft,
  ToggleRight,
  Loader,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save
} from 'lucide-react';

interface SystemSettings {
  submissions_enabled: {
    value: boolean;
    description: string;
    updated_at: string;
  };
  leaderboard_visible: {
    value: boolean;
    description: string;
    updated_at: string;
  };
}

export default function AdminControlsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      setUpdating(key);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: key,
          setting_value: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }

      // Update local state
      setSettings(prev => prev ? {
        ...prev,
        [key]: {
          ...(prev[key as keyof SystemSettings] || {}),
          value: value,
          updated_at: new Date().toISOString()
        }
      } : null);

      setSuccess(`${key.replace('_', ' ')} updated successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    } finally {
      setUpdating(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
              <div className="h-8 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-amber-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-lg text-gray-600">
            Manage global competition settings and participant access
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Submissions Control */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Settings className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Submission Control
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {settings?.submissions_enabled?.description || 'Control whether participants can submit new quest entries'}
                </p>
                <div className="text-sm text-gray-500">
                  Current status: {settings?.submissions_enabled?.value ? (
                    <span className="text-green-600 font-medium">Enabled</span>
                  ) : (
                    <span className="text-red-600 font-medium">Disabled</span>
                  )}
                  {settings?.submissions_enabled?.updated_at && (
                    <span className="ml-2">
                      • Last updated: {new Date(settings.submissions_enabled.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-6">
                <button
                  onClick={() => updateSetting('submissions_enabled', !settings?.submissions_enabled?.value)}
                  disabled={updating === 'submissions_enabled'}
                  className={`
                    flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${settings?.submissions_enabled?.value
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {updating === 'submissions_enabled' ? (
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                  ) : settings?.submissions_enabled?.value ? (
                    <ToggleRight className="w-5 h-5 mr-2" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 mr-2" />
                  )}
                  {updating === 'submissions_enabled' 
                    ? 'Updating...' 
                    : settings?.submissions_enabled?.value 
                      ? 'Disable Submissions' 
                      : 'Enable Submissions'
                  }
                </button>
              </div>
            </div>

            {!settings?.submissions_enabled?.value && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 text-sm font-medium">
                    Submissions are currently disabled - participants cannot submit new quest entries
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Visibility Control */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Settings className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Leaderboard Visibility
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {settings?.leaderboard_visible?.description || 'Control whether participants can view the leaderboard rankings'}
                </p>
                <div className="text-sm text-gray-500">
                  Current status: {settings?.leaderboard_visible?.value ? (
                    <span className="text-green-600 font-medium">Visible</span>
                  ) : (
                    <span className="text-red-600 font-medium">Hidden</span>
                  )}
                  {settings?.leaderboard_visible?.updated_at && (
                    <span className="ml-2">
                      • Last updated: {new Date(settings.leaderboard_visible.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-6">
                <button
                  onClick={() => updateSetting('leaderboard_visible', !settings?.leaderboard_visible?.value)}
                  disabled={updating === 'leaderboard_visible'}
                  className={`
                    flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${settings?.leaderboard_visible?.value
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {updating === 'leaderboard_visible' ? (
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                  ) : settings?.leaderboard_visible?.value ? (
                    <ToggleRight className="w-5 h-5 mr-2" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 mr-2" />
                  )}
                  {updating === 'leaderboard_visible' 
                    ? 'Updating...' 
                    : settings?.leaderboard_visible?.value 
                      ? 'Hide Leaderboard' 
                      : 'Show Leaderboard'
                  }
                </button>
              </div>
            </div>

            {!settings?.leaderboard_visible?.value && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 text-sm font-medium">
                    Leaderboard is currently hidden - participants cannot view rankings
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Settings className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Setting Information
              </h3>
              <div className="text-blue-800 space-y-2">
                <p>• <strong>Submission Control:</strong> When disabled, all participants are prevented from submitting new quest entries via Telegram or web app</p>
                <p>• <strong>Leaderboard Visibility:</strong> When hidden, participants cannot view rankings, but admins retain full access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
