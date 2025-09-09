'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function LeaderboardDownloadButton() {
  const { data: session } = useSession();
  const [downloading, setDownloading] = useState(false);
  
  // Only show to admin users
  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      const response = await fetch('/api/leaderboard/csv');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to download CSV');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'leaderboard.csv';
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download CSV. Please try again.';
      alert(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-4 h-4 mr-2" />
      {downloading ? 'Downloading...' : 'Download CSV'}
    </button>
  );
}
