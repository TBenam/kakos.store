import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col border border-outline-variant bg-surface-container-lowest overflow-hidden rounded-lg animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-[3/4] bg-surface-container-high relative overflow-hidden flex items-center justify-center">
        <img src="/logo.png" alt="Loading KAKOS" className="h-16 w-auto object-contain opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Info Block Skeleton */}
      <div className="p-sm flex flex-col border-t border-outline-variant flex-grow justify-between min-h-[95px] gap-2">
        <div className="flex flex-col gap-1.5">
          {/* Category Tag */}
          <div className="h-2.5 w-16 bg-surface-container-highest rounded" />
          {/* Title */}
          <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
        </div>

        {/* Price */}
        <div className="h-5 w-24 bg-surface-container-highest rounded mt-1" />
      </div>
    </div>
  );
}
