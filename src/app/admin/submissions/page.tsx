'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useStats } from '@/contexts/StatsContext';
import Image from 'next/image';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  User,
  Target,
  Calendar,
  MessageCircle,
  Award,
  Loader,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Submission } from '@/types';
import Dropdown from '@/components/Dropdown';

interface SubmissionWithDetails extends Omit<Submission, 'user' | 'quest'> {
  user: {
    id: string;
    name: string;
    email: string;
    telegram_username?: string;
  };
  quest: {
    id: string;
    title: string;
    category: string;
    points: number;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  deleter?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshStats } = useStats();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const submissionsPerPage = 10;

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all submissions for frontend filtering and pagination
      const params = new URLSearchParams();
      if (showDeleted) {
        params.append('showDeleted', 'true');
      }
      const response = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      
      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchSubmissions();
  }, [session, status, router, fetchSubmissions]);

  const reviewSubmission = async (submissionId: number, action: 'approve' | 'reject', feedback?: string) => {
    setReviewLoading(submissionId);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          feedback: feedback || ''
        })
      });

      if (!response.ok) throw new Error('Failed to review submission');
      
      const updatedSubmission = await response.json();
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? { ...sub, ...updatedSubmission } : sub
      ));
      
      // Refresh user stats after review
      refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review submission');
    } finally {
      setReviewLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_ai':
        return 'bg-yellow-100 text-yellow-800';
      case 'ai_approved':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'ai_rejected':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'manual_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_ai':
        return <Clock className="w-4 h-4" />;
      case 'ai_approved':
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'ai_rejected':
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'manual_review':
        return <Eye className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canOverride = (status: string) => {
    // Admin can override any submission status
    return true;
  };

  const filteredSubmissions = (submissions || []).filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quest?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quest?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.user?.telegram_username && submission.user.telegram_username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter) {
      if (statusFilter === 'pending_review') {
        matchesStatus = submission.status === 'manual_review' || submission.status === 'pending_ai';
      } else if (statusFilter === 'approved') {
        matchesStatus = submission.status === 'approved' || submission.status === 'ai_approved';
      } else if (statusFilter === 'rejected') {
        matchesStatus = submission.status === 'rejected' || submission.status === 'ai_rejected';
      } else {
        matchesStatus = submission.status === statusFilter;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalFilteredSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalFilteredSubmissions / submissionsPerPage);
  const startIndex = (currentPage - 1) * submissionsPerPage;
  const endIndex = startIndex + submissionsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const pendingCount = (submissions || []).filter(s => s.status === 'manual_review' || s.status === 'pending_ai').length;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Submission Management</h1>
          {pendingCount > 0 && (
            <span className="ml-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingCount} pending review
            </span>
          )}
        </div>
        <p className="text-lg text-gray-600">Review and manage quest submissions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 card p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Submissions
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search by user, quest, category, or @username..."
              />
            </div>
          </div>
          <div className="md:w-64">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <Dropdown
              options={[
                { value: "", label: "All Statuses" },
                { value: "pending_review", label: "Pending Review" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "pending_ai", label: "Pending Review" },
                { value: "manual_review", label: "Manual Review" },
                { value: "ai_approved", label: "Auto Approved" },
                { value: "ai_rejected", label: "Auto Rejected" }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span>Show Deleted</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setStatusFilter('pending_review')}
              className="btn-primary"
            >
              Show Pending Review ({(submissions || []).filter(s => s.status === 'manual_review' || s.status === 'pending_ai').length})
            </button>
            <button
              onClick={() => setStatusFilter('')}
              className="btn-secondary"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Submissions ({totalFilteredSubmissions})
          </h2>
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredSubmissions)} of {totalFilteredSubmissions}
          </div>
        </div>

        {paginatedSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'No submissions have been made yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
          {paginatedSubmissions.map((submission) => (
            <div key={submission.id} className="card p-4 sm:p-6">
              {/* Mobile Layout */}
              <div className="block lg:hidden">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <User className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-900 block truncate">{submission.user?.name || 'Unknown User'}</span>
                        {submission.user?.telegram_username && (
                          <span className="text-sm text-gray-500 block truncate">@{submission.user.telegram_username}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1 hidden sm:inline">{submission.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Quest Info */}
                  <div className="flex items-start">
                    <Target className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-700 block">{submission.quest?.title || 'Unknown Quest'}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500">({submission.quest?.category || 'Unknown'})</span>
                        <div className="flex items-center text-primary-600 flex-shrink-0">
                          <Award className="w-4 h-4 mr-1" />
                          {submission.quest?.points || 0} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Submitted {new Date(submission.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {submission.reviewed_at && (
                      <div className="mt-1 ml-5">
                        Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Admin Feedback */}
                  {submission.admin_feedback && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-1">
                        <MessageCircle className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Admin Feedback:</span>
                      </div>
                      <p className="text-sm text-gray-600 break-words">{submission.admin_feedback}</p>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {submission.ai_analysis && Object.keys(submission.ai_analysis).length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-2 flex-shrink-0"></div>
                          <span className="text-sm font-medium text-blue-700">AI Analysis</span>
                        </div>
                        {submission.ai_confidence_score && (
                          <span className="text-sm text-blue-600 flex-shrink-0">
                            {Math.round(submission.ai_confidence_score * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {submission.telegram_file_id && (
                      <button
                        onClick={() => setSelectedImage(submission.telegram_file_id)}
                        className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-700 py-2 px-3 border border-primary-200 rounded-lg hover:bg-primary-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Image
                      </button>
                    )}

                    {canOverride(submission.status) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => reviewSubmission(submission.id, 'approve')}
                          disabled={reviewLoading === submission.id || submission.status === 'approved'}
                          className={`flex-1 flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm disabled:opacity-50 ${
                            submission.status === 'approved' 
                              ? 'bg-green-800 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {reviewLoading === submission.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span className="ml-1">
                            {submission.status === 'approved' ? 'Approved' : 'Approve'}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (submission.status === 'rejected') return;
                            const feedback = prompt('Rejection reason (optional):');
                            reviewSubmission(submission.id, 'reject', feedback || undefined);
                          }}
                          disabled={reviewLoading === submission.id || submission.status === 'rejected'}
                          className={`flex-1 flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm disabled:opacity-50 ${
                            submission.status === 'rejected' 
                              ? 'bg-red-800 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          <span className="ml-1">
                            {submission.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{submission.user?.name || 'Unknown User'}</span>
                      {submission.user?.telegram_username && (
                        <span className="ml-2 text-sm text-gray-500">@{submission.user.telegram_username}</span>
                      )}
                      <span className={`ml-4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1">{submission.status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <div className="flex items-center mb-2">
                      <Target className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">{submission.quest?.title || 'Unknown Quest'}</span>
                      <span className="ml-2 text-sm text-gray-500">({submission.quest?.category || 'Unknown'})</span>
                      <div className="ml-4 flex items-center text-primary-600">
                        <Award className="w-4 h-4 mr-1" />
                        {submission.quest?.points || 0} pts
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                      {submission.reviewed_at && (
                        <>
                          <span className="mx-2">•</span>
                          Reviewed {new Date(submission.reviewed_at).toLocaleString()}
                        </>
                      )}
                    </div>

                    {submission.admin_feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-1">
                          <MessageCircle className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-sm font-medium text-gray-700">Admin Feedback:</span>
                        </div>
                        <p className="text-sm text-gray-600">{submission.admin_feedback}</p>
                      </div>
                    )}

                    {submission.ai_analysis && Object.keys(submission.ai_analysis).length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-1">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                          <span className="text-sm font-medium text-blue-700">AI Analysis:</span>
                          {submission.ai_confidence_score && (
                            <span className="ml-2 text-sm text-blue-600">
                              {Math.round(submission.ai_confidence_score * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-6">
                    {submission.telegram_file_id && (
                      <button
                        onClick={() => setSelectedImage(submission.telegram_file_id)}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Image
                      </button>
                    )}

                    {canOverride(submission.status) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => reviewSubmission(submission.id, 'approve')}
                          disabled={reviewLoading === submission.id || submission.status === 'approved'}
                          className={`flex items-center px-3 py-1 text-white rounded text-sm disabled:opacity-50 ${
                            submission.status === 'approved' 
                              ? 'bg-green-800 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {reviewLoading === submission.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span className="ml-1">
                            {submission.status === 'approved' ? 'Approved' : 'Approve'}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (submission.status === 'rejected') return;
                            const feedback = prompt('Rejection reason (optional):');
                            reviewSubmission(submission.id, 'reject', feedback || undefined);
                          }}
                          disabled={reviewLoading === submission.id || submission.status === 'rejected'}
                          className={`flex items-center px-3 py-1 text-white rounded text-sm disabled:opacity-50 ${
                            submission.status === 'rejected' 
                              ? 'bg-red-800 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          <span className="ml-1">
                            {submission.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page numbers */}
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
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'approved' || s.status === 'ai_approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'rejected' || s.status === 'ai_rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Submission Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex justify-center">
              <Image
                src={`/api/telegram/file/${selectedImage}`}
                alt="Submission"
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain"
                onError={() => {
                  console.error('Failed to load image');
                }}
              />
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => window.open(`/api/telegram/file/${selectedImage}`, '_blank')}
                className="flex items-center px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}