import { NextRequest, NextResponse } from 'next/server';
import { getSearchProvider } from '@/lib/search';

/**
 * GET /api/search/suggestions?q=jean
 *
 * Returns:
 *   { categories: CategorySuggestion[] }
 *
 * Used by SearchOverlay for live suggestions as the user types.
 * Cached for 60 s at the edge.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const provider = getSearchProvider();
    const categories = await provider.suggestCategories({ query: q, limit: 5 });
    return NextResponse.json(
      { categories },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('[/api/search/suggestions] error:', err);
    return NextResponse.json({ categories: [] });
  }
}
