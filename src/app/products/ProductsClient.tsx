'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';

export interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  originalPrice?: number;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  isPromo?: boolean;
  promoBadge?: string;
}

export default function ProductsClient({ products }: { products: CatalogProduct[] }) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.categoryName && p.categorySlug) {
        map.set(p.categorySlug, p.categoryName);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category / Promo filter
      let matchesFilter = true;
      if (selectedFilter === 'promos') {
        matchesFilter = !!p.isPromo;
      } else if (selectedFilter !== 'all') {
        matchesFilter = p.categorySlug === selectedFilter;
      }

      // Search query filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          p.title.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q);
      }

      return matchesFilter && matchesSearch;
    });
  }, [products, selectedFilter, searchQuery]);

  const promoCount = useMemo(() => products.filter((p) => p.isPromo).length, [products]);

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-container-margin py-lg flex flex-col gap-lg selection:bg-accent selection:text-primary">
      {/* 1. Breadcrumb & Page Title */}
      <div className="flex flex-col gap-xs border-b border-outline-variant pb-md">
        <div className="flex items-center gap-xs text-[10px] uppercase font-bold text-outline">
          <Link href="/" className="hover:text-primary transition-colors">
            ACCUEIL
          </Link>
          <span>/</span>
          <span className="text-secondary">CATALOGUE COMPLET & MÉGA PROMOS</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tighter uppercase text-primary leading-none">
              SHOP ALL // <span className="text-accent italic">COLLECTION</span>
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-secondary uppercase tracking-wider mt-2">
              L'intégralité du vestiaire urbain KAKOS au meilleur prix garanti.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-outline-variant">
              {filteredProducts.length} ARTICLE{filteredProducts.length > 1 ? 'S' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`font-label-sm text-xs uppercase font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-primary text-white shadow-brutalist'
                : 'bg-surface border border-outline-variant text-primary hover:border-primary'
            }`}
          >
            Tous ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('promos')}
            className={`font-label-sm text-xs uppercase font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'promos'
                ? 'bg-accent text-primary shadow-brutalist border border-accent'
                : 'bg-surface border border-accent/60 text-accent hover:bg-accent hover:text-primary'
            }`}
          >
            <span>🔥</span>
            <span>Mégas Promos ({promoCount})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedFilter(cat.slug)}
              className={`font-label-sm text-xs uppercase font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === cat.slug
                  ? 'bg-primary text-white shadow-brutalist'
                  : 'bg-surface border border-outline-variant text-primary hover:border-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par nom..."
            className="w-full bg-surface border border-outline-variant text-primary text-xs font-bold uppercase placeholder:text-outline px-3 py-2.5 pl-8 rounded-lg focus:outline-none focus:border-accent"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
            search
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="w-full text-center py-20 border border-dashed border-outline-variant flex flex-col items-center justify-center gap-4 rounded-lg bg-surface-container-lowest">
          <span className="material-symbols-outlined text-5xl text-outline">
            sentiment_dissatisfied
          </span>
          <div>
            <h3 className="font-display text-2xl uppercase font-black text-primary">
              Aucun produit trouvé
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary mt-1">
              Aucun article ne correspond à votre filtre actuel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="bg-primary text-white font-label-sm text-xs uppercase font-bold py-2.5 px-6 rounded-lg hover:bg-accent hover:text-primary transition-all cursor-pointer shadow-brutalist"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  salePrice={product.salePrice}
                  originalPrice={product.originalPrice}
                  categoryName={product.categoryName}
                  imageUrl={product.imageUrl}
                  badge={product.promoBadge || (product.isPromo ? 'MÉGA PROMO' : undefined)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
