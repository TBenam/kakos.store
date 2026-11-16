-- Ensure the server-calculated checkout price uses only a real, lower promo_price.
-- The order remains protected from client-side price manipulation.

DO $$
DECLARE
    function_definition TEXT;
    updated_definition TEXT;
BEGIN
    SELECT pg_get_functiondef(
        'public.create_cod_order(text,text,text,text,text,uuid,jsonb)'::regprocedure
    ) INTO function_definition;

    IF position('p.promo_price IS NOT NULL' IN function_definition) > 0 THEN
        RETURN;
    END IF;

    updated_definition := replace(
        function_definition,
        'p.is_active, p.sale_price, p.title',
        'p.is_active, CASE WHEN p.promo_price IS NOT NULL AND p.promo_price > 0 AND p.promo_price < p.sale_price THEN p.promo_price ELSE p.sale_price END, p.title'
    );

    updated_definition := replace(
        updated_definition,
        'SELECT p.sale_price INTO v_sale_price',
        'SELECT CASE WHEN p.promo_price IS NOT NULL AND p.promo_price > 0 AND p.promo_price < p.sale_price THEN p.promo_price ELSE p.sale_price END INTO v_sale_price'
    );

    IF updated_definition = function_definition THEN
        RAISE EXCEPTION 'create_cod_order could not be updated for real promotion prices';
    END IF;

    EXECUTE updated_definition;
END;
$$;
