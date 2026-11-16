-- KAKOS Seed File
-- Insert categories, delivery zones, and sample products for testing

-- 1. INSERT CATEGORIES
INSERT INTO public.categories (id, name, slug) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'T-shirts', 't-shirts'),
    ('c0000000-0000-0000-0000-000000000002', 'Sweats / Hoodies', 'sweats-hoodies'),
    ('c0000000-0000-0000-0000-000000000003', 'Jeans', 'jeans'),
    ('c0000000-0000-0000-0000-000000000004', 'Ensembles', 'ensembles'),
    ('c0000000-0000-0000-0000-000000000005', 'Culottes / Shorts', 'culottes-shorts'),
    ('c0000000-0000-0000-0000-000000000006', 'Vestes / Doudounes', 'vestes-doudounes'),
    ('c0000000-0000-0000-0000-000000000007', 'Pantalons', 'pantalons'),
    ('c0000000-0000-0000-0000-000000000008', 'Salopettes', 'salopettes')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug;

-- 2. INSERT DELIVERY ZONES (Cameroun, currency XAF/FCFA)
-- Using valid hex UUIDs starting with 'd0000000'
INSERT INTO public.delivery_zones (id, name, price, is_active) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Douala (Standard)', 1500.00, true),
    ('d0000000-0000-0000-0000-000000000002', 'Yaoundé (Standard)', 2500.00, true),
    ('d0000000-0000-0000-0000-000000000003', 'Bafoussam / Ouest', 3000.00, true),
    ('d0000000-0000-0000-0000-000000000004', 'Garoua / Nord', 4000.00, true),
    ('d0000000-0000-0000-0000-000000000005', 'Buea / Sud-Ouest', 2000.00, true),
    ('d0000000-0000-0000-0000-000000000006', 'Kribi (Standard)', 2500.00, true),
    ('d0000000-0000-0000-0000-000000000007', 'Retrait Boutique (Douala Hôpital Souboum)', 0.00, true)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, is_active = EXCLUDED.is_active;

-- 3. INSERT SAMPLE PRODUCTS (Urban streetwear theme)
-- Using valid hex UUIDs starting with 'a0000000'
-- Product 1: Tshirt KAKOS Core
INSERT INTO public.products (id, category_id, title, slug, description, supplier_price, sale_price, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'T-shirt KAKOS Monolith', 't-shirt-kakos-monolith', 'T-shirt streetwear en coton lourd 240g, logo brodé à la poitrine, coupe boxy.', 4000.00, 14900.00, true)
ON CONFLICT (slug) DO UPDATE SET sale_price = EXCLUDED.sale_price;

-- Product 1 Variants (Using valid hex UUIDs starting with 'b0000000')
INSERT INTO public.product_variants (id, product_id, size, color, stock) VALUES
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'M', 'Noir Noir', 15),
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'L', 'Noir Noir', 20),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'XL', 'Noir Noir', 5)
ON CONFLICT (product_id, size, color) DO UPDATE SET stock = EXCLUDED.stock;

-- Product 1 Images (Using valid hex UUIDs starting with 'e0000000')
INSERT INTO public.product_images (id, product_id, url, position) VALUES
    ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'https://pub-ref.supabase.co/storage/v1/object/public/products/tshirt_monolith_front.jpg', 0),
    ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'https://pub-ref.supabase.co/storage/v1/object/public/products/tshirt_monolith_back.jpg', 1)
ON CONFLICT (id) DO NOTHING;

-- Product 2: Hoodie Cyan Accent
INSERT INTO public.products (id, category_id, title, slug, description, supplier_price, sale_price, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Hoodie Oversized Cyan Accent', 'hoodie-oversized-cyan-accent', 'Hoodie en molleton épais avec impressions cyan électriques réfléchissantes.', 7000.00, 24900.00, true)
ON CONFLICT (slug) DO UPDATE SET sale_price = EXCLUDED.sale_price;

-- Product 2 Variants
INSERT INTO public.product_variants (id, product_id, size, color, stock) VALUES
    ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'M', 'Gris / Cyan', 8),
    ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'L', 'Gris / Cyan', 12),
    ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'XL', 'Gris / Cyan', 0) -- Out of stock variant to test validation
ON CONFLICT (product_id, size, color) DO UPDATE SET stock = EXCLUDED.stock;

-- Product 2 Images
INSERT INTO public.product_images (id, product_id, url, position) VALUES
    ('e0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'https://pub-ref.supabase.co/storage/v1/object/public/products/hoodie_cyan_front.jpg', 0)
ON CONFLICT (id) DO NOTHING;

-- 4. INSERT SETTINGS
INSERT INTO public.settings (key, value) VALUES
    ('store_info', '{"name": "KAKOS", "currency": "XAF", "whatsapp_contact": "237697259094", "country": "Cameroun"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
