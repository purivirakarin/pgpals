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
  TrendingUp
} from 'lucide-react';

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
}

export default function ActivityFeed({ 
  userId, 
  limit = 5, // Changed default from 20 to 5
  showHeader = true, 
  className = '',
  maxHeight = '400px' // Default max height for scrollable area
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (userId) params.append('user_id', userId);

      const response = await fetch(`/api/activities?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 500 && errorData.error?.includes('does not exist')) {
          throw new Error('Activity system not yet configured. Please run the database migration.');
        }
        throw new Error(errorData.error || 'Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'user_updated':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'submission_created':
        return <MessageCircle className="w-4 h-4 text-orange-600" />;
      case 'submission_approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'submission_rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
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
      case 'submission_approved':
      case 'points_awarded':
        return 'bg-green-100 text-green-800';
      case 'submission_rejected':
      case 'quest_deleted':
        return 'bg-red-100 text-red-800';
      case 'submission_created':
        return 'bg-orange-100 text-orange-800';
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

  if (activities.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        )}
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
          <p className="text-sm">Activity will appear here as users interact with the platform.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      )}
      
      {/* Scrollable container with fixed max height */}
      <div 
        className="overflow-y-auto border border-gray-200 rounded-lg bg-gray-50"
        style={{ maxHeight }}
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
                    {activity.type.replace('_', ' ')}
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
      
      {/* Load more button - now outside scrollable area */}
      {activities.length >= limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              // TODO: Implement pagination
              console.log('Load more activities');
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
