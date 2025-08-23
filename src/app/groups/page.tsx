'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Copy, Check, User, Search } from 'lucide-react';

interface GroupInfo {
  group_code: string;
  group_name: string;
  member_count: number;
  members: string;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchGroups();
  }, [session, status, router]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Call the database function via RPC
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const copyGroupCode = async (groupCode: string) => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(groupCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy group code:', err);
    }
  };

  const copyExampleCommand = async (groupCode1: string, groupCode2?: string) => {
    const example = groupCode2 
      ? `/submit 1 group:${groupCode1},${groupCode2}`
      : `/submit 1 group:${groupCode1}`;
    
    try {
      await navigator.clipboard.writeText(example);
      setCopiedCode(example);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy example:', err);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.group_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.members.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Users className="w-8 h-8 text-primary-600 animate-pulse mx-auto mb-4" />
              <p className="text-gray-600">Loading groups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Groups</h3>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={fetchGroups}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Partner Groups</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View all partner groups and their codes for group submissions
            </p>
          </div>

          {/* How to use info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              How to Use Group Codes
            </h2>
            <div className="space-y-2 text-blue-800">
              <p>• Use group codes for multiple-pair quest submissions via Telegram</p>
              <p>• Format: <code className="bg-blue-100 px-2 py-1 rounded font-mono text-sm">/submit [quest_id] group:GRP002</code></p>
              <p>• Your group is automatically included - just specify other groups</p>
              <p>• You need at least 1 other group (4+ people total) for group submissions</p>
              <p>• Copy group codes below to use in your submissions</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No matching groups found' : 'No groups available'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Contact an admin to create partner groups'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600">{filteredGroups.length}</div>
                  <div className="text-gray-600">Active Groups</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{filteredGroups.length * 2}</div>
                  <div className="text-gray-600">Total Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.floor(filteredGroups.length / 2)}+
                  </div>
                  <div className="text-gray-600">Possible 4+ Groups</div>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <div key={group.group_code} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.group_code}</h3>
                        <p className="text-sm text-gray-500">{group.member_count} members</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyGroupCode(group.group_code)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy group code"
                    >
                      {copiedCode === group.group_code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Members:</p>
                    <p className="text-sm text-gray-600">{group.members}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Example Usage:</span>
                      <button
                        onClick={() => copyExampleCommand(group.group_code)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Copy example
                      </button>
                    </div>
                    <code className="text-xs bg-white px-2 py-1 rounded border block">
                      /submit 1 group:{group.group_code}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Copy Examples */}
            {filteredGroups.length >= 2 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Copy className="w-5 h-5 mr-2 text-primary-500" />
                  Quick Copy Examples
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Single Other Group:</span>
                      <button
                        onClick={() => copyExampleCommand(filteredGroups[1].group_code)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        {copiedCode === `/submit 1 group:${filteredGroups[1].group_code}` ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-sm bg-white px-3 py-2 rounded border block">
                      /submit 1 group:{filteredGroups[1].group_code}
                    </code>
                  </div>

                  {filteredGroups.length >= 3 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Multiple Other Groups:</span>
                        <button
                          onClick={() => copyExampleCommand('', filteredGroups[1].group_code + ',' + filteredGroups[2].group_code)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </button>
                      </div>
                      <code className="text-sm bg-white px-3 py-2 rounded border block">
                        /submit 1 group:{filteredGroups[1].group_code},{filteredGroups[2].group_code}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-6">
            <Link
              href="/quests?category=multiple-pair"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              Browse Multiple-Pair Quests
            </Link>
            <a
              href="/help"
              className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              Help & Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}