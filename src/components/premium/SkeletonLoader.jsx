// src/components/premium/SkeletonLoader.jsx
// PREMIUM: Skeleton loading states for perceived performance
// Placeholder components that mimic content shape during loading

import React from 'react';

/**
 * Base skeleton pulse animation
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className || ''}`}
      style={{
        animation: 'shimmer 2s infinite linear',
        backgroundSize: '200% 100%'
      }}
      {...props}
    />
  );
}

/**
 * Skeleton for a single chat message bubble
 */
export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-gray-100">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" /> {/* Role label */}
        <Skeleton className="h-16 w-full rounded-lg" /> {/* Message bubble */}
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for reasoning panel
 */
export function ReasoningSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-l-4 border-blue-200 pl-3">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5 mt-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for citation badges
 */
export function CitationSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 p-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-6 w-20 rounded-full" />
      ))}
    </div>
  );
}

/**
 * Full chat screen skeleton
 */
export function ChatScreenSkeleton({ messageCount = 5 }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="p-4 border-b flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: messageCount }).map((_, i) => (
          <ChatMessageSkeleton key={i} />
        ))}
      </div>

      {/* Input area skeleton */}
      <div className="p-4 border-t">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for evaluation dashboard cards
 */
export function StatCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/**
 * Skeleton for evaluation table rows
 */
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <div className="flex gap-4 p-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  );
}

export default {
  Skeleton,
  ChatMessageSkeleton,
  ReasoningSkeleton,
  CitationSkeleton,
  ChatScreenSkeleton,
  StatCardSkeleton,
  TableRowSkeleton
};
