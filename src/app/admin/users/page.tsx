'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  Award,
  MessageCircle,
  Loader,
  AlertCircle,
  X,
  Save,
  Link,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Dropdown from '@/components/Dropdown';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'participant' | 'admin';
  total_points: number;
  telegram_id?: string;
  telegram_username?: string;
  partner_id?: number;
  partner_name?: string;
  partner_telegram?: string;
  created_at: string;
  submission_count?: number;
}

interface EditUserFormData {
  name: string;
  email: string;
  role: 'participant' | 'admin';
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{userId: number, newRole: string} | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    name: '',
    email: '',
    role: 'participant'
  });
  const [submitting, setSubmitting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingUser, setLinkingUser] = useState<UserData | null>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<string>('');
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Remove server-side filtering, fetch all users for frontend filtering
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
      setTotalUsers(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
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

    fetchUsers();
  }, [session, status, router, fetchUsers]);

  const handleRoleChange = (userId: number, newRole: 'participant' | 'admin') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setPendingUpdate({ userId, newRole });
    setShowConfirmModal(true);
  };

  const confirmRoleUpdate = async () => {
    if (!pendingUpdate) return;
    
    try {
      const response = await fetch(`/api/users/${pendingUpdate.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingUpdate.newRole })
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === pendingUpdate.userId ? { ...user, role: updatedUser.role } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setShowConfirmModal(false);
      setPendingUpdate(null);
    }
  };

  const updateUserRole = async (userId: number, newRole: 'participant' | 'admin') => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: updatedUser.role } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
    setError(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...updatedUser } : user
      ));

      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const openLinkModal = (user: UserData) => {
    setLinkingUser(user);
    setSelectedTargetUser('');
    setLinkSearchTerm('');
    setShowLinkModal(true);
  };

  const handleLinkUsers = async () => {
    if (!linkingUser || !selectedTargetUser) return;

    if (!confirm(`Are you sure you want to create a partnership between "${linkingUser.name}" and the selected user? Partners will share points and leaderboard ranking.`)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/users/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserId: linkingUser.id,
          targetUserId: parseInt(selectedTargetUser)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link users');
      }

      // Refresh users list
      await fetchUsers();
      setShowLinkModal(false);
      setLinkingUser(null);
      setSelectedTargetUser('');
      setLinkSearchTerm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link users');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalFilteredUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Filter users for linking (exclude current user and already partnered users)
  const availableUsersForLinking = users.filter(user => {
    if (!linkingUser) return false;
    const matchesLinkSearch = user.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                             (user.telegram_username && user.telegram_username.toLowerCase().includes(linkSearchTerm.toLowerCase()));
    return user.id !== linkingUser.id && !user.partner_id && matchesLinkSearch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
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
          <div>
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <p className="text-lg text-gray-600">Manage user accounts and permissions</p>
          </div>
        </div>
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          <div className="md:w-48">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <Dropdown
              options={[
                { value: "", label: "All Roles" },
                { value: "participant", label: "Participants" },
                { value: "admin", label: "Admins" }
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Roles"
              icon={<Filter className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Users ({totalFilteredUsers})
          </h2>
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredUsers)} of {totalFilteredUsers}
          </div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been created yet.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Dropdown
                          options={[
                            { value: "participant", label: "Participant" },
                            { value: "admin", label: "Admin" }
                          ]}
                          value={user.role}
                          onChange={(newRole) => handleRoleChange(user.id, newRole as 'participant' | 'admin')}
                          className={`text-sm font-medium ${
                            user.role === 'admin' 
                              ? 'text-amber-800' 
                              : 'text-green-800'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Award className="w-4 h-4 text-yellow-500 mr-1" />
                            {user.total_points} points
                          </div>
                          <div className="flex items-center text-gray-500">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {user.submission_count || 0} submissions
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.telegram_id ? (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">✓ Linked</div>
                            {user.telegram_username && (
                              <div className="text-gray-500">@{user.telegram_username}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.partner_id ? (
                          <div className="text-sm">
                            <div className="text-blue-600 font-medium">🤝 {user.partner_name}</div>
                            {user.partner_telegram && (
                              <div className="text-gray-500">@{user.partner_telegram}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No partner</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLinkModal(user)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Create partnership with another user"
                          >
                            <Link className="w-4 h-4" />
                          </button>
                          {user.id !== parseInt(session.user?.id || '0') && (
                            <button
                              onClick={() => deleteUser(user.id, user.name)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <User className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'participant' | 'admin')}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${
                        user.role === 'admin' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-green-100 text-green-800'
                      }`}
                      disabled={user.id === parseInt(session.user?.id || '0')}
                    >
                      <option value="participant">Participant</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <Award className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{user.total_points} points</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{user.submission_count || 0} submissions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Joined</div>
                      <div className="text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Telegram & Partner */}
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Telegram:</span>
                      {user.telegram_id ? (
                        <div className="text-right">
                          <div className="text-green-600 text-sm font-medium">✓ Linked</div>
                          {user.telegram_username && (
                            <div className="text-gray-500 text-xs">@{user.telegram_username}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not linked</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Partner:</span>
                      {user.partner_id ? (
                        <div className="text-right">
                          <div className="text-blue-600 text-sm font-medium">🤝 {user.partner_name}</div>
                          {user.partner_telegram && (
                            <div className="text-gray-500 text-xs">@{user.partner_telegram}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No partner</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center space-x-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex items-center px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => openLinkModal(user)}
                      className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Link className="w-4 h-4 mr-1" />
                      <span className="text-sm">Link</span>
                    </button>
                    {user.id !== parseInt(session.user?.id || '0') && (
                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-sm">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-amber-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Telegram Linked</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.telegram_id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit User: {editingUser.name}
                </h2>
                <button 
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'participant' | 'admin' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={editingUser.id === parseInt(session.user?.id || '0')}
                  >
                    <option value="participant">Participant</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editingUser.id === parseInt(session.user?.id || '0') && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Points
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                    {editingUser?.total_points || 0} points (auto-calculated)
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Points are automatically calculated from approved submissions</p>
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
                    onClick={closeEditModal}
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
                    {submitting ? 'Saving...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Link Users Modal */}
      {showLinkModal && linkingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Link User: {linkingUser.name}
                </h2>
                <button 
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select a user to partner with &quot;{linkingUser.name}&quot;. Partners will share points and appear together on the leaderboard while maintaining separate accounts.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Search by name, email, or @username..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Users ({availableUsersForLinking.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                    {availableUsersForLinking.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {linkSearchTerm ? 'No users match your search' : 'No available users to link'}
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {availableUsersForLinking.map(user => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedTargetUser(user.id.toString())}
                            className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                              selectedTargetUser === user.id.toString()
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.telegram_username && (
                                  <div className="text-sm text-blue-600">@{user.telegram_username}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.total_points} pts
                                </div>
                                {user.telegram_id && (
                                  <div className="text-xs text-green-600">Telegram ✓</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <strong>Partnership Benefits:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Shared points and leaderboard ranking</li>
                        <li>Both accounts remain active and separate</li>
                        <li>Can be unlinked by admin if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkSearchTerm('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkUsers}
                  disabled={!selectedTargetUser || submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Linking...' : 'Link Users'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {showConfirmModal && pendingUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Role Change</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to change this user&apos;s role to{' '}
                <span className="font-semibold">
                  {pendingUpdate.newRole === 'admin' ? 'Admin' : 'Participant'}
                </span>
                ?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-700">
                    <strong>Important:</strong> This action will immediately change the user&apos;s permissions and access level.
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingUpdate(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleUpdate}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}