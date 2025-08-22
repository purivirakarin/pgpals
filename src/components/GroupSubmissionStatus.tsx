'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Check, X, AlertCircle, UserCheck, UserX } from 'lucide-react';

interface GroupSubmissionStatusProps {
  questId: number;
  questCategory: 'pair' | 'multiple-pair' | 'bonus';
  onGroupSubmissionChange?: () => void;
}

interface GroupParticipant {
  id: number;
  user_id: number;
  partner_id?: number;
  opted_out: boolean;
  opted_out_at?: string;
  user: {
    id: number;
    name: string;
    telegram_username?: string;
  };
  partner?: {
    id: number;
    name: string;
    telegram_username?: string;
  };
}

interface GroupSubmissionData {
  hasGroupSubmission: boolean;
  quest: {
    category: string;
    title: string;
  };
  groupSubmission?: {
    id: number;
    submitter: {
      id: number;
      name: string;
      telegram_username?: string;
    };
    submission: {
      id: number;
      status: string;
      submitted_at: string;
      points_awarded: number;
    };
    created_at: string;
  };
  participants?: GroupParticipant[];
  currentUserStatus?: {
    isParticipant: boolean;
    optedOut: boolean;
    canOptOut: boolean;
    canOptIn: boolean;
  };
}

const GroupSubmissionStatus: React.FC<GroupSubmissionStatusProps> = ({
  questId,
  questCategory,
  onGroupSubmissionChange
}) => {
  const [data, setData] = useState<GroupSubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/submissions/group-status/${questId}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 400) {
        // Not a multiple-pair task, don't show anything
        setData(null);
      } else {
        throw new Error('Failed to fetch group status');
      }
    } catch (err) {
      console.error('Error fetching group status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group status');
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    if (questCategory === 'multiple-pair') {
      fetchGroupStatus();
    } else {
      setLoading(false);
      setData(null);
    }
  }, [questId, questCategory, fetchGroupStatus]);

  const handleOptAction = async (action: 'opt-in' | 'opt-out') => {
    if (!data?.groupSubmission) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/submissions/group-opt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupSubmissionId: data.groupSubmission.id,
          action
        })
      });

      const result = await response.json();

      if (response.ok) {
        await fetchGroupStatus(); // Refresh the data
        onGroupSubmissionChange?.();
      } else {
        throw new Error(result.error || `Failed to ${action}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ai':
      case 'manual_review':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
      case 'ai_approved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
      case 'ai_rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ai':
      case 'manual_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'ai_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'ai_rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data || questCategory !== 'multiple-pair') {
    return null;
  }

  if (!data.hasGroupSubmission) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Multiple-Pair Task
            </h4>
            <p className="text-sm text-blue-700">
              This task allows group submissions. One pair can submit on behalf of multiple pairs (2-10 people total).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { groupSubmission, participants = [], currentUserStatus } = data;

  if (!groupSubmission) {
    return null;
  }

  const activeParticipants = participants.filter(p => !p.opted_out);
  const optedOutParticipants = participants.filter(p => p.opted_out);

  return (
    <div className="space-y-4">
      {/* Group Submission Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start">
            <Users className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Group Submission
              </h4>
              <p className="text-sm text-gray-600">
                Submitted by <span className="font-medium">{groupSubmission.submitter.name}</span>
                {groupSubmission.submitter.telegram_username && (
                  <span className="text-gray-500"> (@{groupSubmission.submitter.telegram_username})</span>
                )}
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(groupSubmission.submission.status)}`}>
            {getStatusIcon(groupSubmission.submission.status)}
            <span className="ml-1">{formatStatusText(groupSubmission.submission.status)}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          Submitted on {new Date(groupSubmission.submission.submitted_at).toLocaleDateString()}
        </div>

        {groupSubmission.submission.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Approved! +{groupSubmission.submission.points_awarded} points awarded to all participants
              </span>
            </div>
          </div>
        )}

        {/* Current User Actions */}
        {currentUserStatus?.isParticipant && (
          <div className="border-t border-gray-200 pt-3">
            {currentUserStatus.optedOut ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserX className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="text-sm text-orange-800 font-medium">You have opted out</span>
                </div>
                {currentUserStatus.canOptIn && (
                  <button
                    onClick={() => handleOptAction('opt-in')}
                    disabled={actionLoading}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Opt Back In'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800 font-medium">You are included in this group submission</span>
                </div>
                {currentUserStatus.canOptOut && (
                  <button
                    onClick={() => handleOptAction('opt-out')}
                    disabled={actionLoading}
                    className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Opt Out'}
                  </button>
                )}
              </div>
            )}
            {currentUserStatus.optedOut && (
              <p className="text-xs text-gray-600 mt-2">
                Since you opted out, you and your partner need to submit this quest separately to receive points.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-900 mb-3">
          Group Participants ({activeParticipants.length} active, {optedOutParticipants.length} opted out)
        </h5>
        
        <div className="space-y-2">
          {activeParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-white rounded px-3 py-2">
              <div className="flex items-center">
                <UserCheck className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  {participant.user.name}
                  {participant.user.telegram_username && (
                    <span className="text-gray-500 font-normal ml-1">
                      (@{participant.user.telegram_username})
                    </span>
                  )}
                </span>
                {participant.partner && (
                  <span className="text-sm text-gray-600 ml-2">
                    & {participant.partner.name}
                    {participant.partner.telegram_username && (
                      <span className="text-gray-500"> (@{participant.partner.telegram_username})</span>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          ))}
          
          {optedOutParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-orange-50 rounded px-3 py-2">
              <div className="flex items-center">
                <UserX className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {participant.user.name}
                  {participant.user.telegram_username && (
                    <span className="text-gray-500 font-normal ml-1">
                      (@{participant.user.telegram_username})
                    </span>
                  )}
                </span>
                {participant.partner && (
                  <span className="text-sm text-gray-600 ml-2">
                    & {participant.partner.name}
                    {participant.partner.telegram_username && (
                      <span className="text-gray-500"> (@{participant.partner.telegram_username})</span>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-orange-600 font-medium">Opted Out</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSubmissionStatus;
