-- Migration: KAKOS Order Operations Setup
-- Target: PostgreSQL (Supabase)

-- 1. DROP EXISTING CONSTRAINTS
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS order_status_history_status_check;

-- 2. UPDATE EXISTING RECORDS TO MATCH NEW STATUSES (IF ANY)
UPDATE public.orders SET status = 'NEW' WHERE status = 'PENDING';
UPDATE public.orders SET status = 'OUT_FOR_DELIVERY' WHERE status = 'SHIPPED';
UPDATE public.order_status_history SET status = 'NEW' WHERE status = 'PENDING';
UPDATE public.order_status_history SET status = 'OUT_FOR_DELIVERY' WHERE status = 'SHIPPED';

-- 3. ADD NEW CONSTRAINTS FOR THE 13 STATUSES
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
    status IN (
        'NEW',
        'CONFIRMATION_REQUIRED',
        'CONFIRMED',
        'STOCK_CHECKED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'UNREACHABLE',
        'REFUSED',
        'POSTPONED',
        'OUT_OF_STOCK'
    )
);

ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_status_check CHECK (
    status IN (
        'NEW',
        'CONFIRMATION_REQUIRED',
        'CONFIRMED',
        'STOCK_CHECKED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'UNREACHABLE',
        'REFUSED',
        'POSTPONED',
        'OUT_OF_STOCK'
    )
);

-- 4. SET DEFAULT STATUS TO 'NEW'
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'NEW';

-- 5. ADD OPTIONAL DELIVERY PERSON DETAILS TO ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_person_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_person_phone TEXT;

-- 6. CREATE INTERNAL NOTES TABLE
CREATE TABLE IF NOT EXISTS public.order_internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_internal_notes_order_id ON public.order_internal_notes(order_id);

-- Enable RLS and add policy
ALTER TABLE public.order_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin all on order_internal_notes" ON public.order_internal_notes
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. RECREATE THE create_cod_order FUNCTION WITH 'NEW' AS DEFAULT INITIAL STATUS
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

    -- 4. Calculate total price
    v_total := v_subtotal + v_delivery_price;

    -- 5. Generate unique tracking number (Loop to handle potential collisions)
    LOOP
        v_tracking_number := 'KK-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
        SELECT EXISTS (
            SELECT 1 FROM public.orders WHERE tracking_number = v_tracking_number
        ) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- 6. Insert Order with default status 'NEW'
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
        p_first_name,
        p_phone,
        p_first_name,
        p_city,
        p_neighborhood,
        p_address_precision,
        p_delivery_zone_id,
        v_delivery_price,
        v_subtotal,
        v_total,
        'NEW'
    )
    RETURNING id INTO v_order_id;

    -- 7. Insert Order Items & Update Stock
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

    -- 8. Add Initial Order Status History with status 'NEW'
    INSERT INTO public.order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_order_id,
        'NEW',
        'Commande COD initialisée automatiquement.'
    );

    -- 9. Return result row
    RETURN QUERY SELECT v_order_id, v_tracking_number, v_subtotal, v_delivery_price, v_total;
END;
$$;
