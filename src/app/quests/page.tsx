'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Quest, Submission } from '@/types';
import QuestCard from '@/components/QuestCard';
import { Search, Filter, Target, Loader, X, Sparkles } from 'lucide-react';

export default function QuestsPage() {
  const { data: session } = useSession();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categories = ['Health', 'Education', 'Outdoor', 'Creative', 'Social'];

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

  const filteredQuests = quests.filter(quest => {
    const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quest.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || quest.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getUserSubmission = (questId: string) => {
    return submissions.find(sub => sub.quest_id === questId);
  };

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
          <p className="text-red-600 mb-4">{error}</p>
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
            Available Quests
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Complete quests to earn points and climb the leaderboard! Submit your proof via Telegram.
          </p>
        </div>

        {!session && (
          <div className="mb-10 mx-auto max-w-2xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative">
                <Sparkles className="w-8 h-8 mb-4" />
                <h3 className="text-2xl font-bold mb-3">Ready to start your journey?</h3>
                <p className="text-blue-100 mb-6">
                  Sign in to track your progress, submit quests, and compete with others!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href="/auth/signin" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </a>
                  <a 
                    href="/auth/signup" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl border-2 border-white/20 hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <div className="lg:w-80">
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
                      <option key={category} value={category}>
                        {category}
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
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory) && (
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
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
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
              />
            ))}
          </div>
        )}

        {/* Enhanced Telegram Instructions */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-white/20 rounded-full"></div>
            <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-white/30 rounded-full"></div>
            
            <div className="relative">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Submit Quests via Telegram</h3>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                  Use our intelligent Telegram bot to submit quest completions and get instant AI validation
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Getting Started */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Getting Started
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">Find our Telegram bot and start a conversation</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">
                        Use <code className="bg-white/20 px-2 py-1 rounded text-white font-mono text-sm">/start</code> to link your account
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">
                        Browse available quests with <code className="bg-white/20 px-2 py-1 rounded text-white font-mono text-sm">/quests</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitting */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Submitting Quests
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">Take a clear photo of your quest completion</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">
                        Send photo with caption <code className="bg-white/20 px-2 py-1 rounded text-white font-mono text-sm">/submit [quest_id]</code>
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white/60 rounded-full mt-2"></div>
                      <p className="text-blue-100">Get instant AI validation and feedback! ✨</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <p className="text-blue-100 text-sm">
                  💡 <strong>Pro tip:</strong> Make sure your photos clearly show the quest completion for better AI validation results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}