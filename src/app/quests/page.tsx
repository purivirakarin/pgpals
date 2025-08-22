'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Quest, Submission } from '@/types';
import QuestCard from '@/components/QuestCard';
import { Search, Filter, Target, Loader, X, Sparkles, ArrowUpDown, Camera, Users, Lightbulb, Bot } from 'lucide-react';
import { getNumericId } from '@/lib/questId';

export default function QuestsPage() {
  const { data: session } = useSession();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // New status filter
  const [sortBy, setSortBy] = useState<'points' | 'id' | 'title' | 'created_at' | 'expires_at'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'pair', label: 'Pair Tasks' },
    { value: 'multiple-pair', label: 'Multiple-Pair Tasks' },
    { value: 'bonus', label: 'Bonus Tasks' }
  ];

  useEffect(() => {
    fetchQuests();
    if (session?.user) {
      fetchUserSubmissions();
    }
  }, [session]);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quests');
      if (!response.ok) throw new Error('Failed to fetch quests');
      const data = await response.json();
      setQuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const getUserSubmission = (questId: number) => {
    return submissions.find(sub => sub.quest_id === questId);
  };

  const filteredQuests = quests
    .filter(quest => {
      const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quest.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || quest.category === selectedCategory;
      
      // Filter by submission status if specified
      if (selectedStatus && session) {
        const userSubmission = getUserSubmission(quest.id);
        
        switch (selectedStatus) {
          case 'available':
            return matchesSearch && matchesCategory && !userSubmission;
          case 'completed':
            return matchesSearch && matchesCategory && userSubmission && 
                   (userSubmission.status === 'approved' || userSubmission.status === 'ai_approved');
          case 'pending':
            return matchesSearch && matchesCategory && userSubmission && 
                   (userSubmission.status === 'pending_ai' || userSubmission.status === 'manual_review');
          case 'rejected':
            return matchesSearch && matchesCategory && userSubmission && 
                   (userSubmission.status === 'rejected' || userSubmission.status === 'ai_rejected');
          default:
            return matchesSearch && matchesCategory;
        }
      }
      
      // If no status filter or no session, show all quests that match search and category
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'id':
          // For ID sorting, we'll use the quest numeric ID
          const aNumericId = getNumericId(a.id);
          const bNumericId = getNumericId(b.id);
          comparison = aNumericId - bNumericId;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'expires_at':
          // Handle quests without expiration dates (put them at the end)
          const aExpires = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
          const bExpires = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
          comparison = aExpires - bExpires;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading quests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-muted-600 mb-4">{error}</p>
          <button
            onClick={fetchQuests}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
            <Target className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Quests
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Complete quests to earn points and climb the leaderboard! Submit your proof via Telegram.
          </p>
        </div>


        {/* Enhanced Filters */}
        <div className="mb-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Input */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-3">
                  Search Quests
                </label>
                <div className="relative group">
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors" />
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 placeholder-gray-400"
                    placeholder="Search by title or description..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="lg:w-64">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                  Category
                </label>
                <div className="relative group">
                  <Filter className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors" />
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter - Only show for logged in users */}
              {session && (
                <div className="lg:w-64">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-3">
                    Status
                  </label>
                  <div className="relative group">
                    <Filter className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors" />
                    <select
                      id="status"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white cursor-pointer"
                    >
                      <option value="">All Quests</option>
                      <option value="available">Available</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending Review</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {selectedStatus && (
                      <button
                        onClick={() => setSelectedStatus('')}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Sort Controls */}
              <div className="lg:w-80">
                <label htmlFor="sort" className="block text-sm font-semibold text-gray-700 mb-3">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <ArrowUpDown className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors" />
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'points' | 'id' | 'title' | 'created_at' | 'expires_at')}
                      className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 appearance-none bg-white cursor-pointer"
                    >
                      <option value="points">Points</option>
                      <option value="id">Quest ID</option>
                      <option value="title">Title</option>
                      <option value="created_at">Date Created</option>
                      <option value="expires_at">Expiration Date</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-gray-600 hover:text-primary-600"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory || selectedStatus) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                      Search: &quot;{searchTerm}&quot;
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                      Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                      <button
                        onClick={() => setSelectedStatus('')}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedStatus('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Results Summary */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <span className="text-2xl font-bold text-primary-600">{filteredQuests.length}</span>
              <span className="text-gray-600 ml-2">
                {filteredQuests.length === 1 ? 'quest' : 'quests'}
                {selectedCategory && (
                  <span className="text-primary-600 font-medium"> in {selectedCategory}</span>
                )}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              out of {quests.length} total
            </div>
          </div>
        </div>

        {/* Quest Grid */}
        {filteredQuests.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No quests found</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria to find more quests.'
                : 'Check back later for new quests and challenges!'
              }
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Show All Quests
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                userSubmission={session ? getUserSubmission(quest.id) : undefined}
                showGroupStatus={true}
              />
            ))}
          </div>
        )}

        {/* Submission Tips - Collapsible */}
        <div className="mt-12">
          <details className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lightbulb className="w-5 h-5 text-primary-600 mr-2" />
                Quick Submission Tips
              </h3>
              <span className="text-gray-400 text-sm">Click to expand</span>
            </summary>
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="grid md:grid-cols-2 gap-6 text-sm mt-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <Camera className="w-4 h-4 text-primary-600 mr-2" />
                    Regular Submissions
                  </h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Format: <code className="bg-gray-100 px-1 rounded">/submit [quest_id]</code></li>
                    <li>• Example: <code className="bg-gray-100 px-1 rounded">/submit 5</code></li>
                    <li>• Photo must clearly show quest requirement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <Users className="w-4 h-4 text-primary-600 mr-2" />
                    Group Submissions
                  </h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Multiple-pair quests only</li>
                    <li>• Format: <code className="bg-gray-100 px-1 rounded">/submit [id] group:Name1&Name2,Name3&Name4</code></li>
                    <li>• Minimum 2 pairs (4+ people)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <a 
                  href="/help/telegram" 
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  View complete Telegram guide →
                </a>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}