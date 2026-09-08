'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import type { UpsellProduct } from '@/app/api/upsells/route';

interface UpsellProductRowProps {
  /** Section title displayed above the row */
  title?: string;
  /** Category ID to filter suggestions (same category as current product) */
  categoryId?: string;
  /** Slug of the product to exclude (e.g. the product currently being viewed) */
  excludeSlug?: string;
  /** Variant IDs already in cart — used to exclude their parent products */
  excludeIds?: string[];
  /** Max number of upsell products to show */
  limit?: number;
  /** Compact mode: smaller cards, used at checkout */
  compact?: boolean;
  /** Optional class overrides for the wrapper */
  className?: string;
}

interface AddingState {
  [variantId: string]: 'idle' | 'adding' | 'added';
}

// Skeleton card for loading state
function UpsellCardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex-shrink-0 animate-pulse bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col ${
        compact ? 'w-[120px]' : 'w-[140px]'
      }`}
    >
      <div className={`w-full bg-surface-container-high ${compact ? 'h-[90px]' : 'h-[110px]'}`} />
      <div className="p-2 flex flex-col gap-1.5">
        <div className="h-2.5 bg-surface-container-high rounded w-4/5" />
        <div className="h-2.5 bg-surface-container-high rounded w-2/5" />
        <div className="h-7 bg-surface-container-high rounded-lg mt-1" />
      </div>
    </div>
  );
}

export default function UpsellProductRow({
  title = 'Tu pourrais aussi aimer',
  categoryId,
  excludeSlug = '',
  excludeIds = [],
  limit = 4,
  compact = false,
  className = '',
}: UpsellProductRowProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingState, setAddingState] = useState<AddingState>({});

  const fetchUpsells = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      if (excludeSlug) params.set('excludeSlug', excludeSlug);
      if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','));
      params.set('limit', String(limit));

      const res = await fetch(`/api/upsells?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch upsells');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, excludeSlug, excludeIds.join(','), limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUpsells();
  }, [fetchUpsells]);

  const handleAddToCart = (product: UpsellProduct) => {
    if (!product.first_variant_id || addingState[product.first_variant_id] !== 'idle' && addingState[product.first_variant_id] !== undefined) return;

    setAddingState((prev) => ({ ...prev, [product.first_variant_id!]: 'adding' }));

    addToCart(
      {
        id: product.first_variant_id!,
        productId: product.id,
        title: product.title,
        slug: product.slug,
        size: '', // Will be shown as a generic add — user can refine
        color: '',
        price: Number(product.sale_price),
        imageUrl: product.image_url || '/fallback_product.webp',
        maxStock: 99,
      },
      1,
      false // Don't open cart drawer on upsell add — stay in context
    );

    setTimeout(() => {
      setAddingState((prev) => ({ ...prev, [product.first_variant_id!]: 'added' }));
      setTimeout(() => {
        setAddingState((prev) => ({ ...prev, [product.first_variant_id!]: 'idle' }));
      }, 1200);
    }, 400);
  };

  // Don't render if no products and not loading
  if (!isLoading && products.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-wider text-primary">
          {title}
        </span>
      </div>

      {/* Horizontal Scroll Row */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
        <AnimatePresence>
          {isLoading
            ? Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
                <UpsellCardSkeleton key={`skel-${i}`} compact={compact} />
              ))
            : products.map((product, index) => {
                const state = addingState[product.first_variant_id ?? ''] ?? 'idle';
                const isAdded = state === 'added';
                const isAdding = state === 'adding';

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                    className={`flex-shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col group transition-shadow hover:shadow-md hover:border-primary/40 ${
                      compact ? 'w-[120px]' : 'w-[140px]'
                    }`}
                  >
                    {/* Product Image (links to PDP) */}
                    <Link
                      href={`/products/${product.slug}`}
                      className={`relative block w-full overflow-hidden bg-surface-container-low flex-shrink-0 ${
                        compact ? 'h-[90px]' : 'h-[110px]'
                      }`}
                    >
                      <Image
                        src={product.image_url || '/fallback_product.webp'}
                        alt={product.title}
                        fill
                        sizes={compact ? '120px' : '140px'}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="p-2 flex flex-col gap-1 flex-1 justify-between">
                      <Link href={`/products/${product.slug}`} className="block">
                        <p className="text-[10px] font-bold uppercase text-primary line-clamp-2 leading-tight hover:underline decoration-accent">
                          {product.title}
                        </p>
                      </Link>
                      <p className="font-display text-[11px] font-black text-primary">
                        {Number(product.sale_price).toLocaleString('fr-FR')}{' '}
                        <span className="font-sans font-bold text-[9px] text-secondary">FCFA</span>
                      </p>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.first_variant_id || isAdding}
                        className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all duration-200 active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : isAdding
                            ? 'bg-surface-container-high text-outline cursor-not-allowed'
                            : !product.first_variant_id
                            ? 'bg-surface-container-high text-outline cursor-not-allowed opacity-60'
                            : 'bg-primary text-accent hover:bg-accent hover:text-primary border border-primary'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Ajouté</span>
                          </>
                        ) : isAdding ? (
                          <span>...</span>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Ajouter</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </div>
    </div>
  );
}
