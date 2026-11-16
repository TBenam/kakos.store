-- KAKOS affiliate sellers and commission ledger

CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code = upper(code) AND code ~ '^[A-Z0-9_-]{3,24}$'),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_phone TEXT,
    commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.10 CHECK (commission_rate >= 0 AND commission_rate <= 0.50),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS update_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER update_affiliates_updated_at
    BEFORE UPDATE ON public.affiliates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_code_snapshot TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sales_channel TEXT NOT NULL DEFAULT 'DIRECT'
    CHECK (sales_channel IN ('DIRECT', 'AFFILIATE', 'ADMIN'));

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON public.orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_sales_channel ON public.orders(sales_channel);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE RESTRICT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    eligible_amount NUMERIC(10, 2) NOT NULL CHECK (eligible_amount >= 0),
    commission_rate NUMERIC(5, 4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 0.50),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'CANCELLED')),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS update_affiliate_commissions_updated_at ON public.affiliate_commissions;
CREATE TRIGGER update_affiliate_commissions_updated_at
    BEFORE UPDATE ON public.affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

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
        NEW.affiliate_id,
        NEW.id,
        COALESCE(NEW.subtotal_price, NEW.total_price - NEW.delivery_price, 0),
        v_rate,
        ROUND(COALESCE(NEW.subtotal_price, NEW.total_price - NEW.delivery_price, 0) * v_rate, 0),
        v_status,
        v_approved_at
    )
    ON CONFLICT (order_id) DO UPDATE SET
        affiliate_id = EXCLUDED.affiliate_id,
        eligible_amount = EXCLUDED.eligible_amount,
        commission_rate = EXCLUDED.commission_rate,
        amount = EXCLUDED.amount,
        status = CASE
            WHEN public.affiliate_commissions.status = 'PAID' THEN 'PAID'
            ELSE EXCLUDED.status
        END,
        approved_at = CASE
            WHEN public.affiliate_commissions.status = 'PAID' THEN public.affiliate_commissions.approved_at
            ELSE EXCLUDED.approved_at
        END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_order_affiliate_commission ON public.orders;
CREATE TRIGGER sync_order_affiliate_commission
    AFTER INSERT OR UPDATE OF affiliate_id, status, subtotal_price, total_price, delivery_price
    ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_commission();

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin all on affiliates" ON public.affiliates;
CREATE POLICY "Allow admin all on affiliates" ON public.affiliates
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin all on affiliate commissions" ON public.affiliate_commissions;
CREATE POLICY "Allow admin all on affiliate commissions" ON public.affiliate_commissions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT ALL ON public.affiliates TO authenticated, service_role;
GRANT ALL ON public.affiliate_commissions TO authenticated, service_role;

