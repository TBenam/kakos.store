import React from 'react';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

export default function CategoryLoading() {
  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-container-margin py-lg flex flex-col gap-lg animate-pulse relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <img src="/logo.png" alt="Loading KAKOS" className="h-48 w-auto object-contain opacity-[0.03]" />
      </div>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 border-b border-outline-variant pb-sm">
        <div className="h-3 w-28 bg-surface-container-high rounded" />
        <div className="h-10 sm:h-12 w-64 bg-surface-container-high rounded mt-1" />
        <div className="h-4 w-80 max-w-full bg-surface-container-high rounded" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
