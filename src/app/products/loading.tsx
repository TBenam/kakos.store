import React from 'react';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

export default function ProductsLoading() {
  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-container-margin py-lg flex flex-col gap-lg animate-pulse relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <img src="/logo.png" alt="Loading KAKOS" className="h-48 w-auto object-contain opacity-[0.03]" />
      </div>
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-2 border-b border-outline-variant pb-md">
        <div className="h-3 w-32 bg-surface-container-high rounded" />
        <div className="h-10 sm:h-14 w-72 bg-surface-container-high rounded mt-2" />
        <div className="h-4 w-96 max-w-full bg-surface-container-high rounded" />
      </div>

      {/* 2. Filter Pills Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="h-8 w-20 bg-surface-container-high rounded-lg" />
          <div className="h-8 w-32 bg-surface-container-high rounded-lg" />
          <div className="h-8 w-24 bg-surface-container-high rounded-lg" />
          <div className="h-8 w-28 bg-surface-container-high rounded-lg" />
          <div className="h-8 w-24 bg-surface-container-high rounded-lg" />
        </div>
        <div className="h-9 w-60 bg-surface-container-high rounded-lg" />
      </div>

      {/* 3. Products Grid Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
