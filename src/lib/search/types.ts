/**
 * KAKOS Search Abstraction Layer
 *
 * Defines the SearchProvider interface so the search backend
 * can be swapped (PostgreSQL → Meilisearch, Algolia, etc.)
 * without touching any UI or page code.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  categoryName: string | null;
  categorySlug: string | null;
  imageUrl: string | null;
  tags: string[];
  /** Relevance score 0..1+ */
  rank: number;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export interface SearchParams {
  /** Free-text query */
  query: string;
  /** Filter by category slug */
  category?: string;
  /** Filter by color */
  color?: string;
  /** Filter by tags */
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SuggestionParams {
  query: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * Implement this interface to plug in a different search backend.
 * The current default is PostgresSearchProvider (pg_trgm + tsvector).
 */
export interface SearchProvider {
  /**
   * Search products and return ranked results.
   * Must return an empty array (not throw) when no results are found.
   */
  search(params: SearchParams): Promise<SearchResult[]>;

  /**
   * Return matching category suggestions for the given query prefix.
   */
  suggestCategories(params: SuggestionParams): Promise<CategorySuggestion[]>;
}
