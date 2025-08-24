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
  Users,
  Trash2,
  UserMinus,
  UserPlus,
  Search,
  Filter,
  X
} from 'lucide-react';
import Dropdown from '@/components/Dropdown';

interface SubmissionWithQuest extends Submission {
  quest: Quest;
}

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [optOutLoading, setOptOutLoading] = useState<number | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [submitterFilter, setSubmitterFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchAllSubmissions();
  }, [session, status, router]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, submitterFilter]);

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      // Fetch all submissions for client-side filtering
      const response = await fetch(`/api/submissions?limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      
      // Check if the response has pagination info or is just an array
      if (Array.isArray(data)) {
        setAllSubmissions(data);
      } else {
        setAllSubmissions(data.submissions || data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and pagination
  const filteredSubmissions = allSubmissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.quest?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quest?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission as any).submitter_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || submission.status === statusFilter;

    const matchesCategory = !categoryFilter || submission.quest?.category === categoryFilter;

    const matchesSubmitter = !submitterFilter || 
      (submitterFilter === 'self' && ((submission as any).submitted_by === 'self' || !(submission as any).submitted_by)) ||
      (submitterFilter === 'partner' && (submission as any).submitted_by === 'partner') ||
      (submitterFilter === 'group' && (submission as any).submitted_by === 'group');

    return matchesSearch && matchesStatus && matchesCategory && matchesSubmitter;
  });

  const totalSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalSubmissions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const submissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories and submitter types from all submissions
  const categories = Array.from(new Set(allSubmissions.map(s => s.quest?.category).filter(Boolean)));
  const submitterTypes = Array.from(new Set(allSubmissions.map(s => (s as any).submitted_by || 'self')));
  const availableStatuses = Array.from(new Set(allSubmissions.map(s => s.status)));

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
      setAllSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      
      // If current page becomes empty and it's not the first page, go to previous page
      if (submissions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete submission');
    } finally {
      setDeleteLoading(null);
    }
  };

  const optOutSubmission = async (submissionId: number, currentlyOptedOut: boolean) => {
    const action = currentlyOptedOut ? 'opt back into' : 'opt out of';
    const confirmMessage = currentlyOptedOut 
      ? 'Are you sure you want to opt back into this group submission? You and your partner will be included again.'
      : 'Are you sure you want to opt out of this group submission? This will remove you and your partner from receiving points if the submission is approved.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setOptOutLoading(submissionId);
      
      // Find the submission to get the group_submission_id
      const submission = allSubmissions.find(sub => sub.id === submissionId);
      if (!submission || !submission.group_submission_id) {
        throw new Error('Group submission not found');
      }
      
      const response = await fetch('/api/submissions/opt-out', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_submission_id: submission.group_submission_id,
          opted_out: !currentlyOptedOut
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} submission`);
      }

      const result = await response.json();
      
      // Update the submission in local state
      setAllSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, user_opted_out: !currentlyOptedOut }
          : sub
      ));

      // Show success message (you could use a toast notification here)
      console.log(result.message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} submission`);
    } finally {
      setOptOutLoading(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setSubmitterFilter('');
  };

  const getSubmitterInfo = (submission: any) => {
    // Handle various possible values for submitted_by
    const submittedBy = submission.submitted_by;
    
    // Debug log to understand what we're receiving
    if (process.env.NODE_ENV === 'development') {
      console.log('Submission submittedBy value:', submittedBy, 'type:', typeof submittedBy);
    }
    
    // Handle different possible values more robustly
    if (submittedBy === 'self' || submittedBy === 0 || submittedBy === '0' || !submittedBy) {
      return {
        text: 'You',
        icon: <User className="w-4 h-4 text-primary-500" />,
        color: 'text-primary-600'
      };
    } else if (submittedBy === 'partner') {
      return {
        text: `Partner: ${submission.submitter_name || 'Unknown'}`,
        icon: <Users className="w-4 h-4 text-accent-500" />,
        color: 'text-accent-600'
      };
    } else if (submittedBy === 'group') {
      const isOptedOut = submission.user_opted_out;
      const isSubmitter = submission.is_submitter;
      
      return {
        text: `Group: ${submission.submitter_name || 'Unknown'}${
          isSubmitter ? ' (you submitted)' : 
          isOptedOut ? ' (opted out)' : ''
        }`,
        icon: <Users className={`w-4 h-4 ${isOptedOut ? 'text-orange-500' : 'text-purple-500'}`} />,
        color: isOptedOut ? 'text-orange-600' : 'text-purple-600'
      };
    } else {
      // Fallback for any unexpected values
      return {
        text: 'You',
        icon: <User className="w-4 h-4 text-gray-400" />,
        color: 'text-gray-600'
      };
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
        return 'Pending Review';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Hero section skeleton */}
          <div className="text-center mb-8 sm:mb-12 animate-pulse">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-2xl mb-4 sm:mb-6 mx-auto"></div>
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-3 sm:mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-80 mx-auto"></div>
          </div>

          {/* Search and filters skeleton */}
          <div className="mb-8 card p-6 animate-pulse">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="lg:w-48">
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="lg:w-48">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="lg:w-48">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Submissions list skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 animate-pulse">
                {/* Mobile layout skeleton */}
                <div className="sm:hidden">
                  {/* Status and actions at top */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-8 bg-gray-200 rounded-full w-32"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>

                {/* Desktop layout skeleton */}
                <div className="hidden sm:block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="flex items-center space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 bg-gray-200 rounded-full w-32"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>

                {/* Status info skeleton */}
                {i % 3 === 0 && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-gray-200 rounded mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="mt-8 px-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="flex space-x-1">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="w-8 h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>

          {/* Navigation skeleton */}
          <div className="mt-12 px-4 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:justify-center">
              <div className="h-12 bg-gray-200 rounded-xl w-full sm:w-48"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-full sm:w-40"></div>
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
              onClick={() => fetchAllSubmissions()}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

        {/* Search and Filters */}
        <div className="mb-8 card p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Search */}
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
                  placeholder="Search by quest title, description, or submitter..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Dropdown
                options={[
                  { value: "", label: "All Statuses" },
                  ...availableStatuses.map(status => ({
                    value: status,
                    label: getStatusText(status)
                  }))
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                icon={<Filter className="w-4 h-4" />}
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Dropdown
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map(category => ({
                    value: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1)
                  }))
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="All Categories"
                icon={<Target className="w-4 h-4" />}
              />
            </div>

            {/* Submitter Filter */}
            <div className="lg:w-48">
              <label htmlFor="submitter" className="block text-sm font-medium text-gray-700 mb-2">
                Submitted By
              </label>
              <Dropdown
                options={[
                  { value: "", label: "All Submitters" },
                  { value: "self", label: "You" },
                  { value: "partner", label: "Partner" },
                  { value: "group", label: "Group" }
                ]}
                value={submitterFilter}
                onChange={setSubmitterFilter}
                placeholder="All Submitters"
                icon={<Users className="w-4 h-4" />}
              />
            </div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter || categoryFilter || submitterFilter) && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {totalSubmissions === allSubmissions.length 
                ? `Showing all ${totalSubmissions} submissions`
                : `Showing ${totalSubmissions} of ${allSubmissions.length} submissions`
              }
            </span>
            {(searchTerm || statusFilter || categoryFilter || submitterFilter) && (
              <span className="text-primary-600">
                Filters active
              </span>
            )}
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 && totalSubmissions === 0 && allSubmissions.length === 0 ? (
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
        ) : submissions.length === 0 && totalSubmissions === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No matching submissions</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
              No submissions match your current filters. Try adjusting your search criteria.
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            >
              <X className="w-5 h-5 mr-2" />
              Clear Filters
            </button>
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
                  
                  {(submission as any).can_delete && (
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
                  )}
                  
                  {(submission as any).can_opt_out && (
                    <button
                      onClick={() => optOutSubmission(submission.id, (submission as any).user_opted_out)}
                      disabled={optOutLoading === submission.id}
                      className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        (submission as any).user_opted_out
                          ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                          : 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100'
                      }`}
                      title={(submission as any).user_opted_out ? "Opt back into group submission" : "Opt out of group submission"}
                    >
                      {optOutLoading === submission.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (submission as any).user_opted_out ? (
                        <UserPlus className="w-4 h-4" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                      <span className="ml-1.5 hidden xs:inline">
                        {(submission as any).user_opted_out ? 'Opt In' : 'Opt Out'}
                      </span>
                    </button>
                  )}
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
                      {(() => {
                        const submitterInfo = getSubmitterInfo(submission);
                        return (
                          <span className={`inline-flex items-center ${submitterInfo.color}`}>
                            {submitterInfo.icon}
                            <span className="ml-1">{submitterInfo.text}</span>
                          </span>
                        );
                      })()}
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
                    
                    {(submission as any).can_delete && (
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
                    )}
                    
                    {(submission as any).can_opt_out && (
                      <button
                        onClick={() => optOutSubmission(submission.id, (submission as any).user_opted_out)}
                        disabled={optOutLoading === submission.id}
                        className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          (submission as any).user_opted_out
                            ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                            : 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100'
                        }`}
                        title={(submission as any).user_opted_out ? "Opt back into group submission" : "Opt out of group submission"}
                      >
                        {optOutLoading === submission.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (submission as any).user_opted_out ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                        <span className="ml-1">
                          {(submission as any).user_opted_out ? 'Opt In' : 'Opt Out'}
                        </span>
                      </button>
                    )}
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
                    {(() => {
                      const submitterInfo = getSubmitterInfo(submission);
                      return (
                        <span className={`inline-flex items-center ${submitterInfo.color}`}>
                          {submitterInfo.icon}
                          <span className="ml-1.5">{submitterInfo.text}</span>
                        </span>
                      );
                    })()}
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
                          {submission.status === 'pending_ai' ? 'Review in Progress' : 'Under Review'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 px-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSubmissions)} of {totalSubmissions} submissions
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
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
