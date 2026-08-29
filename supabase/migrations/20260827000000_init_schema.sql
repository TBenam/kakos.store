-- KAKOS MVP Database Schema Migration
-- Target: PostgreSQL (Supabase)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. CATEGORIES
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. PRODUCTS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    supplier_price NUMERIC(10, 2) NOT NULL CHECK (supplier_price >= 0),
    sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- 4. PRODUCT VARIANTS
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL CHECK (stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (product_id, size, color)
);

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_variants_product_id ON public.product_variants(product_id);

-- 5. PRODUCT IMAGES
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_images_product_id ON public.product_images(product_id);

-- 6. DELIVERY ZONES
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), -- Currency: XAF (F CFA)
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_delivery_zones_updated_at
    BEFORE UPDATE ON public.delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_delivery_zones_is_active ON public.delivery_zones(is_active);

-- 7. ORDERS (COD Only, No Client Account Required, XAF Currency)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE RESTRICT NOT NULL,
    delivery_price NUMERIC(10, 2) NOT NULL CHECK (delivery_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_orders_tracking_number ON public.orders(tracking_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_zone ON public.orders(delivery_zone_id);

-- 8. ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0), -- Server recorded price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON public.order_items(product_variant_id);

-- 9. ADMIN PROFILES (Linked to Supabase Auth)
CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. ORDER STATUS HISTORY
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    changed_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL, -- Can be null if system-generated
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_status_history_order_id ON public.order_status_history(order_id);

-- 11. CAMPAIGNS (Marketing Banners)
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_campaigns_is_active ON public.campaigns(is_active);

-- 12. SETTINGS
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
