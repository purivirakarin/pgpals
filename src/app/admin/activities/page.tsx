'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Filter,
  Search,
  Calendar,
  Download,
  RefreshCw,
  User,
  Target,
  MessageCircle,
  Shield
} from 'lucide-react';
import ActivityFeed from '@/components/ActivityFeed';

const ACTIVITY_TYPES = [
  { value: '', label: 'All Activities' },
  { value: 'user_registered', label: 'User Registrations' },
  { value: 'user_updated', label: 'User Updates' },
  { value: 'submission_created', label: 'New Submissions' },
  { value: 'submission_approved', label: 'Approved Submissions' },
  { value: 'submission_rejected', label: 'Rejected Submissions' },
  { value: 'quest_created', label: 'New Quests' },
  { value: 'quest_updated', label: 'Quest Updates' },
  { value: 'quest_deleted', label: 'Deleted Quests' },
  { value: 'admin_action', label: 'Admin Actions' },
  { value: 'points_awarded', label: 'Points Awarded' }
];

export default function AdminActivitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filterType) params.append('type', filterType);

      const response = await fetch(`/api/activities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchActivities();
  }, [session, status, router, fetchActivities]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.quest_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      new Date(activity.created_at).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesDate;
  });

  const exportActivities = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Actor', 'Description', 'Quest', 'Points Change'].join(','),
      ...filteredActivities.map(activity => [
        new Date(activity.created_at).toISOString(),
        activity.type,
        activity.actor_name || '',
        `"${activity.description.replace(/"/g, '""')}"`,
        activity.quest_title || '',
        activity.points_change || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgpals-activities-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Activity className="w-8 h-8 mr-3 text-blue-600" />
                Activity Log
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor all platform activities and user interactions
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchActivities}
                disabled={loading}
                className="btn-secondary flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={exportActivities}
                className="btn-primary flex items-center"
                disabled={filteredActivities.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                {ACTIVITY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setDateFilter('');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-lg font-semibold text-gray-900">{activities.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Filtered Results</p>
                <p className="text-lg font-semibold text-gray-900">{filteredActivities.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activities.filter(a => 
                    new Date(a.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activities.filter(a => {
                    const activityDate = new Date(a.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return activityDate >= weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        {error ? (
          <div className="card p-6 text-center">
            <div className="text-red-600">
              <p className="font-medium">Error loading activities</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            {filteredActivities.length > 0 ? (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                      {activity.type.includes('user') && <User className="w-4 h-4 text-blue-600" />}
                      {activity.type.includes('quest') && <Target className="w-4 h-4 text-green-600" />}
                      {activity.type.includes('submission') && <MessageCircle className="w-4 h-4 text-orange-600" />}
                      {activity.type.includes('admin') && <Shield className="w-4 h-4 text-purple-600" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          {activity.quest_title && (
                            <p className="text-xs text-gray-500 mt-1">Quest: {activity.quest_title}</p>
                          )}
                          {activity.actor_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              by {activity.actor_name}
                              {activity.actor_telegram && ` (@${activity.actor_telegram})`}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                          {activity.points_change !== 0 && (
                            <p className={`text-xs font-medium mt-1 ${
                              activity.points_change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {activity.points_change > 0 ? '+' : ''}{activity.points_change} pts
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No activities found</p>
                <p className="text-sm">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
