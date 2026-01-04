import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'cards' | 'list' | 'profile' | 'page';
  count?: number;
  message?: string;
  className?: string;
}

export default function LoadingState({
  type = 'spinner',
  count = 3,
  message = 'Chargement...',
  className = ''
}: LoadingStateProps) {
  // Spinner simple
  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <Loader2 
          className="h-10 w-10 animate-spin mb-4" 
          style={{ color: '#C75B39' }} 
        />
        <p style={{ color: '#6B6560' }}>{message}</p>
      </div>
    );
  }

  // Skeleton pour cartes de services
  if (type === 'cards') {
    return (
      <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="rounded-sm overflow-hidden"
            style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
          >
            <Skeleton className="h-48 w-full" style={{ background: '#E8E2D9' }} />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" style={{ background: '#E8E2D9' }} />
                <Skeleton className="h-4 w-24" style={{ background: '#E8E2D9' }} />
              </div>
              <Skeleton className="h-4 w-full" style={{ background: '#E8E2D9' }} />
              <Skeleton className="h-4 w-3/4" style={{ background: '#E8E2D9' }} />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-5 w-20" style={{ background: '#E8E2D9' }} />
                <Skeleton className="h-5 w-16" style={{ background: '#E8E2D9' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Skeleton pour liste
  if (type === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i}
            className="p-4 rounded-sm flex items-center gap-4"
            style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
          >
            <Skeleton className="h-16 w-16 rounded-sm shrink-0" style={{ background: '#E8E2D9' }} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" style={{ background: '#E8E2D9' }} />
              <Skeleton className="h-4 w-1/2" style={{ background: '#E8E2D9' }} />
            </div>
            <Skeleton className="h-8 w-24 rounded-sm" style={{ background: '#E8E2D9' }} />
          </div>
        ))}
      </div>
    );
  }

  // Skeleton pour profil
  if (type === 'profile') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" style={{ background: '#E8E2D9' }} />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" style={{ background: '#E8E2D9' }} />
            <Skeleton className="h-4 w-32" style={{ background: '#E8E2D9' }} />
            <Skeleton className="h-4 w-full" style={{ background: '#E8E2D9' }} />
            <Skeleton className="h-4 w-3/4" style={{ background: '#E8E2D9' }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-sm" style={{ background: '#E8E2D9' }} />
          ))}
        </div>
      </div>
    );
  }

  // Skeleton pour page entière
  if (type === 'page') {
    return (
      <div className={`min-h-screen ${className}`} style={{ background: '#FAF7F2' }}>
        {/* Header skeleton */}
        <div className="h-16 border-b" style={{ background: '#FFFDFB', borderColor: '#E8E2D9' }}>
          <div className="container h-full flex items-center justify-between">
            <Skeleton className="h-8 w-32" style={{ background: '#E8E2D9' }} />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" style={{ background: '#E8E2D9' }} />
              <Skeleton className="h-8 w-20" style={{ background: '#E8E2D9' }} />
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-64" style={{ background: '#E8E2D9' }} />
          <Skeleton className="h-4 w-96" style={{ background: '#E8E2D9' }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-sm" style={{ background: '#E8E2D9' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Skeleton générique
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-12 w-full rounded-sm" 
          style={{ background: '#E8E2D9' }} 
        />
      ))}
    </div>
  );
}

// Composants skeleton spécifiques exportés
export function ServiceCardSkeleton() {
  return (
    <div 
      className="rounded-sm overflow-hidden"
      style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
    >
      <Skeleton className="h-48 w-full" style={{ background: '#E8E2D9' }} />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" style={{ background: '#E8E2D9' }} />
          <Skeleton className="h-4 w-24" style={{ background: '#E8E2D9' }} />
        </div>
        <Skeleton className="h-4 w-full" style={{ background: '#E8E2D9' }} />
        <Skeleton className="h-4 w-3/4" style={{ background: '#E8E2D9' }} />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-5 w-20" style={{ background: '#E8E2D9' }} />
          <Skeleton className="h-5 w-16" style={{ background: '#E8E2D9' }} />
        </div>
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div 
      className="p-6 rounded-sm"
      style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
    >
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-3/4" style={{ background: '#E8E2D9' }} />
        <Skeleton className="h-6 w-20 rounded-full" style={{ background: '#E8E2D9' }} />
      </div>
      <Skeleton className="h-4 w-full mb-2" style={{ background: '#E8E2D9' }} />
      <Skeleton className="h-4 w-2/3 mb-4" style={{ background: '#E8E2D9' }} />
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-sm" style={{ background: '#E8E2D9' }} />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" style={{ background: '#E8E2D9' }} />
        <Skeleton className="h-8 w-28 rounded-sm" style={{ background: '#E8E2D9' }} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-sm overflow-hidden" style={{ border: '1px solid #E8E2D9' }}>
      {/* Header */}
      <div className="p-4 flex gap-4" style={{ background: '#FAF7F2' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" style={{ background: '#E8E2D9' }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="p-4 flex gap-4"
          style={{ background: '#FFFDFB', borderTop: '1px solid #E8E2D9' }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" style={{ background: '#E8E2D9' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
