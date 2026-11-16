-- Fix the search function return type and use the real promotional price.
CREATE OR REPLACE FUNCTION public.search_products(
    p_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    sale_price NUMERIC,
    category_name TEXT,
    category_slug TEXT,
    image_url TEXT,
    tags TEXT[],
    rank REAL
) AS $$
DECLARE
    v_tsquery TSQUERY;
    v_normalized TEXT;
BEGIN
    v_normalized := unaccent(lower(trim(p_query)));
    BEGIN
        v_tsquery := plainto_tsquery('french_unaccent', v_normalized);
    EXCEPTION WHEN OTHERS THEN
        v_tsquery := NULL;
    END;

    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id,
        p.title::TEXT,
        p.slug::TEXT,
        CASE
            WHEN p.promo_price IS NOT NULL AND p.promo_price > 0 AND p.promo_price < p.sale_price
                THEN p.promo_price
            ELSE p.sale_price
        END AS sale_price,
        c.name::TEXT AS category_name,
        c.slug::TEXT AS category_slug,
        pi.url::TEXT AS image_url,
        p.tags,
        (CASE
            WHEN v_tsquery IS NOT NULL AND p.search_vector @@ v_tsquery THEN
                ts_rank_cd(p.search_vector, v_tsquery) * 2.0
            ELSE
                GREATEST(
                    similarity(unaccent(lower(p.title)), v_normalized),
                    CASE WHEN unaccent(lower(p.title)) ILIKE '%' || v_normalized || '%' THEN 0.5 ELSE 0.0 END
                )
        END)::REAL AS rank
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
        SELECT pi2.url FROM public.product_images pi2
        WHERE pi2.product_id = p.id
        ORDER BY pi2.position ASC
        LIMIT 1
    ) pi ON true
    LEFT JOIN public.product_variants pv ON pv.product_id = p.id
    WHERE p.is_active = true
      AND (p_category IS NULL OR c.slug = p_category OR c.name ILIKE p_category)
      AND (p_color IS NULL OR unaccent(lower(pv.color)) ILIKE '%' || unaccent(lower(p_color)) || '%')
      AND (p_tags IS NULL OR p.tags && p_tags)
      AND (
          v_normalized = ''
          OR (v_tsquery IS NOT NULL AND p.search_vector @@ v_tsquery)
          OR unaccent(lower(p.title)) ILIKE '%' || v_normalized || '%'
          OR unaccent(array_to_string(p.tags, ' ')) ILIKE '%' || v_normalized || '%'
          OR similarity(unaccent(lower(p.title)), v_normalized) > 0.15
      )
    ORDER BY p.id, rank DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

INSERT INTO public.settings (key, value)
VALUES (
  'store_info',
  '{"name":"KAKOS","currency":"XAF","whatsapp_contact":"237697259094","country":"Cameroun"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = public.settings.value || '{"name":"KAKOS","whatsapp_contact":"237697259094"}'::jsonb;
