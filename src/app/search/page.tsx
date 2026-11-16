import React from 'react';
import Link from 'next/link';
import { getSearchProvider } from '@/lib/search';
import type { SearchResult, CategorySuggestion } from '@/lib/search';
import ProductCard from '@/components/ui/ProductCard';

// ---------------------------------------------------------------------------
// Next.js 15: searchParams is a Promise
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    color?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchResults(
  q: string,
  category?: string,
  color?: string
): Promise<{ results: SearchResult[]; suggestions: CategorySuggestion[]; popular: SearchResult[] }> {
  const provider = getSearchProvider();
  const trimmed = q.trim();

  const [results, suggestions, popular] = await Promise.all([
    trimmed
      ? provider.search({ query: trimmed, category, color, limit: 24 })
      : Promise.resolve([] as SearchResult[]),

    trimmed && trimmed.length >= 2
      ? provider.suggestCategories({ query: trimmed, limit: 6 })
      : Promise.resolve([] as CategorySuggestion[]),

    // Popular products as fallback (empty query → show them)
    !trimmed
      ? provider.search({ query: 'chaussures', limit: 4 })
      : Promise.resolve([] as SearchResult[]),
  ]);

  return { results, suggestions, popular };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SearchPage({ searchParams }: PageProps) {
  // Await the searchParams Promise (Next.js 15 requirement)
  const params = await searchParams;
  const q        = params.q        ?? '';
  const category = params.category ?? undefined;
  const color    = params.color    ?? undefined;

  let results:     SearchResult[]      = [];
  let suggestions: CategorySuggestion[] = [];
  let popular:     SearchResult[]      = [];
  let error = false;

  try {
    ({ results, suggestions, popular } = await fetchResults(q, category, color));
  } catch (err) {
    console.error('[SearchPage] fetchResults failed:', err);
    error = true;
  }

  const hasQuery    = q.trim().length > 0;
  const hasResults  = results.length > 0;
  const activeFilters = [
    category && `Catégorie : ${category}`,
    color    && `Couleur : ${color}`,
  ].filter(Boolean) as string[];

  // Build URL helper to toggle filters
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (q)        p.set('q',        overrides.q        ?? q);
    if (category) p.set('category', overrides.category ?? category);
    if (color)    p.set('color',    overrides.color    ?? color);
    // Allow explicit removal
    if (overrides.category === '')  p.delete('category');
    if (overrides.color    === '')  p.delete('color');
    return `/search?${p.toString()}`;
  };

  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-container-margin py-lg flex flex-col gap-lg">

      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb + Header                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-xs border-b border-outline-variant pb-sm">
        <div className="flex items-center gap-xs text-[10px] uppercase font-bold text-outline">
          <Link href="/" className="hover:text-primary transition-colors">ACCUEIL</Link>
          <span>/</span>
          <span className="text-secondary">RECHERCHE</span>
        </div>
        <h1 className="font-display text-headline-md sm:text-headline-lg font-bold tracking-tighter uppercase text-primary mt-xs">
          {hasQuery ? 'Résultats de recherche' : 'RECHERCHE'}
        </h1>
        {hasQuery && (
          <p className="font-body-md text-xs sm:text-sm text-secondary">
            {hasResults
              ? `${results.length} résultat${results.length > 1 ? 's' : ''} pour "${q}"`
              : `Aucun résultat pour "${q}"`}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Category suggestion pills (when query matches categories)           */}
      {/* ------------------------------------------------------------------ */}
      {hasQuery && suggestions.length > 0 && !category && (
        <div className="flex flex-col gap-xs">
          <p className="text-[10px] uppercase font-bold text-outline tracking-widest">
            Explorer par catégorie
          </p>
          <div className="flex flex-wrap gap-xs">
            {suggestions.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl({ category: cat.slug })}
                className="border border-outline-variant px-sm py-xs text-xs font-bold uppercase hover:border-primary hover:bg-surface-container-low transition-colors"
              >
                {cat.name}
                <span className="ml-xs text-outline font-normal">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Active filters                                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-[10px] uppercase font-bold text-outline tracking-widest">Filtres :</span>
          {category && (
            <Link
              href={buildUrl({ category: '' })}
              className="flex items-center gap-xs border border-primary px-sm py-xs text-xs font-bold uppercase bg-primary text-white hover:bg-transparent hover:text-primary transition-colors"
            >
              {category}
              <span className="material-symbols-outlined text-[14px]">close</span>
            </Link>
          )}
          {color && (
            <Link
              href={buildUrl({ color: '' })}
              className="flex items-center gap-xs border border-primary px-sm py-xs text-xs font-bold uppercase bg-primary text-white hover:bg-transparent hover:text-primary transition-colors"
            >
              {color}
              <span className="material-symbols-outlined text-[14px]">close</span>
            </Link>
          )}
          <Link
            href={`/search?q=${encodeURIComponent(q)}`}
            className="text-xs text-outline underline underline-offset-2 hover:text-primary transition-colors"
          >
            Effacer tout
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                        */}
      {/* ------------------------------------------------------------------ */}
      {error ? (
        // Error state
        <div className="w-full text-center py-xl border border-dashed border-outline-variant flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-[36px] text-outline">error_outline</span>
          <p className="text-xs text-secondary">Une erreur est survenue lors de la recherche. Réessayez.</p>
        </div>

      ) : !hasQuery ? (
        // Empty state — no query yet, show popular
        <div className="flex flex-col gap-xl">
          <div className="w-full text-center py-xl border border-dashed border-outline-variant flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-[36px] text-outline">search</span>
            <p className="text-xs sm:text-sm text-secondary max-w-xs">
              Utilisez la barre de recherche pour trouver un article.
            </p>
          </div>
          {popular.length > 0 && (
            <div className="flex flex-col gap-md">
              <h2 className="font-display text-body-lg font-bold tracking-tighter text-primary border-b border-outline-variant pb-xs uppercase">
                Nouveaux arrivages
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {popular.map((p) => (
                  <ProductCard key={p.id} id={p.id} title={p.title} slug={p.slug}
                    salePrice={p.salePrice} categoryName={p.categoryName ?? ''}
                    imageUrl={p.imageUrl ?? undefined} />
                ))}
              </div>
            </div>
          )}
        </div>

      ) : hasResults ? (
        // Results grid
        <div className="flex flex-col gap-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
            {results.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} slug={p.slug}
                salePrice={p.salePrice} categoryName={p.categoryName ?? ''}
                imageUrl={p.imageUrl ?? undefined} />
            ))}
          </div>
        </div>

      ) : (
        // No results
        <div className="flex flex-col gap-xl">
          <div className="w-full text-center py-lg border border-dashed border-outline-variant flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
            <div>
              <h3 className="font-display text-body-lg text-primary font-bold">Aucun résultat trouvé</h3>
              <p className="text-xs text-secondary mt-xs max-w-xs mx-auto">
                Aucun article ne correspond à &quot;{q}&quot;. Essayez &quot;Chaussures&quot;, &quot;Sac&quot; ou &quot;T-shirt&quot;.
              </p>
            </div>
          </div>

          {/* Suggestions de catégories même sans résultat */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-sm">
              <p className="text-[10px] uppercase font-bold text-outline tracking-widest">
                Vous cherchiez peut-être…
              </p>
              <div className="flex flex-wrap gap-xs">
                {suggestions.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/search?q=${encodeURIComponent(cat.name)}`}
                    className="border border-outline-variant px-sm py-xs text-xs font-bold uppercase hover:border-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
