'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Target, Plus, Edit, Trash2, Loader, X, Save, AlertCircle, Search, Filter, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Dropdown from '@/components/Dropdown';

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  status: 'active' | 'inactive';
  requirements?: string;
  validation_criteria?: any;
  expires_at?: string;
  created_at: string;
}

interface QuestFormData {
  title: string;
  description: string;
  points: string; // Keep as string for form input handling
  category: string;
  requirements: string;
  status: 'active' | 'inactive';
  expires_at: string;
}

export default function AdminQuestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'points' | 'category' | 'created_at' | 'expires_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    description: '',
    points: '0',
    category: '',
    requirements: '',
    status: 'active',
    expires_at: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const questsPerPage = 8;

  const fetchQuests = useCallback(async () => {
    try {
      // Fetch all quests for admin (no status filter to get all)
      const response = await fetch('/api/quests');
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      setError('Failed to load quests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchQuests();
  }, [session, status, router, fetchQuests]);

  const openCreateModal = () => {
    setEditingQuest(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      points: '',
      requirements: '',
      status: 'active',
      expires_at: ''
    });
    setShowModal(true);
  };

  const expireQuests = async () => {
    if (!confirm('Are you sure you want to expire all quests that have passed their expiration date?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/expire-quests', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to expire quests');
      }

      const result = await response.json();
      
      // Refresh the quests list
      await fetchQuests();
      
      // Show success message
      if (result.expired_count > 0) {
        alert(`Successfully expired ${result.expired_count} quest(s).`);
      } else {
        alert('No quests needed to be expired.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expire quests');
    }
  };

  const openEditModal = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      points: quest.points.toString(),
      category: quest.category,
      requirements: quest.requirements || '',
      status: quest.status,
      expires_at: quest.expires_at ? new Date(quest.expires_at).toISOString().slice(0, 16) : '' // Format for datetime-local input with proper timezone
    });
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuest(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingQuest ? `/api/quests/${editingQuest.id}` : '/api/quests';
      const method = editingQuest ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quest');
      }

      const savedQuest = await response.json();

      if (editingQuest) {
        setQuests(quests.map(q => q.id === editingQuest.id ? savedQuest : q));
      } else {
        setQuests([savedQuest, ...quests]);
      }

      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (questId: string, questTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${questTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quest');
      }

      setQuests(quests.filter(q => q.id !== questId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quest');
    }
  };

  const toggleQuestStatus = async (quest: Quest) => {
    try {
      const newStatus = quest.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/quests/${quest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quest status');
      }

      const updatedQuest = await response.json();
      setQuests(quests.map(q => q.id === quest.id ? updatedQuest : q));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quest status');
    }
  };

  const filteredQuests = quests
    .filter(quest => {
      const matchesSearch = !searchTerm || 
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || quest.status === statusFilter;
      const matchesCategory = !categoryFilter || quest.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'points':
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'expires_at':
          aValue = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
          bValue = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination logic
  const totalFilteredQuests = filteredQuests.length;
  const totalPages = Math.ceil(totalFilteredQuests / questsPerPage);
  const startIndex = (currentPage - 1) * questsPerPage;
  const endIndex = startIndex + questsPerPage;
  const paginatedQuests = filteredQuests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  const categories = ['Health', 'Education', 'Outdoor', 'Creative', 'Social', 'Daily', 'Weekly', 'Special', 'Community', 'Challenge'];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quests...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Quest Management</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={expireQuests}
              className="btn-secondary flex items-center"
              title="Manually expire quests that have passed their expiration date"
            >
              <Clock className="w-4 h-4 mr-2" />
              Expire Quests
            </button>
            <button 
              onClick={openCreateModal}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quest
            </button>
          </div>
        </div>
        <p className="text-lg text-gray-600">
          Manage quests and challenges for your platform.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Quests
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search by title, description, or category..."
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <Dropdown
              options={[
                { value: "", label: "All Categories" },
                ...categories.map(category => ({ value: category, label: category }))
              ]}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <Dropdown
              options={[
                { value: "", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <Dropdown
              options={[
                { value: "created_at", label: "Created Date" },
                { value: "title", label: "Title" },
                { value: "points", label: "Points" },
                { value: "category", label: "Category" },
                { value: "expires_at", label: "Expiration Date" }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as typeof sortBy)}
              placeholder="Sort by..."
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <Dropdown
              options={[
                { value: "desc", label: "Descending" },
                { value: "asc", label: "Ascending" }
              ]}
              value={sortOrder}
              onChange={(value) => setSortOrder(value as typeof sortOrder)}
              placeholder="Sort order..."
              icon={<Filter className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Quests ({totalFilteredQuests})
          </h2>
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredQuests)} of {totalFilteredQuests}
          </div>
        </div>

        {paginatedQuests.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quests found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || categoryFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first quest.'
              }
            </p>
            <button 
              onClick={openCreateModal}
              className="btn-primary"
            >
              Create Quest
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {paginatedQuests.map((quest) => (
              <div key={quest.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
                    <p className="text-gray-600 mt-1">{quest.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <span className="text-sm text-gray-500">Points: {quest.points}</span>
                      <span className="text-sm text-gray-500">Category: {quest.category}</span>
                      {quest.expires_at && (
                        <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                          new Date(quest.expires_at) < new Date() 
                            ? 'bg-red-100 text-red-800' 
                            : new Date(quest.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          🕐 Expires: {new Date(quest.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        onClick={() => toggleQuestStatus(quest)}
                        className={`text-sm px-2 py-1 rounded-full cursor-pointer hover:opacity-75 ${
                          quest.status === 'active'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quest.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button 
                      onClick={() => openEditModal(quest)}
                      className="btn-secondary flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(quest.id, quest.title)}
                      className="btn-danger flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
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

      {/* Quest Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingQuest ? 'Edit Quest' : 'Create New Quest'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <Dropdown
                      options={[
                        { value: "", label: "Select Category" },
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "special", label: "Special" },
                        { value: "community", label: "Community" },
                        { value: "challenge", label: "Challenge" }
                      ]}
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select Category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Dropdown
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" }
                    ]}
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional requirements or instructions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quest will automatically become inactive after this date
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex items-center"
                  >
                    {submitting ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? 'Saving...' : editingQuest ? 'Update Quest' : 'Create Quest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
