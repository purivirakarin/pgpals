'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Activity } from 'lucide-react';
import ActivityFeed from '../../../components/ActivityFeed';

export default function AdminActivitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Activity className="w-8 h-8 mr-3 text-blue-600" />
              Activity Log
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor all platform activities and user interactions
            </p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card p-6">
          <ActivityFeed 
            limit={10} 
            enableSearch={true} 
            enablePagination={true} 
            showRefresh={true}
            maxHeight="none"
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
}
