'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Filter, User, Users, Check, Clock, XCircle, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Dropdown from './Dropdown';

interface UserSubmission {
  id: number;
  submission_type: 'direct' | 'partner' | 'group';
  submitted_at: string;
  status: string;
  points_awarded: number | null;
  is_deleted: boolean;
  opted_out?: boolean;
  opted_out_at?: string;
  group_submission_id?: number;
  submitter_user_id?: number;
  quest: {
    id: number;
    title: string;
    category: string;
    points: number;
  };
  user?: {
    id: number;
    name: string;
    telegram_username: string | null;
  };
  submitter?: {
    id: number;
    name: string;
    telegram_username: string | null;
  };
  media_urls?: string[];
}

interface UserSubmissionsData {
  user: {
    id: number;
    name: string;
    email: string;
    total_points: number;
    partner_name?: string;
  };
  submissions: UserSubmission[];
  stats: {
    total_submissions: number;
    approved_submissions: number;
    pending_submissions: number;
    direct_submissions: number;
    partner_submissions: number;
    group_submissions: number;
    total_points_from_submissions: number;
  };
}

interface UserSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const ITEMS_PER_PAGE = 10;

export default function UserSubmissionsModal({ isOpen, onClose, userId }: UserSubmissionsModalProps) {
  const [data, setData] = useState<UserSubmissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'partner' | 'group'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'deleted'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/submissions`);
      if (!response.ok) {
        // Fallback to debug API if main API fails
        if (response.status === 500) {
          const debugResponse = await fetch(`/api/debug/user-submissions?userId=${userId}`);
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            setData(debugData);
            setLoading(false);
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching user submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserSubmissions();
    }
  }, [isOpen, userId, fetchUserSubmissions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium';
      case 'pending': return 'text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium';
      case 'rejected': return 'text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium';
      default: return 'text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User className="w-4 h-4 text-blue-500" />;
      case 'partner': return <Users className="w-4 h-4 text-purple-500" />;
      case 'group': return <Users className="w-4 h-4 text-green-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSubmissionTypeBadge = (type: string) => {
    switch (type) {
      case 'direct': return 'text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium';
      case 'partner': return 'text-purple-700 bg-purple-100 px-2 py-1 rounded-full text-xs font-medium';
      case 'group': return 'text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium';
      default: return 'text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  // Filter and search submissions
  const filteredSubmissions = useMemo(() => {
    if (!data) return [];

    return data.submissions.filter(submission => {
      // Filter by type
      if (filter !== 'all' && submission.submission_type !== filter) {
        return false;
      }

      // Filter by status
      if (statusFilter !== 'all') {
        if (statusFilter === 'deleted' && !submission.is_deleted) return false;
        if (statusFilter !== 'deleted' && statusFilter !== submission.status) return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const questTitle = submission.quest.title.toLowerCase();
        const questCategory = submission.quest.category.toLowerCase();
        const userName = submission.user?.name?.toLowerCase() || '';
        const userTelegram = submission.user?.telegram_username?.toLowerCase() || '';
        const submitterName = submission.submitter?.name?.toLowerCase() || '';
        const submitterTelegram = submission.submitter?.telegram_username?.toLowerCase() || '';

        return questTitle.includes(searchLower) ||
               questCategory.includes(searchLower) ||
               userName.includes(searchLower) ||
               userTelegram.includes(searchLower) ||
               submitterName.includes(searchLower) ||
               submitterTelegram.includes(searchLower);
      }

      return true;
    });
  }, [data, filter, statusFilter, searchTerm]);

  // Pagination calculations
  const totalFilteredSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalFilteredSubmissions / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilter, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">
                User Submissions Analysis
              </h2>
              <div className="relative group">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  BETA
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  This feature is in beta. Report any issues to the admin team.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            {data && (
              <p className="text-sm text-gray-600 mt-1">
                {data.user.name} ({data.user.email})
                {data.user.partner_name && (
                  <span className="ml-2 text-purple-600">
                    • Partner: {data.user.partner_name}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading submissions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 font-medium">{error}</div>
              <button
                onClick={fetchUserSubmissions}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div>
              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{data.stats.total_submissions}</div>
                  <div className="text-sm text-blue-700">Total Submissions</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{data.stats.approved_submissions}</div>
                  <div className="text-sm text-green-700">Approved</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">{data.stats.pending_submissions}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{data.stats.total_points_from_submissions}</div>
                  <div className="text-sm text-purple-700">Points Earned</div>
                </div>
              </div>

              {/* Breakdown by Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <div className="font-semibold text-blue-900">Direct Submissions</div>
                      <div className="text-sm text-blue-700">{data.stats.direct_submissions} submissions</div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <div className="font-semibold text-purple-900">Partner Submissions</div>
                      <div className="text-sm text-purple-700">{data.stats.partner_submissions} submissions</div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <div className="font-semibold text-green-900">Group Submissions</div>
                      <div className="text-sm text-green-700">{data.stats.group_submissions} submissions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search by quest, user, category, or @username..."
                      />
                    </div>
                  </div>
                  
                  <div className="md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Type
                    </label>
                    <Dropdown
                      options={[
                        { value: "all", label: "All Types" },
                        { value: "direct", label: "Direct Only" },
                        { value: "partner", label: "Partner Only" },
                        { value: "group", label: "Group Only" }
                      ]}
                      value={filter}
                      onChange={(value) => setFilter(value as any)}
                      placeholder="All Types"
                      icon={<Filter className="w-5 h-5" />}
                    />
                  </div>
                  
                  <div className="md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <Dropdown
                      options={[
                        { value: "all", label: "All Status" },
                        { value: "approved", label: "Approved" },
                        { value: "pending", label: "Pending" },
                        { value: "rejected", label: "Rejected" },
                        { value: "deleted", label: "Deleted" }
                      ]}
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as any)}
                      placeholder="All Status"
                      icon={<Filter className="w-5 h-5" />}
                    />
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submissions ({totalFilteredSubmissions})
                  </h3>
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredSubmissions)} of {totalFilteredSubmissions}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quest
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitter
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            {filteredSubmissions.length === 0 && (searchTerm || filter !== 'all' || statusFilter !== 'all')
                              ? 'No submissions found matching the current filters.'
                              : 'No submissions found for this user.'
                            }
                          </td>
                        </tr>
                      ) : (
                        paginatedSubmissions.map((submission) => (
                          <tr key={`${submission.submission_type}-${submission.id}`} className={submission.is_deleted ? 'opacity-60 bg-gray-50' : ''}>
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{submission.quest.title}</div>
                                <div className="text-sm text-gray-500">{submission.quest.category}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                {getSubmissionTypeIcon(submission.submission_type)}
                                <span className={`ml-2 ${getSubmissionTypeBadge(submission.submission_type)}`}>
                                  {submission.submission_type}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                {submission.submission_type === 'direct' ? (
                                  <span className="text-blue-600 font-medium">Self</span>
                                ) : submission.submission_type === 'partner' ? (
                                  <div>
                                    <div className="font-medium text-purple-600">
                                      {submission.user?.name || 'Partner'}
                                    </div>
                                    {submission.user?.telegram_username && (
                                      <div className="text-xs text-gray-500">
                                        @{submission.user.telegram_username}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium text-green-600">
                                      {submission.submitter?.name || 'Group Member'}
                                    </div>
                                    {submission.submitter?.telegram_username && (
                                      <div className="text-xs text-gray-500">
                                        @{submission.submitter.telegram_username}
                                      </div>
                                    )}
                                    {submission.opted_out && (
                                      <div className="text-xs text-red-500 mt-1">Opted out</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                {getStatusIcon(submission.status)}
                                <span className={`ml-2 ${getStatusBadge(submission.status)}`}>
                                  {submission.status.replace('_', ' ')}
                                </span>
                                {submission.is_deleted && (
                                  <Trash2 className="w-4 h-4 text-red-500 ml-2" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {submission.points_awarded || 0} pts
                              </div>
                              <div className="text-xs text-gray-500">
                                (Quest: {submission.quest.points} pts)
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-sm text-gray-900">
                                  {new Date(submission.submitted_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(submission.submitted_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => window.open(`/admin/submissions?submission=${submission.id}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="View in submissions page"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

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
                                  ? 'bg-blue-600 text-white'
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

              {/* Points Calculation Validation */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">Points Calculation Validation</h3>
                  <div className="relative group">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 cursor-help">
                      BETA
                    </span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Experimental feature for debugging point discrepancies
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User&apos;s Total Points (from profile):</span>
                    <span className="ml-2 text-blue-600 font-bold">{data.user.total_points}</span>
                  </div>
                  <div>
                    <span className="font-medium">Points from Submissions:</span>
                    <span className="ml-2 text-green-600 font-bold">{data.stats.total_points_from_submissions}</span>
                  </div>
                </div>
                {data.user.total_points !== data.stats.total_points_from_submissions && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                    ⚠️ Point mismatch detected! This could indicate points from other sources or calculation errors.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}