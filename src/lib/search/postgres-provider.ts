import { query } from '@/lib/db';
import type {
  SearchProvider,
  SearchParams,
  SearchResult,
  CategorySuggestion,
  SuggestionParams,
} from './types';

// ---------------------------------------------------------------------------
// Raw DB row shapes
// ---------------------------------------------------------------------------

interface DbSearchRow {
  id: string;
  title: string;
  slug: string;
  sale_price: string;
  category_name: string | null;
  category_slug: string | null;
  image_url: string | null;
  tags: string[] | null;
  rank: string;
}

interface DbCategoryRow {
  id: string;
  name: string;
  slug: string;
  count: string;
}

// ---------------------------------------------------------------------------
// PostgresSearchProvider
// ---------------------------------------------------------------------------

/**
 * Default MVP search provider using PostgreSQL native capabilities:
 *  - tsvector full-text search with french_unaccent config
 *  - pg_trgm trigram similarity for partial / fuzzy matching
 *  - ILIKE fallback for very short queries
 *
 * Uses the SQL function `public.search_products()` defined in
 * migration 20260827000004_search_setup.sql.
 *
 * Replace this class with MeilisearchProvider when the catalogue
 * grows beyond ~5 000 products or when sub-50ms latency is required.
 */
export class PostgresSearchProvider implements SearchProvider {
  // -------------------------------------------------------------------------
  // search()
  // -------------------------------------------------------------------------
  async search(params: SearchParams): Promise<SearchResult[]> {
    const {
      query: q,
      category = null,
      color = null,
      tags = null,
      limit = 20,
      offset = 0,
    } = params;

    const trimmed = q.trim();

    // Empty query → return nothing (caller handles the empty state)
    if (!trimmed) return [];

    try {
      // Call the search_products() stored function
      const res = await query<DbSearchRow>(
        `SELECT * FROM public.search_products($1, $2, $3, $4, $5, $6)
         ORDER BY rank DESC`,
        [trimmed, category, color, tags, limit, offset]
      );

      return res.rows.map((row) => this.mapRow(row));
    } catch (err) {
      // If the migration hasn't been applied yet, fall back to a simple
      // ILIKE query so the page doesn't crash.
      console.warn('[PostgresSearchProvider] search_products() failed, using ILIKE fallback:', err);
      return this.ilikeFallback(trimmed, category, limit, offset);
    }
  }

  // -------------------------------------------------------------------------
  // suggestCategories()
  // -------------------------------------------------------------------------
  async suggestCategories(params: SuggestionParams): Promise<CategorySuggestion[]> {
    const { query: q, limit = 5 } = params;
    const trimmed = q.trim();

    if (!trimmed) return [];

    try {
      const res = await query<DbCategoryRow>(
        `SELECT * FROM public.suggest_categories($1) LIMIT $2`,
        [trimmed, limit]
      );

      return res.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        count: parseInt(row.count, 10),
      }));
    } catch (err) {
      // Fallback: simple ILIKE on categories table
      console.warn('[PostgresSearchProvider] suggest_categories() failed, using ILIKE fallback:', err);
      return this.categoryFallback(trimmed, limit);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private mapRow(row: DbSearchRow): SearchResult {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      salePrice: parseFloat(row.sale_price),
      categoryName: row.category_name,
      categorySlug: row.category_slug,
      imageUrl: row.image_url,
      tags: row.tags ?? [],
      rank: parseFloat(row.rank),
    };
  }

  /** ILIKE fallback when the search SQL function is not yet deployed */
  private async ilikeFallback(
    q: string,
    category: string | null,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const res = await query<{
      id: string;
      title: string;
      slug: string;
      sale_price: string;
      category_name: string | null;
      category_slug: string | null;
      image_url: string | null;
    }>(
      `SELECT
         p.id,
         p.title,
         p.slug,
         p.sale_price,
         c.name  AS category_name,
         c.slug  AS category_slug,
         (SELECT url FROM public.product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.position ASC LIMIT 1) AS image_url
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE p.is_active = true
         AND (p.title ILIKE $1 OR p.description ILIKE $1)
         AND ($2::text IS NULL OR c.slug = $2)
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [`%${q}%`, category, limit, offset]
    );

    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      salePrice: parseFloat(row.sale_price),
      categoryName: row.category_name,
      categorySlug: row.category_slug,
      imageUrl: row.image_url,
      tags: [],
      rank: 0,
    }));
  }

  /** Category ILIKE fallback */
  private async categoryFallback(q: string, limit: number): Promise<CategorySuggestion[]> {
    const res = await query<{ id: string; name: string; slug: string; count: string }>(
      `SELECT
         c.id, c.name, c.slug,
         COUNT(p.id) AS count
       FROM public.categories c
       LEFT JOIN public.products p ON p.category_id = c.id AND p.is_active = true
       WHERE c.name ILIKE $1
       GROUP BY c.id, c.name, c.slug
       HAVING COUNT(p.id) > 0
       ORDER BY c.name ASC
       LIMIT $2`,
      [`%${q}%`, limit]
    );

    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      count: parseInt(row.count, 10),
    }));
  }
}
