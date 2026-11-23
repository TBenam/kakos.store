-- Product-level affiliate eligibility and fixed per-item commissions.
-- Existing products keep the historical percentage behavior unless configured.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS affiliate_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS affiliate_commission_amount NUMERIC(10, 2)
        CHECK (affiliate_commission_amount IS NULL OR affiliate_commission_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_products_affiliate_eligible
    ON public.products(affiliate_eligible);

CREATE OR REPLACE FUNCTION public.sync_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate NUMERIC(5, 4);
    v_status TEXT;
    v_approved_at TIMESTAMP WITH TIME ZONE;
    v_eligible_amount NUMERIC(10, 2) := 0;
    v_fixed_amount NUMERIC(10, 2) := 0;
    v_percentage_base NUMERIC(10, 2) := 0;
    v_commission_amount NUMERIC(10, 2) := 0;
BEGIN
    IF NEW.affiliate_id IS NULL THEN
        IF TG_OP = 'UPDATE' AND OLD.affiliate_id IS NOT NULL THEN
            UPDATE public.affiliate_commissions
            SET status = 'CANCELLED', approved_at = NULL
            WHERE order_id = NEW.id AND status <> 'PAID';
        END IF;
        RETURN NEW;
    END IF;

    SELECT commission_rate INTO v_rate
    FROM public.affiliates
    WHERE id = NEW.affiliate_id;

    IF v_rate IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT
        COALESCE(SUM(oi.unit_price * oi.quantity) FILTER (WHERE p.affiliate_eligible), 0),
        COALESCE(SUM(p.affiliate_commission_amount * oi.quantity)
            FILTER (WHERE p.affiliate_eligible AND p.affiliate_commission_amount IS NOT NULL), 0),
        COALESCE(SUM(oi.unit_price * oi.quantity)
            FILTER (WHERE p.affiliate_eligible AND p.affiliate_commission_amount IS NULL), 0)
    INTO v_eligible_amount, v_fixed_amount, v_percentage_base
    FROM public.order_items oi
    JOIN public.product_variants pv ON pv.id = oi.product_variant_id
    JOIN public.products p ON p.id = pv.product_id
    WHERE oi.order_id = NEW.id;

    -- A seller code may remain useful for attribution, but direct-only baskets
    -- must never create a payable commission.
    IF v_eligible_amount <= 0 THEN
        DELETE FROM public.affiliate_commissions
        WHERE order_id = NEW.id AND status <> 'PAID';
        RETURN NEW;
    END IF;

    v_commission_amount := v_fixed_amount + ROUND(v_percentage_base * v_rate, 0);

    IF NEW.status = 'DELIVERED' THEN
        v_status := 'APPROVED';
        v_approved_at := COALESCE(NEW.updated_at, NOW());
    ELSIF NEW.status IN ('CANCELLED', 'UNREACHABLE', 'REFUSED', 'OUT_OF_STOCK') THEN
        v_status := 'CANCELLED';
        v_approved_at := NULL;
    ELSE
        v_status := 'PENDING';
        v_approved_at := NULL;
    END IF;

    INSERT INTO public.affiliate_commissions (
        affiliate_id, order_id, eligible_amount, commission_rate, amount, status, approved_at
    ) VALUES (
        NEW.affiliate_id, NEW.id, v_eligible_amount, v_rate, v_commission_amount, v_status, v_approved_at
    )
    ON CONFLICT (order_id) DO UPDATE SET
        affiliate_id = EXCLUDED.affiliate_id,
        eligible_amount = EXCLUDED.eligible_amount,
        commission_rate = EXCLUDED.commission_rate,
        amount = EXCLUDED.amount,
        status = CASE WHEN public.affiliate_commissions.status = 'PAID' THEN 'PAID' ELSE EXCLUDED.status END,
        approved_at = CASE
            WHEN public.affiliate_commissions.status = 'PAID' THEN public.affiliate_commissions.approved_at
            ELSE EXCLUDED.approved_at
        END;

    RETURN NEW;
END;
$$;

UPDATE public.products
SET affiliate_eligible = FALSE, affiliate_commission_amount = 0
WHERE slug IN (
    'parfum-smart-collection-100ml',
    'parfum-pochette-textile-100ml',
    'duo-mini-parfums-smart-15ml',
    'trio-huiles-parfumees-15ml',
    'duo-brumes-corporelles-prestige',
    'coffret-5-masques-tissu',
    'coffret-10-masques-tissu',
    'duo-gels-douche-enfants'
);

UPDATE public.products
SET affiliate_eligible = TRUE,
    affiliate_commission_amount = CASE
        WHEN slug IN ('parfum-mystical-premium-100ml', 'routine-cheveux-3-produits') THEN 2500
        ELSE 2000
    END
WHERE slug IN (
    'parfum-mystical-premium-100ml',
    'parfum-tara-100ml',
    'duo-lotions-corps-vitamine-c-collagene',
    'lotion-corps-grand-format',
    'gommage-corps-fruite',
    'gel-douche-exfoliant-grand-format',
    'routine-cheveux-3-produits'
);
