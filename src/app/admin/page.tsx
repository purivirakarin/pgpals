'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Target, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import ActivityFeed from '@/components/ActivityFeed';

interface DashboardStats {
  totalUsers: number;
  totalQuests: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchDashboardStats();
  }, [session, status, router]);

  const fetchDashboardStats = async () => {
    try {
      const [usersRes, questsRes, submissionsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/quests'),
        fetch('/api/admin/submissions')
      ]);

      const users = await usersRes.json();
      const quests = await questsRes.json();
      const submissions = await submissionsRes.json();

      const pendingSubmissions = submissions.filter((s: any) => 
        s.status === 'pending_ai' || s.status === 'manual_review'
      ).length;
      
      const approvedSubmissions = submissions.filter((s: any) => 
        s.status === 'approved' || s.status === 'ai_approved'
      ).length;
      
      const rejectedSubmissions = submissions.filter((s: any) => 
        s.status === 'rejected' || s.status === 'ai_rejected'
      ).length;

      setStats({
        totalUsers: users.length,
        totalQuests: quests.length,
        totalSubmissions: submissions.length,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      href: '/admin/users',
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Manage Quests',
      description: 'Create, edit, and manage quests',
      href: '/admin/quests',
      icon: Target,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Review Submissions',
      description: 'Review pending quest submissions',
      href: '/admin/submissions',
      icon: FileText,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Broadcast Message',
      description: 'Send notifications to all Telegram users',
      href: '/admin/broadcast',
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-amber-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600">
          Welcome back, {session.user?.name}! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Quests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuests}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedSubmissions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-gray-600 mt-2">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {stats && stats.pendingSubmissions > 0 && (
        <div className="card p-6 bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                {stats.pendingSubmissions} submissions need review
              </h3>
              <p className="text-orange-800 mt-1">
                Some quest submissions are waiting for review. 
                <Link href="/admin/submissions" className="ml-1 font-medium underline">
                  Review now →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card p-6">
        <ActivityFeed 
          limit={10} 
          enableSearch={false} 
          enablePagination={true} 
          showRefresh={true}
          maxHeight="600px"
        />
      </div>
      </div>
    </div>
  );
}