'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BroadcastStats {
  sent: number;
  failed: number;
  total: number;
}

interface TelegramUser {
  id: number;
  name: string;
  telegram_username: string | null;
}

export default function AdminBroadcastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastStats | null>(null);
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchTelegramUsers();
  }, [session, status, router]);

  const fetchTelegramUsers = async () => {
    try {
      const response = await fetch('/api/admin/broadcast');
      if (response.ok) {
        const data = await response.json();
        setTelegramUsers(data.users);
        setTotalUsers(data.total_telegram_users);
      }
    } catch (error) {
      console.error('Failed to fetch telegram users:', error);
    }
  };

  const handleBroadcast = async () => {
    if (!message.trim()) {
      alert('Please enter a message to broadcast');
      return;
    }

    if (message.length > 4000) {
      alert('Message is too long. Maximum 4000 characters allowed.');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to send this broadcast to ${totalUsers} Telegram users?\n\n` +
      `Preview: ${message.slice(0, 200)}${message.length > 200 ? '...' : ''}`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setBroadcastResult(null);

    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setBroadcastResult(data.stats);
        setMessage('');
        alert(`Broadcast sent successfully!\n\nSent: ${data.stats.sent}\nFailed: ${data.stats.failed}\nTotal: ${data.stats.total}`);
      } else {
        alert(`Failed to send broadcast: ${data.error}`);
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      alert('Failed to send broadcast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Broadcast</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send messages to all users with linked Telegram accounts
            </p>
          </div>

          <div className="p-6">
            {/* Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">📊 Broadcast Reach</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                  <div className="text-sm text-blue-700">Total Telegram Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {telegramUsers.filter(u => u.telegram_username).length}
                  </div>
                  <div className="text-sm text-green-700">With Usernames</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {telegramUsers.filter(u => !u.telegram_username).length}
                  </div>
                  <div className="text-sm text-purple-700">Private Accounts</div>
                </div>
              </div>
            </div>

            {/* Message Composer */}
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Broadcast Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your broadcast message here... (supports basic Markdown formatting)"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={4000}
                />
                <div className="mt-1 text-right text-sm text-gray-500">
                  {message.length}/4000 characters
                </div>
              </div>

              {/* Preview */}
              {message.trim() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">📱 Telegram Preview:</h3>
                  <div className="bg-white border rounded p-3 text-sm">
                    <div className="font-bold text-blue-600 mb-1">📢 Admin Broadcast</div>
                    <div className="whitespace-pre-wrap">{message}</div>
                    <div className="border-t mt-2 pt-2 text-xs text-gray-500">
                      📡 Sent by: {session.user.name}<br/>
                      ⏰ {new Date().toLocaleString('en-US', { 
                        timeZone: 'Asia/Singapore',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} SGT
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <div className="flex justify-between items-center">
                <div>
                  {broadcastResult && (
                    <div className="text-sm">
                      <span className="text-green-600">✅ {broadcastResult.sent} sent</span>
                      {broadcastResult.failed > 0 && (
                        <span className="text-red-600 ml-4">❌ {broadcastResult.failed} failed</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBroadcast}
                  disabled={isLoading || !message.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      📢 Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">⚠️ Important Guidelines</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use broadcasts sparingly to avoid user annoyance</li>
                <li>• Messages support basic Markdown formatting (*bold*, _italic_)</li>
                <li>• Failed deliveries are usually due to users blocking the bot</li>
                <li>• All broadcasts are logged in the activities table</li>
                <li>• Rate limiting: 30 messages per second, 1 second between batches</li>
              </ul>
            </div>

            {/* Recent Users List */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">👥 Recent Telegram Users</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telegram</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {telegramUsers.slice(0, 20).map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {user.telegram_username ? `@${user.telegram_username}` : 'Private account'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {telegramUsers.length > 20 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                    ... and {telegramUsers.length - 20} more users
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
