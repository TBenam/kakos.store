/**
 * Search module entry point.
 *
 * Import from here everywhere in the app:
 *   import { getSearchProvider } from '@/lib/search';
 *
 * To swap the backend, change SEARCH_BACKEND env var or edit the
 * factory below. The rest of the codebase stays untouched.
 */

import { PostgresSearchProvider } from './postgres-provider';
import type { SearchProvider } from './types';

export type { SearchProvider, SearchResult, SearchParams, CategorySuggestion, SuggestionParams } from './types';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _instance: SearchProvider | null = null;

/**
 * Returns the active SearchProvider singleton.
 * Currently always returns PostgresSearchProvider.
 * Future: check process.env.SEARCH_BACKEND === 'meilisearch' etc.
 */
export function getSearchProvider(): SearchProvider {
  if (!_instance) {
    _instance = new PostgresSearchProvider();
  }
  return _instance;
}
