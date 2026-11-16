import type { MetadataRoute } from 'next';
import { createSupabasePublicClient } from '@/lib/supabase-public';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kakos.store';
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/collections/sale`, changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    const supabase = createSupabasePublicClient();
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('categories').select('slug, updated_at'),
    ]);

    return [
      ...staticRoutes,
      ...(categories || []).map((category) => ({
        url: `${siteUrl}/collections/${category.slug}`,
        lastModified: category.updated_at || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...(products || []).map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updated_at || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error('Failed to build dynamic sitemap:', error);
    return staticRoutes;
  }
}
