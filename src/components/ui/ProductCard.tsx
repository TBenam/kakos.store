import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  originalPrice?: number;
  badge?: string;
  imageUrl?: string;
  categoryName?: string;
  adultTheme?: boolean;
}

export default function ProductCard({
  title,
  slug,
  salePrice,
  originalPrice,
  badge,
  imageUrl,
  categoryName,
  adultTheme = false,
}: ProductCardProps) {
  // Safe default image representing urban premium menswear
  const displayImage =
    imageUrl ||
    '/fallback_product.jpg';

  const isSale = badge?.toLowerCase().includes('sale') || 
                 badge?.toLowerCase().includes('solde') || 
                 badge?.toLowerCase().includes('promo') ||
                 badge?.includes('%');

  const discount = originalPrice && originalPrice > salePrice 
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${slug}`}
      className={`group flex flex-col border overflow-hidden rounded-lg transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutalist active:translate-x-0 active:translate-y-0 active:shadow-none relative ${adultTheme ? 'border-red-950 bg-[#14090a] text-white' : 'border-outline-variant bg-surface-container-lowest'}`}
    >
      {/* Image container */}
      <div className={`w-full aspect-[3/4] relative overflow-hidden rounded-t-lg ${adultTheme ? 'bg-[#1d1011]' : 'bg-surface-container-low'}`}>
        <Image
          src={displayImage}
          alt={title}
          fill
          unoptimized={displayImage.startsWith('http')}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
          loading="lazy"
          className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0 duration-300"
        />

        {/* Badges */}
        <div className="absolute top-sm left-sm flex flex-col gap-1 z-10">
          {badge && (
            <span
              className={`font-label-sm text-[10px] uppercase font-black px-2 py-0.5 tracking-wider border rounded shadow-sm ${
                isSale 
                  ? 'bg-accent text-primary border-accent font-black' 
                  : 'bg-primary text-white border-outline-variant'
              }`}
            >
              {badge}
            </span>
          )}
          {discount > 0 && !badge?.includes('%') && (
            <span className="bg-red-600 text-white font-label-sm text-[10px] uppercase font-black px-1.5 py-0.5 tracking-wider border border-red-500 rounded shadow-sm">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Info Block (Zero Gap) */}
      <div className={`p-sm flex flex-col border-t flex-grow justify-between min-h-[95px] ${adultTheme ? 'border-red-950' : 'border-outline-variant'}`}>
        <div>
          {categoryName && (
            <span className={`font-label-sm text-[9px] uppercase font-bold tracking-wider ${adultTheme ? 'text-red-400' : 'text-outline'}`}>
              {categoryName}
            </span>
          )}
          <h3 className={`font-label-sm text-xs sm:text-sm uppercase font-bold truncate transition-colors leading-tight mt-0.5 ${adultTheme ? 'text-white group-hover:text-red-400' : 'text-primary group-hover:text-accent'}`}>
            {title}
          </h3>
        </div>

        <div className="mt-sm flex flex-col">
          {originalPrice && originalPrice > salePrice && (
            <span className="text-[11px] text-outline line-through font-display font-bold">
              {originalPrice.toLocaleString('fr-FR')} FCFA
            </span>
          )}
          <div className={`font-display text-sm sm:text-base font-black flex items-baseline gap-xs ${adultTheme ? 'text-white' : 'text-primary'}`}>
            <span className={originalPrice && originalPrice > salePrice ? 'text-accent font-black' : ''}>
              {salePrice.toLocaleString('fr-FR')}
            </span>
            <span className={`text-[10px] font-sans font-bold uppercase ${adultTheme ? 'text-zinc-300' : 'text-secondary'}`}>FCFA</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
