'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Target, Plus, Edit, Trash2, Loader, X, Save, AlertCircle } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  status: 'active' | 'inactive';
  requirements?: string;
  validation_criteria?: any;
  created_at: string;
}

interface QuestFormData {
  title: string;
  description: string;
  points: number;
  category: string;
  requirements: string;
  status: 'active' | 'inactive';
}

export default function AdminQuestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    description: '',
    points: 0,
    category: '',
    requirements: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      points: 0,
      category: '',
      requirements: '',
      status: 'active'
    });
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      points: quest.points,
      category: quest.category,
      requirements: quest.requirements || '',
      status: quest.status
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
          <button 
            onClick={openCreateModal}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </button>
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

      <div className="grid gap-6">
        {quests.map((quest) => (
          <div key={quest.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
                <p className="text-gray-600 mt-1">{quest.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="text-sm text-gray-500">Points: {quest.points}</span>
                  <span className="text-sm text-gray-500">Category: {quest.category}</span>
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
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => openEditModal(quest)}
                  className="btn-secondary flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(quest.id, quest.title)}
                  className="btn-danger flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {quests.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quests found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first quest.</p>
            <button 
              onClick={openCreateModal}
              className="btn-primary"
            >
              Create Quest
            </button>
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
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="special">Special</option>
                      <option value="community">Community</option>
                      <option value="challenge">Challenge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
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
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
