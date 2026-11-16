'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CategorySuggestion } from '@/lib/search/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECENT_SEARCHES_KEY = 'kakos_recent_searches';
const MAX_RECENT = 5;
const POPULAR_TERMS = ['Chaussures', 'Sacs', 'T-shirts', 'Jeans', 'Parfums'];
const SUGGESTION_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === 'undefined' || !term.trim()) return;
  try {
    const prev = getRecentSearches();
    const next = [term.trim(), ...prev.filter((t) => t !== term.trim())].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // localStorage not available
  }
}

function removeRecentSearch(term: string) {
  if (typeof window === 'undefined') return;
  try {
    const prev = getRecentSearches();
    const next = prev.filter((t) => t !== term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // localStorage not available
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [queryText, setQueryText]           = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading]   = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------------
  // Load recent searches from localStorage when overlay opens
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setQueryText('');
      setCategorySuggestions([]);
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // ------------------------------------------------------------------
  // Escape key
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // ------------------------------------------------------------------
  // Live category suggestions (debounced)
  // ------------------------------------------------------------------
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setCategorySuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setCategorySuggestions(data.categories ?? []);
      }
    } catch {
      // Suggestions not critical — fail silently
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQueryText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), SUGGESTION_DEBOUNCE_MS);
  };

  // ------------------------------------------------------------------
  // Navigate to search results
  // ------------------------------------------------------------------
  const navigate = (term: string, opts?: { category?: string }) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());

    const params = new URLSearchParams({ q: trimmed });
    if (opts?.category) params.set('category', opts.category);
    router.push(`/search?${params.toString()}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(queryText);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  if (!isOpen) return null;

  const showRecentSearches  = !queryText.trim() && recentSearches.length > 0;
  const showCategorySuggest = queryText.trim().length >= 2 && categorySuggestions.length > 0;
  const showPopular         = !queryText.trim() && recentSearches.length === 0;

  return (
    <div className="fixed inset-0 bg-[#fbf9f9] z-50 flex flex-col p-container-margin animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center h-16 border-b border-outline-variant">
        <div className="font-display text-headline-lg-mobile font-bold tracking-tighter text-primary">
          RECHERCHE
        </div>
        <button
          onClick={onClose}
          className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-none active:scale-95 duration-75"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined" data-icon="close">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-grow flex flex-col justify-start max-w-lg mx-auto w-full gap-lg pt-lg overflow-y-auto">

        {/* Search input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
          <label className="font-label-sm text-label-sm uppercase font-bold text-primary">
            Que cherchez-vous ?
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={queryText}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="chaussures, sac, parfum, t-shirt…"
              className="w-full bg-transparent border-b-2 border-primary py-md text-headline-md font-display uppercase tracking-tight placeholder:text-outline focus:border-accent transition-colors rounded-none pr-10"
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-primary hover:text-accent p-2"
              aria-label="Rechercher"
            >
              <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* ---------------------------------------------------------------- */}
        {/* Category suggestions (live, while typing)                        */}
        {/* ---------------------------------------------------------------- */}
        {showCategorySuggest && (
          <div className="flex flex-col gap-xs">
            <div className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant text-[10px] tracking-widest">
              Catégories correspondantes
            </div>
            <div className="flex flex-col divide-y divide-outline-variant">
              {categorySuggestions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(queryText, { category: cat.slug })}
                  className="flex items-center justify-between py-sm text-left hover:bg-surface-container-low transition-colors px-xs"
                >
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[16px] text-outline">folder_open</span>
                    <span className="font-body-md text-sm font-bold uppercase text-primary">{cat.name}</span>
                  </div>
                  <span className="text-xs text-outline">{cat.count} article{cat.count > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
            {suggestionsLoading && (
              <p className="text-xs text-outline animate-pulse">Recherche…</p>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Recent searches                                                  */}
        {/* ---------------------------------------------------------------- */}
        {showRecentSearches && (
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <div className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant text-[10px] tracking-widest">
                Recherches récentes
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem(RECENT_SEARCHES_KEY);
                  setRecentSearches([]);
                }}
                className="text-[10px] text-outline underline underline-offset-2 hover:text-primary transition-colors"
              >
                Effacer
              </button>
            </div>
            <div className="flex flex-col divide-y divide-outline-variant">
              {recentSearches.map((term) => (
                <div key={term} className="flex items-center justify-between py-sm">
                  <button
                    onClick={() => navigate(term)}
                    className="flex items-center gap-sm flex-1 text-left hover:text-accent transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-outline">history</span>
                    <span className="font-body-md text-sm uppercase text-primary">{term}</span>
                  </button>
                  <button
                    onClick={(e) => handleRemoveRecent(e, term)}
                    aria-label={`Supprimer ${term}`}
                    className="p-1 text-outline hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Popular terms (when no query and no recent searches)             */}
        {/* ---------------------------------------------------------------- */}
        {showPopular && (
          <div className="flex flex-col gap-sm">
            <div className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant text-[10px] tracking-widest">
              Recherches populaires
            </div>
            <div className="flex flex-wrap gap-sm">
              {POPULAR_TERMS.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(term)}
                  className="border border-outline-variant px-sm py-xs text-body-md hover:border-primary hover:bg-surface-container-low rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
