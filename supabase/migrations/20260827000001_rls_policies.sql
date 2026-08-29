-- KAKOS RLS policies configuration
-- Target: PostgreSQL (Supabase)

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 1. CATEGORIES POLICIES
CREATE POLICY "Allow public read on categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Allow admin all on categories" ON public.categories
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. PRODUCTS POLICIES
CREATE POLICY "Allow public read on active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin all on products" ON public.products
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. PRODUCT VARIANTS POLICIES
CREATE POLICY "Allow public read on product variants" ON public.product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id AND products.is_active = true
        )
    );

CREATE POLICY "Allow admin all on product variants" ON public.product_variants
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. PRODUCT IMAGES POLICIES
CREATE POLICY "Allow public read on product images" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_images.product_id AND products.is_active = true
        )
    );

CREATE POLICY "Allow admin all on product images" ON public.product_images
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. DELIVERY ZONES POLICIES
CREATE POLICY "Allow public read on active delivery zones" ON public.delivery_zones
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin all on delivery zones" ON public.delivery_zones
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. ORDERS POLICIES (No public access at all, even for creation - creation is delegated to Edge Function using service_role)
CREATE POLICY "Allow admin all on orders" ON public.orders
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. ORDER ITEMS POLICIES
CREATE POLICY "Allow admin all on order items" ON public.order_items
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. ORDER STATUS HISTORY POLICIES
CREATE POLICY "Allow admin all on status history" ON public.order_status_history
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. ADMIN PROFILES POLICIES
CREATE POLICY "Allow admin to read profiles" ON public.admin_profiles
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow admin to manage profiles" ON public.admin_profiles
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. CAMPAIGNS POLICIES
CREATE POLICY "Allow public read on active campaigns" ON public.campaigns
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin all on campaigns" ON public.campaigns
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 11. SETTINGS POLICIES
CREATE POLICY "Allow public read on settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin all on settings" ON public.settings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
