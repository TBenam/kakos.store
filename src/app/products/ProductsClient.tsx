'use client';

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export interface CatalogCategory {
  name: string;
  slug: string;
}

interface ProductsClientProps {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  currentPage: number;
  totalItems: number;
  pageSize: number;
  initialCategory: string;
  initialSearch: string;
  promosOnly: boolean;
  initialSort: string;
  adultTheme?: boolean;
}

export default function ProductsClient({
  products,
  categories,
  currentPage,
  totalItems,
  pageSize,
  initialCategory,
  initialSearch,
  promosOnly,
  initialSort,
  adultTheme = false,
}: ProductsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstShown = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, totalItems);

  function navigate(changes: Record<string, string | null>, resetPage = true) {
    const params = new URLSearchParams();
    if (initialCategory) params.set('category', initialCategory);
    if (initialSearch) params.set('q', initialSearch);
    if (promosOnly) params.set('promos', '1');
    if (initialSort !== 'newest') params.set('sort', initialSort);
    if (!resetPage && currentPage > 1) params.set('page', String(currentPage));
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.delete('page');
    startTransition(() => router.push(`/products${params.size ? `?${params.toString()}` : ''}`));
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    navigate({ q: searchQuery.trim() || null });
  }

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (initialCategory) params.set('category', initialCategory);
    if (initialSearch) params.set('q', initialSearch);
    if (promosOnly) params.set('promos', '1');
    if (initialSort !== 'newest') params.set('sort', initialSort);
    if (page > 1) params.set('page', String(page));
    return `/products${params.size ? `?${params.toString()}` : ''}`;
  }

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <div className={`${adultTheme ? 'max-w-none bg-[#080505] text-white [&_.border-outline-variant]:!border-red-950 [&_.bg-surface]:!bg-[#14090a] [&_.bg-surface-container-low\/95]:!bg-[#14090a]/95 [&_.text-primary]:!text-white [&_.text-secondary]:!text-zinc-300 [&_.text-outline]:!text-zinc-400' : 'max-w-[1280px]'} mx-auto flex w-full flex-grow flex-col gap-lg px-container-margin py-lg transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-xs border-b border-outline-variant pb-md">
        <div className="flex items-center gap-xs text-[10px] font-bold uppercase text-outline">
          <Link href="/" className="hover:text-primary">Accueil</Link><span>/</span><span className="text-secondary">Catalogue</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tighter text-primary sm:text-6xl">{adultTheme ? 'Intimité & bien-être 18+' : 'Le catalogue KAKOS'}</h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-secondary">{adultTheme ? 'Sélection confidentielle · Emballage neutre · Livraison discrète' : 'Explorez par rayon, prix ou nouveauté sans défilement interminable.'}</p>
          </div>
          <span className={`w-fit rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-white ${adultTheme ? 'bg-red-700' : 'bg-primary'}`}>{firstShown}–{lastShown} sur {totalItems}</span>
        </div>
      </div>

      <div className="sticky top-2 z-20 flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low/95 p-4 shadow-sm backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <button onClick={() => navigate({ category: null, promos: null })} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold uppercase ${!initialCategory && !promosOnly ? 'bg-primary text-white' : 'border border-outline-variant bg-surface text-primary'}`}>Tous</button>
          <button onClick={() => navigate({ promos: promosOnly ? null : '1', category: null })} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-black uppercase ${promosOnly ? 'bg-accent text-primary' : 'border border-accent/60 bg-surface text-accent'}`}>Promotions réelles</button>
          {categories.map((category) => (
            <button key={category.slug} onClick={() => navigate({ category: category.slug, promos: null })} className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase ${initialCategory === category.slug ? 'bg-primary text-white' : 'border border-outline-variant bg-surface text-primary'}`}>
              {category.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={submitSearch} className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline">search</span>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher un article…" className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-10 pr-24 text-sm font-bold text-primary focus:border-accent focus:outline-none" />
            <button type="submit" className="absolute right-1.5 top-1.5 rounded-md bg-primary px-3 py-1.5 text-[10px] font-black uppercase text-white">Chercher</button>
          </form>
          <select value={initialSort} onChange={(event) => navigate({ sort: event.target.value === 'newest' ? null : event.target.value })} className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-xs font-bold uppercase text-primary">
            <option value="newest">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-outline-variant py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
          <div><h2 className="font-display text-2xl font-black uppercase text-primary">Aucun article trouvé</h2><p className="mt-1 text-sm text-secondary">Essayez un autre rayon ou une recherche plus courte.</p></div>
          <Link href="/products" className="rounded-lg bg-primary px-6 py-3 text-xs font-black uppercase text-white">Voir tout le catalogue</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} id={product.id} title={product.title} slug={product.slug} salePrice={product.salePrice} originalPrice={product.originalPrice} categoryName={product.categoryName} imageUrl={product.imageUrl} badge={product.promoBadge} adultTheme={adultTheme} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination du catalogue" className="flex flex-wrap items-center justify-center gap-2 border-t border-outline-variant pt-6">
          {currentPage > 1 && <Link href={pageHref(currentPage - 1)} className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-black uppercase text-primary hover:border-accent">← Précédent</Link>}
          {visiblePages.map((page, index) => {
            const previous = visiblePages[index - 1];
            return (
              <span key={page} className="contents">
                {previous && page - previous > 1 && <span className="px-1 text-outline">…</span>}
                <Link href={pageHref(page)} aria-current={page === currentPage ? 'page' : undefined} className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-black ${page === currentPage ? 'bg-primary text-white' : 'border border-outline-variant text-primary hover:border-accent'}`}>{page}</Link>
              </span>
            );
          })}
          {currentPage < totalPages && <Link href={pageHref(currentPage + 1)} className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-black uppercase text-primary hover:border-accent">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
