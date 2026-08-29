-- ============================================================
-- KAKOS Admin Dashboard Extensions Migration
-- Copy-paste this into the Supabase SQL Editor if pooler is unavailable
-- ============================================================

-- Add admin product management columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10, 2) CHECK (promo_price >= 0);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
