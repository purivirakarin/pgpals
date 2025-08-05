'use client';

import { Quest } from '@/types';
import { Target, Calendar, Award, Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { getNumericId } from '@/lib/questId';

interface QuestCardProps {
  quest: Quest;
  showActions?: boolean;
  onEdit?: (quest: Quest) => void;
  onDelete?: (questId: number) => void;
  userSubmission?: any;
  showStatusBadge?: boolean; // New prop to control status badge visibility
}

export default function QuestCard({ 
  quest, 
  showActions = false, 
  onEdit, 
  onDelete,
  userSubmission,
  showStatusBadge = false
}: QuestCardProps) {
  const [copied, setCopied] = useState(false);

  // Generate a consistent numeric ID based on quest.id
  const numericId = getNumericId(quest.id);

  const copySubmitCommand = async () => {
    const command = `/submit ${numericId}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'health':
        return '🏃‍♂️';
      case 'education':
        return '📚';
      case 'outdoor':
        return '🌲';
      case 'creative':
        return '🎨';
      case 'social':
        return '👥';
      default:
        return '🎯';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatus = () => {
    if (!userSubmission) return null;
    
    const statusConfig = {
      'pending_ai': {
        style: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        text: 'Pending Review',
        icon: '⏳',
        tooltip: undefined
      },
      'ai_approved': {
        style: 'bg-green-100 text-green-700 border border-green-200',
        text: 'Completed',
        icon: '✅',
        tooltip: undefined
      },
      'ai_rejected': {
        style: 'bg-red-100 text-red-700 border border-red-200',
        text: 'Rejected',
        icon: '❌',
        tooltip: 'You can resubmit this quest. Make sure to follow the requirements!'
      },
      'manual_review': {
        style: 'bg-blue-100 text-blue-700 border border-blue-200',
        text: 'Pending Review',
        icon: '👁️',
        tooltip: undefined
      },
      'approved': {
        style: 'bg-green-100 text-green-700 border border-green-200',
        text: 'Completed',
        icon: '✅',
        tooltip: undefined
      },
      'rejected': {
        style: 'bg-red-100 text-red-700 border border-red-200',
        text: 'Rejected',
        icon: '❌',
        tooltip: 'You can resubmit this quest. Make sure to follow the requirements!'
      }
    };

    const config = statusConfig[userSubmission.status as keyof typeof statusConfig];
    if (!config) return null;

    const isRejected = userSubmission.status === 'rejected' || userSubmission.status === 'ai_rejected';

    return (
      <div className="relative group">
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.style} ${isRejected ? 'cursor-help' : ''}`}>
          <span className="mr-1">{config.icon}</span>
          {config.text}
        </div>
        {isRejected && config.tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {config.tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <span className="text-2xl">{getCategoryIcon(quest.category)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
              {quest.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {quest.category}
              </span>
              {showStatusBadge && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(quest.status)}`}>
                  {quest.status}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
            <Award className="w-4 h-4 mr-1" />
            {quest.points}
          </div>
          {userSubmission && (
            <div className="text-right">
              {getSubmissionStatus()}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {quest.description && (
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
          {quest.description}
        </p>
      )}

      {/* Requirements */}
      {quest.requirements && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-1 text-primary-500" />
            Requirements:
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">{quest.requirements}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        {/* Date Information - Flexible Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {/* Created Date */}
          <div className="flex items-center text-gray-500">
            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>Created {new Date(quest.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit' 
            })}</span>
          </div>

          {/* Expires Date */}
          {quest.expires_at && (
            <div className={`flex items-center font-medium ${
              new Date(quest.expires_at) < new Date() 
                ? 'text-red-600' 
                : new Date(quest.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`}>
              <span className="mr-1 flex-shrink-0">🕐</span>
              <span>
                {(() => {
                  const now = new Date();
                  const expireDate = new Date(quest.expires_at);
                  const diffMs = expireDate.getTime() - now.getTime();
                  
                  if (diffMs <= 0) {
                    return 'Expired';
                  }
                  
                  const diffMinutes = Math.floor(diffMs / (1000 * 60));
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  if (diffDays > 0) {
                    return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                  } else if (diffHours > 0) {
                    return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                  } else {
                    return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
                  }
                })()}
              </span>
            </div>
          )}

          {/* Submission Date */}
          {userSubmission && userSubmission.created_at && (
            <div className="flex items-center text-gray-500">
              <span className="mr-1 flex-shrink-0">📝</span>
              <span>Submitted {new Date(userSubmission.created_at).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
              })}</span>
            </div>
          )}
          
          {/* Approved Date */}
          {userSubmission && (userSubmission.status === 'approved' || userSubmission.status === 'ai_approved') && userSubmission.updated_at && (
            <div className="flex items-center text-green-600 font-medium">
              <span className="mr-1 flex-shrink-0">✅</span>
              <span>Approved {new Date(userSubmission.updated_at).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
              })}</span>
            </div>
          )}
        </div>

        {/* Copy Command - Full width below */}
        {!userSubmission && quest.status === 'active' && (
          <div className="w-full">
            <div className="relative group w-full max-w-xs">
              <button
                onClick={copySubmitCommand}
                className="w-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200 transition-colors cursor-pointer"
                title={`Click to copy: /submit ${numericId}`}
              >
                <span className="mr-2">📱</span>
                <code className="font-mono">/submit {numericId}</code>
                <span className="ml-2">
                  {copied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </span>
              </button>
              
              {/* Tooltip showing full command */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <code>/submit {numericId}</code>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}

        {/* Copy Command for Rejected Quests - Show copy command again */}
        {userSubmission && (userSubmission.status === 'rejected' || userSubmission.status === 'ai_rejected') && quest.status === 'active' && (
          <div className="w-full">
            <div className="relative group w-full max-w-xs">
              <button
                onClick={copySubmitCommand}
                className="w-full flex items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-xs font-medium border border-orange-200 transition-colors cursor-pointer"
                title={`Click to copy: /submit ${numericId} - Resubmit quest`}
              >
                <span className="mr-2">🔄</span>
                <code className="font-mono">/submit {numericId}</code>
                <span className="ml-2">
                  {copied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </span>
              </button>
              
              {/* Tooltip showing resubmit command */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <code>/submit {numericId}</code> - Resubmit quest
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-end space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(quest)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Edit
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(quest.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
