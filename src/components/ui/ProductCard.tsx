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
}

export default function ProductCard({
  title,
  slug,
  salePrice,
  originalPrice,
  badge,
  imageUrl,
  categoryName,
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
      className="group flex flex-col border border-outline-variant bg-surface-container-lowest overflow-hidden rounded-lg transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutalist active:translate-x-0 active:translate-y-0 active:shadow-none relative"
    >
      {/* Image container */}
      <div className="w-full aspect-[3/4] bg-surface-container-low relative overflow-hidden rounded-t-lg">
        <Image
          src={displayImage}
          alt={title}
          fill
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
          {/* Gamification / Urgency Badges */}
          {!badge && (slug.length % 3 === 0) && (
            <span className="bg-[#FFBF00] text-primary font-label-sm text-[10px] uppercase font-black px-1.5 py-0.5 tracking-wider border border-[#B38600] rounded shadow-sm animate-pulse">
              Forte demande 🔥
            </span>
          )}
          {!badge && (slug.length % 5 === 0) && (
            <span className="bg-primary text-accent font-label-sm text-[10px] uppercase font-black px-1.5 py-0.5 tracking-wider border border-accent rounded shadow-sm">
              Plus que 2 en stock
            </span>
          )}
        </div>
      </div>

      {/* Info Block (Zero Gap) */}
      <div className="p-sm flex flex-col border-t border-outline-variant flex-grow justify-between min-h-[95px]">
        <div>
          {categoryName && (
            <span className="font-label-sm text-[9px] uppercase font-bold text-outline tracking-wider">
              {categoryName}
            </span>
          )}
          <h3 className="font-label-sm text-xs sm:text-sm uppercase font-bold text-primary truncate group-hover:text-accent transition-colors leading-tight mt-0.5">
            {title}
          </h3>
        </div>

        <div className="mt-sm flex flex-col">
          {originalPrice && originalPrice > salePrice && (
            <span className="text-[11px] text-outline line-through font-display font-bold">
              {originalPrice.toLocaleString('fr-FR')} FCFA
            </span>
          )}
          <div className="font-display text-sm sm:text-base font-black text-primary flex items-baseline gap-xs">
            <span className={originalPrice && originalPrice > salePrice ? 'text-accent font-black' : ''}>
              {salePrice.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] font-sans font-bold text-secondary uppercase">FCFA</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
