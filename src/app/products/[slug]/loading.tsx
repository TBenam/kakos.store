import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-container-margin py-lg flex flex-col gap-lg animate-pulse relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <img src="/logo.png" alt="Loading KAKOS" className="h-48 w-auto object-contain opacity-[0.03]" />
      </div>
      {/* Breadcrumb Skeleton */}
      <div className="h-3 w-40 bg-surface-container-high rounded" />

      {/* Grid: Image Gallery Left, Details Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-start">
        {/* Main Image */}
        <div className="w-full aspect-[3/4] bg-surface-container-high rounded-lg" />

        {/* Details Column */}
        <div className="flex flex-col gap-md">
          <div className="h-4 w-24 bg-surface-container-high rounded" />
          <div className="h-10 w-3/4 bg-surface-container-high rounded" />
          <div className="h-8 w-32 bg-surface-container-high rounded mt-2" />

          <div className="border-t border-outline-variant my-sm" />

          {/* Sizes */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-16 bg-surface-container-high rounded" />
            <div className="flex gap-2">
              <div className="h-10 w-12 bg-surface-container-high rounded" />
              <div className="h-10 w-12 bg-surface-container-high rounded" />
              <div className="h-10 w-12 bg-surface-container-high rounded" />
            </div>
          </div>

          {/* Action Button */}
          <div className="h-14 w-full bg-surface-container-high rounded-lg mt-4" />
        </div>
      </div>
    </div>
  );
}
