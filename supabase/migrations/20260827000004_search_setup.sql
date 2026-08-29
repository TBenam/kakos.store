-- ============================================================
-- KAKOS Search Setup Migration
-- Target: PostgreSQL (Supabase)
-- Features:
--   - unaccent extension (normalisation accents)
--   - tags[] column on products
--   - search_vector tsvector column (auto-updated via trigger)
--   - pg_trgm extension (similarity / tolérance fautes)
--   - search_products() function with ranking
--   - Index GIN sur search_vector et tags
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Unaccent text search configuration
-- Crée une configuration de recherche qui normalise les accents automatiquement
-- NOTE: CREATE TEXT SEARCH CONFIGURATION ne supporte pas IF NOT EXISTS avant PG16
--       On utilise un bloc DO conditionnel.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_ts_config WHERE cfgname = 'french_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
    END IF;
END
$$;
ALTER TEXT SEARCH CONFIGURATION french_unaccent
    ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;

-- 3. Colonne tags sur products
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 4. Colonne search_vector (tsvector précompilé)
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- 5. Fonction de mise à jour du search_vector
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        -- Titre : poids A (priorité maximale)
        setweight(
            to_tsvector('french_unaccent', COALESCE(NEW.title, '')),
            'A'
        ) ||
        -- Tags : poids B
        setweight(
            to_tsvector('french_unaccent', COALESCE(array_to_string(NEW.tags, ' '), '')),
            'B'
        ) ||
        -- Description : poids C
        setweight(
            to_tsvector('french_unaccent', COALESCE(
                regexp_replace(NEW.description, '<[^>]+>', ' ', 'g'),
                ''
            )),
            'C'
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour auto-maj du search_vector
DROP TRIGGER IF EXISTS trg_update_product_search_vector ON public.products;
CREATE TRIGGER trg_update_product_search_vector
    BEFORE INSERT OR UPDATE OF title, tags, description
    ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_search_vector();

-- 7. Mettre à jour le search_vector sur tous les produits existants
UPDATE public.products SET search_vector = (
    setweight(to_tsvector('french_unaccent', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('french_unaccent', COALESCE(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('french_unaccent', COALESCE(
        regexp_replace(description, '<[^>]+>', ' ', 'g'), ''
    )), 'C')
);

-- 8. Index GIN pour recherche full-text rapide
CREATE INDEX IF NOT EXISTS idx_products_search_vector
    ON public.products USING GIN (search_vector);

-- 9. Index GIN pour pg_trgm (tolérance aux fautes / recherche partielle)
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
    ON public.products USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_tags
    ON public.products USING GIN (tags);

-- 10. Index pour recherche de couleur sur les variantes
CREATE INDEX IF NOT EXISTS idx_variants_color_trgm
    ON public.product_variants USING GIN (color gin_trgm_ops);

-- 11. Fonction de recherche principale avec ranking
-- Retourne les produits triés par pertinence décroissante
CREATE OR REPLACE FUNCTION public.search_products(
    p_query     TEXT,
    p_category  TEXT    DEFAULT NULL,
    p_color     TEXT    DEFAULT NULL,
    p_tags      TEXT[]  DEFAULT NULL,
    p_limit     INTEGER DEFAULT 20,
    p_offset    INTEGER DEFAULT 0
)
RETURNS TABLE (
    id              UUID,
    title           TEXT,
    slug            TEXT,
    sale_price      NUMERIC,
    category_name   TEXT,
    category_slug   TEXT,
    image_url       TEXT,
    tags            TEXT[],
    rank            REAL
) AS $$
DECLARE
    v_tsquery       TSQUERY;
    v_normalized    TEXT;
BEGIN
    -- Normalisation de la requête : trim, lowercase, unaccent
    v_normalized := unaccent(lower(trim(p_query)));

    -- Construction du tsquery avec fallback sur recherche partielle
    BEGIN
        -- Essai tsquery strict (AND entre termes)
        v_tsquery := plainto_tsquery('french_unaccent', v_normalized);
    EXCEPTION WHEN OTHERS THEN
        v_tsquery := NULL;
    END;

    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id,
        p.title::TEXT,
        p.slug::TEXT,
        p.sale_price,
        c.name::TEXT AS category_name,
        c.slug::TEXT AS category_slug,
        pi.url::TEXT AS image_url,
        p.tags,
        CASE
            -- Si on a un tsquery valide : ranking ts_rank
            WHEN v_tsquery IS NOT NULL AND p.search_vector @@ v_tsquery THEN
                ts_rank_cd(p.search_vector, v_tsquery) * 2.0

            -- Fallback : similarité trigramme sur le titre
            ELSE
                GREATEST(
                    similarity(unaccent(lower(p.title)), v_normalized),
                    -- Recherche partielle : le titre contient-il le terme ?
                    CASE WHEN unaccent(lower(p.title)) ILIKE '%' || v_normalized || '%' THEN 0.5 ELSE 0.0 END
                )
        END AS rank

    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
        SELECT url FROM public.product_images pi2
        WHERE pi2.product_id = p.id
        ORDER BY pi2.position ASC
        LIMIT 1
    ) pi ON true
    LEFT JOIN public.product_variants pv ON pv.product_id = p.id

    WHERE
        p.is_active = true
        -- Filtre catégorie (optionnel)
        AND (p_category IS NULL OR c.slug = p_category OR c.name ILIKE p_category)
        -- Filtre couleur (optionnel, sur les variantes)
        AND (p_color IS NULL OR unaccent(lower(pv.color)) ILIKE '%' || unaccent(lower(p_color)) || '%')
        -- Filtre tags (optionnel)
        AND (p_tags IS NULL OR p.tags && p_tags)
        -- Filtre texte : full-text OU trigramme OU ILIKE
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

-- 12. Fonction suggestions de catégories (pour l'overlay de recherche)
CREATE OR REPLACE FUNCTION public.suggest_categories(p_query TEXT)
RETURNS TABLE (
    id    UUID,
    name  TEXT,
    slug  TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name::TEXT,
        c.slug::TEXT,
        COUNT(p.id) AS count
    FROM public.categories c
    LEFT JOIN public.products p ON p.category_id = c.id AND p.is_active = true
    WHERE
        unaccent(lower(c.name)) ILIKE '%' || unaccent(lower(trim(p_query))) || '%'
        OR similarity(unaccent(lower(c.name)), unaccent(lower(trim(p_query)))) > 0.2
    GROUP BY c.id, c.name, c.slug
    HAVING COUNT(p.id) > 0
    ORDER BY similarity(unaccent(lower(c.name)), unaccent(lower(trim(p_query)))) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- 13. Mise à jour du seed : ajouter les tags aux produits existants
UPDATE public.products SET tags = ARRAY['t-shirt', 'kakos', 'streetwear', 'cotton']
    WHERE slug = 't-shirt-kakos-monolith';

UPDATE public.products SET tags = ARRAY['hoodie', 'oversized', 'kakos', 'streetwear', 'sweat']
    WHERE slug = 'hoodie-oversized-cyan-accent';
