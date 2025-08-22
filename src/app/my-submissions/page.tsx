'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Submission, Quest } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar,
  Target,
  FileText,
  Loader,
  AlertCircle,
  User,
  Trash2
} from 'lucide-react';

interface SubmissionWithQuest extends Submission {
  quest: Quest;
}

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionWithQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchSubmissions();
  }, [session, status, router]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submissions');
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId: number) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(submissionId);
      const response = await fetch(`/api/admin/submissions/${submissionId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete submission');
      }

      // Remove submission from local state
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete submission');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ai':
      case 'manual_review':
        return <Clock className="w-4 h-4 text-primary-600" />;
      case 'ai_approved':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-primary-700" />;
      case 'ai_rejected':
      case 'rejected':
        return <XCircle className="w-4 h-4 text-muted-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-accent-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ai':
      case 'manual_review':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'ai_approved':
      case 'approved':
        return 'bg-primary-50 text-primary-900 border-primary-200';
      case 'ai_rejected':
      case 'rejected':
        return 'bg-muted-100 text-muted-800 border-muted-200';
      default:
        return 'bg-accent-100 text-accent-800 border-accent-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_ai':
        return 'Pending AI Review';
      case 'ai_approved':
        return 'AI Approved';
      case 'ai_rejected':
        return 'AI Rejected';
      case 'manual_review':
        return 'Under Manual Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your submissions...</p>
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
            <XCircle className="w-16 h-16 text-muted-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Submissions</h3>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={fetchSubmissions}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl mb-4 sm:mb-6">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            My Submissions
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Track the status of all your quest submissions and see your progress.
          </p>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No submissions yet</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
              Start completing quests to see your submissions here!
            </p>
            <a
              href="/quests"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm w-full max-w-xs sm:w-auto"
            >
              <Target className="w-5 h-5 mr-2" />
              Browse Quests
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                {/* Mobile Layout: Status and Delete at top */}
                <div className="flex sm:hidden items-center justify-between mb-4">
                  <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span className="ml-2">{getStatusText(submission.status)}</span>
                  </div>
                  
                  <button
                    onClick={() => deleteSubmission(submission.id)}
                    disabled={deleteLoading === submission.id}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-600 bg-muted-50 border border-muted-200 rounded-lg hover:bg-muted-100 hover:text-muted-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete submission"
                  >
                    {deleteLoading === submission.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="ml-1.5 hidden xs:inline">Delete</span>
                  </button>
                </div>

                {/* Desktop Layout: Original structure */}
                <div className="hidden sm:flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {submission.quest?.title || 'Unknown Quest'}
                    </h3>
                    <p className="text-gray-600 mb-3">{submission.quest?.description || ''}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="inline-flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {submission.quest?.category || 'Unknown'}
                      </span>
                      <span className="inline-flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Submitted {formatDate(submission.submitted_at)}
                      </span>
                      {submission.points_awarded && (
                        <span className="inline-flex items-center font-medium text-primary-600">
                          +{submission.points_awarded} points
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-2">{getStatusText(submission.status)}</span>
                    </div>
                    
                    <button
                      onClick={() => deleteSubmission(submission.id)}
                      disabled={deleteLoading === submission.id}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-600 bg-muted-50 border border-muted-200 rounded-lg hover:bg-muted-100 hover:text-muted-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete submission"
                    >
                      {deleteLoading === submission.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="ml-1">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Content: Title, Description, and Metadata */}
                <div className="sm:hidden">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {submission.quest?.title || 'Unknown Quest'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{submission.quest?.description || ''}</p>
                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center">
                      <Target className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{submission.quest?.category || 'Unknown'}</span>
                    </span>
                    <span className="inline-flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span>Submitted {formatDate(submission.submitted_at)}</span>
                    </span>
                    {submission.points_awarded && (
                      <span className="inline-flex items-center font-medium text-primary-600">
                        <span className="text-primary-500 mr-1">+</span>
                        {submission.points_awarded} points
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional info based on status */}
                {submission.status === 'rejected' && submission.admin_feedback && (
                  <div className="mt-4 p-4 bg-muted-50 border border-muted-200 rounded-lg">
                    <div className="flex items-start">
                      <XCircle className="w-5 h-5 text-muted-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-muted-800 mb-1">Rejection Reason:</h4>
                        <p className="text-sm text-muted-700">{submission.admin_feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submission.status === 'approved' && submission.reviewed_at && (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-primary-800 mb-1">Approved!</h4>
                        <p className="text-sm text-primary-700">
                          Reviewed on {formatDate(submission.reviewed_at)}
                          {submission.points_awarded && ` • Awarded ${submission.points_awarded} points`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(submission.status === 'pending_ai' || submission.status === 'manual_review') && (
                  <div className="mt-4 p-4 bg-primary-100 border border-primary-200 rounded-lg">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-primary-800 mb-1">
                          {submission.status === 'pending_ai' ? 'AI Review in Progress' : 'Under Manual Review'}
                        </h4>
                        <p className="text-sm text-primary-700">
                          Your submission is being reviewed. You&apos;ll be notified once the review is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 px-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:justify-center">
            <a
              href="/quests"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Target className="w-5 h-5 mr-2" />
              Browse More Quests
            </a>
            <a
              href="/profile"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <User className="w-5 h-5 mr-2" />
              View Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
