-- KAKOS supplier catalog intake and human review queue

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    source_slug TEXT NOT NULL UNIQUE,
    whatsapp_phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.catalog_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    source_product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    supplier_price NUMERIC(10, 2),
    recommended_retail_price NUMERIC(10, 2),
    media_count INTEGER NOT NULL DEFAULT 0 CHECK (media_count >= 0),
    availability TEXT NOT NULL DEFAULT 'TO_CONFIRM' CHECK (availability IN ('TO_CONFIRM', 'AVAILABLE', 'UNAVAILABLE')),
    split_required BOOLEAN NOT NULL DEFAULT FALSE,
    review_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED'
        CHECK (review_status IN ('REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'PUBLISHED')),
    publish_requested BOOLEAN NOT NULL DEFAULT FALSE,
    blocking_reasons TEXT[] NOT NULL DEFAULT '{}',
    source_fingerprint TEXT,
    source_payload JSONB NOT NULL,
    published_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (supplier_id, source_product_id)
);

DROP TRIGGER IF EXISTS update_catalog_candidates_updated_at ON public.catalog_candidates;
CREATE TRIGGER update_catalog_candidates_updated_at
    BEFORE UPDATE ON public.catalog_candidates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_catalog_candidates_review_status ON public.catalog_candidates(review_status);
CREATE INDEX IF NOT EXISTS idx_catalog_candidates_supplier ON public.catalog_candidates(supplier_id);

CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    source_product_id TEXT NOT NULL,
    supplier_price NUMERIC(10, 2) NOT NULL CHECK (supplier_price >= 0),
    availability TEXT NOT NULL DEFAULT 'TO_CONFIRM' CHECK (availability IN ('TO_CONFIRM', 'AVAILABLE', 'UNAVAILABLE')),
    last_confirmed_at TIMESTAMP WITH TIME ZONE,
    source_fingerprint TEXT,
    source_metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (supplier_id, source_product_id),
    UNIQUE (supplier_id, product_id)
);

DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON public.supplier_products;
CREATE TRIGGER update_supplier_products_updated_at
    BEFORE UPDATE ON public.supplier_products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON public.supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_availability ON public.supplier_products(availability);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin all on suppliers" ON public.suppliers;
CREATE POLICY "Allow admin all on suppliers" ON public.suppliers
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin all on catalog candidates" ON public.catalog_candidates;
CREATE POLICY "Allow admin all on catalog candidates" ON public.catalog_candidates
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin all on supplier products" ON public.supplier_products;
CREATE POLICY "Allow admin all on supplier products" ON public.supplier_products
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT ALL ON public.suppliers TO authenticated, service_role;
GRANT ALL ON public.catalog_candidates TO authenticated, service_role;
GRANT ALL ON public.supplier_products TO authenticated, service_role;

