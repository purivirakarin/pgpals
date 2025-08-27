'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Target, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Award,
  Calendar,
  MessageCircle,
  Shield,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import Dropdown from '@/components/Dropdown';

interface Activity {
  id: string;
  type: string;
  description: string;
  points_change: number;
  metadata: any;
  created_at: string;
  actor_name: string;
  actor_telegram: string;
  target_user_name: string;
  target_user_telegram: string;
  quest_title: string;
  quest_category: string;
  quest_points: number;
  submission_status: string;
}

interface ActivityFeedProps {
  userId?: string; // If provided, shows activities for specific user
  limit?: number;
  showHeader?: boolean;
  className?: string;
  maxHeight?: string; // For scrollable container
  enableSearch?: boolean; // Enable search functionality
  enablePagination?: boolean; // Enable pagination instead of load more
  showRefresh?: boolean; // Show refresh button
}

export default function ActivityFeed({ 
  userId, 
  limit = 5, // Changed default from 20 to 5
  showHeader = true, 
  className = '',
  maxHeight = '400px', // Default max height for scrollable area
  enableSearch = false,
  enablePagination = false,
  showRefresh = false
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const activityTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'user_registered', label: 'User Registered' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'partnership_created', label: 'Partnership Created' },
    { value: 'quest_submitted,pair_quest_submitted,group_quest_submitted', label: 'Quest Submitted' },
    { value: 'quest_approved,quest_ai_approved', label: 'Quest Approved' },
    { value: 'quest_rejected,quest_ai_rejected', label: 'Quest Rejected' },
    { value: 'quest_created', label: 'Quest Created' },
    { value: 'quest_updated', label: 'Quest Updated' }
  ];

  const fetchActivities = useCallback(async (isLoadMore = false, resetPage = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        if (resetPage) {
          setCurrentPage(1);
          setOffset(0);
        }
      }
      setError(null);
      
      // Limit to top 50 activities maximum
      const maxActivities = 50;
      const currentOffset = isLoadMore ? offset : (resetPage ? 0 : (currentPage - 1) * limit);
      
      // Don't fetch beyond 50 activities
      if (currentOffset >= maxActivities) {
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      const params = new URLSearchParams();
      params.append('limit', Math.min(limit, maxActivities - currentOffset).toString());
      params.append('offset', currentOffset.toString());
      if (userId) params.append('user_id', userId);
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/activities?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 500 && errorData.error?.includes('does not exist')) {
          throw new Error('Activity system not yet configured. Please run the database migration.');
        }
        throw new Error(errorData.error || 'Failed to fetch activities');
      }

      const data = await response.json();
      const activitiesData = data.activities || data;
      const totalFromServer = Math.min(data.total || data.length, maxActivities);
      
      if (enablePagination) {
        setActivities(activitiesData);
        setTotalCount(totalFromServer);
        setHasMore((currentPage * limit) < totalFromServer);
      } else {
        if (isLoadMore) {
          setActivities(prev => [...prev, ...activitiesData]);
          setOffset(prev => prev + limit);
        } else {
          setActivities(activitiesData);
          setOffset(limit);
        }
        // If we got fewer activities than requested or reached max, we've reached the end
        setHasMore(activitiesData.length === limit && (offset + limit) < maxActivities);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, offset, userId, searchTerm, typeFilter, currentPage, enablePagination]);

  useEffect(() => {
    fetchActivities(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]); // Removed fetchActivities from deps to avoid infinite loop

  // Handle search with debounce
  useEffect(() => {
    if (!enableSearch) return;
    
    const timer = setTimeout(() => {
      fetchActivities(false, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, typeFilter, fetchActivities, enableSearch]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Force re-fetch when page changes
    setTimeout(() => fetchActivities(false, false), 0);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'user_updated':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'partnership_created':
        return <User className="w-4 h-4 text-green-600" />;
      case 'quest_submitted':
      case 'pair_quest_submitted':
      case 'group_quest_submitted':
        return <MessageCircle className="w-4 h-4 text-orange-600" />;
      case 'quest_approved':
      case 'quest_ai_approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'quest_rejected':
      case 'quest_ai_rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'quest_pending_ai':
      case 'quest_manual_review':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'quest_created':
        return <Plus className="w-4 h-4 text-blue-600" />;
      case 'quest_updated':
        return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'quest_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'points_awarded':
        return <Award className="w-4 h-4 text-gold-600" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'quest_approved':
      case 'quest_ai_approved':
      case 'points_awarded':
      case 'partnership_created':
        return 'bg-green-100 text-green-800';
      case 'quest_rejected':
      case 'quest_ai_rejected':
      case 'quest_deleted':
        return 'bg-red-100 text-red-800';
      case 'quest_submitted':
      case 'pair_quest_submitted':
      case 'group_quest_submitted':
        return 'bg-orange-100 text-orange-800';
      case 'quest_pending_ai':
      case 'quest_manual_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'quest_created':
      case 'user_registered':
        return 'bg-blue-100 text-blue-800';
      case 'quest_updated':
      case 'user_updated':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin_action':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const normalizeActivityTypeDisplay = (type: string) => {
    // Treat AI actions the same as manual actions in the UI
    const normalizedType = type
      .replace('quest_ai_approved', 'quest_approved')
      .replace('quest_ai_rejected', 'quest_rejected')
      .replace('quest_pending_ai', 'quest_pending_review')
      .replace('quest_manual_review', 'quest_pending_review')
      .replace('pair_quest_submitted', 'quest_submitted')
      .replace('group_quest_submitted', 'quest_submitted');
    
    // Convert to human readable format
    return normalizedType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  const formatPointsChange = (points: number) => {
    if (points > 0) return `+${points} pts`;
    if (points < 0) return `${points} pts`;
    return '';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        )}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        )}
        <div className="text-center py-8 text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Error loading activities: {error}</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0 && !loading) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              {!userId && (
                <p className="text-sm text-gray-500">Showing latest 50 activities</p>
              )}
            </div>
            {showRefresh && (
              <button
                onClick={() => fetchActivities(false, true)}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Search and Filter Controls - Always show when enableSearch is true */}
        {enableSearch && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="relative">
                <Dropdown
                  options={activityTypeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  placeholder="Filter by type"
                  icon={<Filter className="w-4 h-4" />}
                  className="min-w-[160px]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">
              {searchTerm || typeFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Activity will appear here as users interact with the platform.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            {!userId && (
              <p className="text-sm text-gray-500">Showing latest 50 activities</p>
            )}
          </div>
          {showRefresh && (
            <button
              onClick={() => fetchActivities(false, true)}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Search and Filter Controls */}
      {enableSearch && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="relative">
              <Dropdown
                options={activityTypeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="Filter by type"
                icon={<Filter className="w-4 h-4" />}
                className="min-w-[160px]"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Activities List */}
      <div 
        className={`border border-gray-200 rounded-lg bg-gray-50 ${!enablePagination ? 'overflow-y-auto' : ''}`}
        style={!enablePagination ? { maxHeight } : {}}
      >
        <div className="space-y-3 p-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  
                  {/* Quest info */}
                  {activity.quest_title && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        <Target className="w-3 h-3 mr-1" />
                        {activity.quest_title}
                      </span>
                      {activity.quest_category && (
                        <span className="ml-2 text-xs text-gray-500">
                          in {activity.quest_category}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Points change */}
                  {activity.points_change !== 0 && (
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        activity.points_change > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <Award className="w-3 h-3 mr-1" />
                        {formatPointsChange(activity.points_change)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {/* Activity type badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getActivityBadgeColor(activity.type)}`}>
                    {normalizeActivityTypeDisplay(activity.type)}
                  </span>
                  
                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatTimeAgo(activity.created_at)}
                  </span>
                </div>
              </div>
              
              {/* Actor info */}
              {activity.actor_name && (
                <div className="mt-2 text-xs text-gray-500">
                  by {activity.actor_name}
                  {activity.actor_telegram && ` (@${activity.actor_telegram})`}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>
      
      {/* Pagination or Load More */}
      {enablePagination ? (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
            <span className="text-gray-500 ml-2">(top 50 activities)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      ) : (
        hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchActivities(true)}
              disabled={loadingMore}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )
      )}
    </div>
  );
}
