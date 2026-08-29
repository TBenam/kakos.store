-- Migration: Free Shipping Threshold 20 000 FCFA
-- Target: PostgreSQL (Supabase)

CREATE OR REPLACE FUNCTION public.create_cod_order(
    p_first_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_neighborhood TEXT,
    p_address_precision TEXT,
    p_delivery_zone_id UUID,
    p_items JSONB -- Array of {"variant_id": UUID, "quantity": INTEGER}
)
RETURNS TABLE (
    order_id UUID,
    tracking_number TEXT,
    subtotal_price NUMERIC(10, 2),
    delivery_price NUMERIC(10, 2),
    total_price NUMERIC(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows execution bypassing RLS restrictions
SET search_path = public -- Secure execution path
AS $$
DECLARE
    v_order_id UUID;
    v_tracking_number TEXT;
    v_subtotal NUMERIC(10, 2) := 0;
    v_delivery_price NUMERIC(10, 2);
    v_total NUMERIC(10, 2);
    v_item RECORD;
    v_variant_stock INT;
    v_product_active BOOLEAN;
    v_sale_price NUMERIC(10, 2);
    v_product_title TEXT;
    v_color TEXT;
    v_size TEXT;
    v_exists BOOLEAN;
BEGIN
    -- 1. Input parameter validations
    IF p_first_name IS NULL OR trim(p_first_name) = '' THEN
        RAISE EXCEPTION 'Prénom requis';
    END IF;
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RAISE EXCEPTION 'Téléphone requis';
    END IF;
    IF p_city IS NULL OR trim(p_city) = '' THEN
        RAISE EXCEPTION 'Ville requise';
    END IF;
    IF p_neighborhood IS NULL OR trim(p_neighborhood) = '' THEN
        RAISE EXCEPTION 'Quartier requis';
    END IF;
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Le panier est vide';
    END IF;

    -- 2. Validate Delivery Zone
    SELECT price, is_active INTO v_delivery_price, v_exists
    FROM public.delivery_zones
    WHERE id = p_delivery_zone_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Zone de livraison introuvable';
    END IF;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'La zone de livraison sélectionnée n''est pas active';
    END IF;

    -- 3. Validate items, check stock, and calculate subtotal
    FOR v_item IN 
        SELECT (value->>'variant_id')::UUID AS variant_id, (value->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items)
    LOOP
        -- Check quantity
        IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Quantité invalide pour la variante %', v_item.variant_id;
        END IF;

        -- Verify variant and product active status
        SELECT pv.stock, p.is_active, p.sale_price, p.title, pv.color, pv.size
        INTO v_variant_stock, v_product_active, v_sale_price, v_product_title, v_color, v_size
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item.variant_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variante de produit % introuvable', v_item.variant_id;
        END IF;

        IF NOT v_product_active THEN
            RAISE EXCEPTION 'Le produit "%" n''est plus actif', v_product_title;
        END IF;

        -- Check stock availability
        IF v_variant_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insuffisant pour % (% - %). Disponible: %, Demandé: %', 
                v_product_title, v_color, v_size, v_variant_stock, v_item.quantity;
        END IF;

        -- Add to subtotal
        v_subtotal := v_subtotal + (v_sale_price * v_item.quantity);
    END LOOP;

    -- 4. Apply Free Shipping Threshold (20 000 FCFA)
    IF v_subtotal >= 20000.00 THEN
        v_delivery_price := 0.00;
    END IF;

    -- 5. Calculate total price
    v_total := v_subtotal + v_delivery_price;

    -- 6. Generate unique tracking number (Loop to handle potential collisions)
    LOOP
        v_tracking_number := 'KK-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
        SELECT EXISTS (
            SELECT 1 FROM public.orders WHERE public.orders.tracking_number = v_tracking_number
        ) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- 7. Insert Order
    INSERT INTO public.orders (
        tracking_number,
        customer_name,
        customer_phone,
        customer_first_name,
        city,
        neighborhood,
        address_precision,
        delivery_zone_id,
        delivery_price,
        subtotal_price,
        total_price,
        status
    ) VALUES (
        v_tracking_number,
        p_first_name, -- customer_name fallback
        p_phone,
        p_first_name,
        p_city,
        p_neighborhood,
        p_address_precision,
        p_delivery_zone_id,
        v_delivery_price,
        v_subtotal,
        v_total,
        'PENDING'
    )
    RETURNING id INTO v_order_id;

    -- 8. Insert Order Items & Update Stock
    FOR v_item IN 
        SELECT (value->>'variant_id')::UUID AS variant_id, (value->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items)
    LOOP
        -- Fetch exact price from DB
        SELECT p.sale_price INTO v_sale_price
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item.variant_id;

        -- Create item record
        INSERT INTO public.order_items (
            order_id,
            product_variant_id,
            quantity,
            unit_price
        ) VALUES (
            v_order_id,
            v_item.variant_id,
            v_item.quantity,
            v_sale_price
        );

        -- Decrement stock
        UPDATE public.product_variants
        SET stock = stock - v_item.quantity
        WHERE id = v_item.variant_id;
    END LOOP;

    -- 9. Add Initial Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_order_id,
        'PENDING',
        'Commande COD initialisée automatiquement.'
    );

    -- 10. Return result row
    RETURN QUERY SELECT v_order_id, v_tracking_number, v_subtotal, v_delivery_price, v_total;
END;
$$;
