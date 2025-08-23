import { Target, Users, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading', 
  submessage = 'Please wait...',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: { 
      ring: 'w-10 h-10', 
      dot: 'w-2 h-2', 
      border: 'border-2',
      icon: 'w-2.5 h-2.5',
      text: 'text-sm',
      subtext: 'text-xs'
    },
    md: { 
      ring: 'w-14 h-14', 
      dot: 'w-2.5 h-2.5', 
      border: 'border-[3px]',
      icon: 'w-3 h-3',
      text: 'text-base',
      subtext: 'text-sm'
    },
    lg: { 
      ring: 'w-16 h-16', 
      dot: 'w-3 h-3', 
      border: 'border-4',
      icon: 'w-4 h-4',
      text: 'text-lg',
      subtext: 'text-sm'
    }
  };

  const classes = sizeClasses[size];

  const content = (
    <div className="text-center">
      {/* Modern loading animation */}
      <div className="relative mb-6">
        {/* Outer rotating ring */}
        <div className={`${classes.ring} mx-auto relative`}>
          <div className={`absolute inset-0 ${classes.border} border-primary-200 rounded-full`}></div>
          <div className={`absolute inset-0 ${classes.border} border-transparent border-t-primary-600 rounded-full animate-spin`}></div>
          
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${classes.dot} bg-primary-600 rounded-full animate-pulse`}></div>
          </div>
        </div>
        
        {/* Floating quest icons */}
        <div className="absolute -top-6 -left-6 opacity-30">
          <Target className={`${classes.icon} text-primary-500 animate-bounce`} style={{ animationDelay: '0s', animationDuration: '2s' }} />
        </div>
        <div className="absolute -top-3 -right-5 opacity-20">
          <Users className={`${classes.icon} text-secondary-500 animate-bounce`} style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
        </div>
        <div className="absolute -bottom-5 -left-3 opacity-25">
          <Sparkles className={`${classes.icon} text-accent-500 animate-bounce`} style={{ animationDelay: '1s', animationDuration: '3s' }} />
        </div>
      </div>
      
      {/* Loading text with typing animation */}
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-1">
          <span className={`${classes.text} font-medium text-gray-700`}>{message}</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-1 h-1 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        <p className={`${classes.subtext} text-gray-500`}>{submessage}</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

// Skeleton loading components for better UX
export function QuestCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function QuestGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <QuestCardSkeleton key={i} />
      ))}
    </div>
  );
}