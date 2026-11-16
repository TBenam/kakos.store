import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface UpsellProduct {
  id: string;
  title: string;
  slug: string;
  sale_price: number;
  promo_price: number | null;
  image_url: string | null;
  first_variant_id: string | null;
  category_name: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const excludeSlug = searchParams.get('excludeSlug') || '';
  const excludeIds = searchParams.get('excludeIds'); // comma-separated variant IDs
  const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 8);

  // Parse excluded variant IDs to get excluded product IDs
  let excludedProductIds: string[] = [];
  if (excludeIds) {
    try {
      const variantIds = excludeIds.split(',').filter(Boolean);
      if (variantIds.length > 0) {
        // Build placeholders like $1, $2, ...
        const placeholders = variantIds.map((_, i) => `$${i + 1}`).join(', ');
        const res = await query<{ product_id: string }>(
          `SELECT DISTINCT product_id FROM public.product_variants WHERE id IN (${placeholders})`,
          variantIds
        );
        excludedProductIds = res.rows.map((r) => r.product_id);
      }
    } catch {
      // Non-blocking — just skip the exclusion
    }
  }

  try {
    // Base params: [excludeSlug, limit]
    // We'll dynamically add categoryId and excludedProductIds
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Build the WHERE clause progressively
    const conditions: string[] = [
      `p.is_active = true`,
      `p.slug != $${paramIndex++}`,
    ];
    params.push(excludeSlug);

    // Exclude already-carted products
    if (excludedProductIds.length > 0) {
      const excPlaceholders = excludedProductIds
        .map(() => `$${paramIndex++}`)
        .join(', ');
      conditions.push(`p.id NOT IN (${excPlaceholders})`);
      params.push(...excludedProductIds);
    }

    // Ensure there's at least one variant with stock
    conditions.push(`EXISTS (
      SELECT 1 FROM public.product_variants pv2
      WHERE pv2.product_id = p.id AND pv2.stock > 0
    )`);

    const limitParam = `$${paramIndex++}`;
    params.push(limit);

    const sql = `
      SELECT
        p.id,
        p.title,
        p.slug,
        p.sale_price,
        p.promo_price,
        c.name AS category_name,
        (
          SELECT pi.url
          FROM public.product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.position ASC
          LIMIT 1
        ) AS image_url,
        (
          SELECT pv.id
          FROM public.product_variants pv
          WHERE pv.product_id = p.id AND pv.stock > 0
          ORDER BY pv.size ASC, pv.color ASC
          LIMIT 1
        ) AS first_variant_id
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        ${categoryId ? `CASE WHEN p.category_id = $${paramIndex++} THEN 0 ELSE 1 END,` : ''}
        p.is_bestseller DESC,
        p.created_at DESC
      LIMIT ${limitParam}
    `;

    if (categoryId) params.push(categoryId);

    const result = await query<UpsellProduct>(sql, params);

    return NextResponse.json({ products: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[API /api/upsells] Error:', error);
    return NextResponse.json({ products: [], error: 'Failed to fetch upsells' }, { status: 500 });
  }
}
