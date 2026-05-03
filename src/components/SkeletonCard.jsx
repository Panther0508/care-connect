import React from 'react';

const SkeletonCard = ({ lines = 3, variant = 'default' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'wide':
        return 'p-6 w-full';
      default:
        return 'p-4';
    }
  };

  // Variant-specific layouts
  const renderVariant = () => {
    switch (variant) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            {/* Greeting bar */}
            <div className="h-8 bg-slate-700 rounded w-2/3 skeleton-shimmer"></div>
            {/* Wellness ring placeholder */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-slate-700 rounded-full skeleton-shimmer"></div>
              <div className="space-y-1">
                <div className="h-4 bg-slate-700 rounded w-1/2 skeleton-shimmer"></div>
                <div className="h-2 bg-slate-700 rounded w-1/3 skeleton-shimmer"></div>
              </div>
            </div>
            {/* 4 horizontal cards */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-700 rounded skeleton-shimmer"></div>
              ))}
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="space-y-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-700 rounded-full skeleton-shimmer"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 skeleton-shimmer"></div>
                  <div className="h-2 bg-slate-700 rounded w-1/2 skeleton-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'chat':
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i, index) => (
              <div key={i} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="space-y-1 max-w-xs">
                  <div className={`h-6 rounded-lg skeleton-shimmer ${index % 2 === 0 ? 'bg-slate-700 w-40' : 'bg-slate-600/50 w-32'}`}></div>
                  <div className={`h-4 rounded-lg skeleton-shimmer ${index % 2 === 0 ? 'bg-slate-700 w-52' : 'bg-slate-600/50 w-44'}`}></div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-16 bg-slate-700 rounded skeleton-shimmer"></div>
            ))}
          </div>
        );
      case 'detail':
        return (
          <div className="space-y-6">
            {/* Large header bar */}
            <div className="h-12 bg-slate-700 rounded w-2/3 skeleton-shimmer"></div>
            {/* Content blocks */}
            <div className="space-y-4">
              <div className="h-8 bg-slate-700 rounded w-1/2 skeleton-shimmer"></div>
              <div className="h-6 bg-slate-700 rounded w-3/4 skeleton-shimmer"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3 skeleton-shimmer"></div>
              <div className="h-6 bg-slate-700 rounded w-1/2 skeleton-shimmer"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            {/* Title placeholder */}
            <div className="h-6 bg-slate-700 rounded mb-2 skeleton-shimmer"></div>
            {/* Subtitle or badges */}
            <div className="h-4 bg-slate-700 rounded mb-3 w-3/4 skeleton-shimmer"></div>
            {/* Additional lines */}
            {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-700 rounded mb-2 skeleton-shimmer"></div>
            ))}
            {/* Action button placeholder */}
            <div className="h-10 bg-slate-700 rounded mt-4 w-24 skeleton-shimmer"></div>
          </div>
        );
    }
  };

  return (
    <div
      className={`glass-card ${getVariantClasses()} skeleton-container`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="skeleton-content">
        {renderVariant()}
      </div>
      {/* Breathing animation overlay */}
      <div className="skeleton-breathing"></div>
    </div>
  );
};

export default SkeletonCard;