import React from 'react';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

export default function HomeLoading() {
  return (
    <div className="flex flex-col w-full gap-xl pb-xl bg-background text-on-background min-h-screen">
      {/* 1. Hero Skeleton */}
      <section className="relative w-full h-[85vh] min-h-[500px] flex flex-col justify-end px-container-margin py-xl overflow-hidden border-b-4 border-accent bg-zinc-900 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="Loading KAKOS" className="h-32 w-auto object-contain opacity-20" />
        </div>
        <div className="relative z-10 max-w-[896px] flex flex-col gap-4 items-start">
          <div className="h-4 w-36 bg-zinc-800 rounded" />
          <div className="h-16 sm:h-24 w-80 max-w-full bg-zinc-800 rounded" />
          <div className="h-12 w-44 bg-zinc-800 rounded-lg mt-4" />
        </div>
      </section>

      {/* 2. Marquee Placeholder */}
      <div className="w-full bg-accent/20 h-14 border-b-4 border-primary animate-pulse" />

      {/* 3. Categories Quick Links Skeleton */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full flex flex-col gap-md pt-xl animate-pulse">
        <div className="h-10 w-48 bg-surface-container-high rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-xs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-container-high rounded-lg" />
          ))}
        </div>
      </section>

      {/* 4. Latest Drops Skeleton */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full flex flex-col gap-md pt-xl">
        <div className="flex justify-between items-end border-b border-outline-variant pb-2">
          <div className="h-10 w-56 bg-surface-container-high rounded animate-pulse" />
          <div className="h-6 w-24 bg-surface-container-high rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
