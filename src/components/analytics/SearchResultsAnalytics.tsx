'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default function SearchResultsAnalytics({ query, resultCount, category }: { query: string; resultCount: number; category?: string }) {
  useEffect(() => {
    if (!query.trim()) return;
    trackAnalyticsEvent({
      event: 'search',
      searchQuery: query.trim(),
      categorySlug: category,
      properties: { result_count: resultCount, zero_results: resultCount === 0 },
    });
  }, [query, resultCount, category]);
  return null;
}
