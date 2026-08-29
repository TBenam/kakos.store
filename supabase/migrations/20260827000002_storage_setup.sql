-- KAKOS Storage setup migration
-- Target: PostgreSQL (Supabase) for configuring storage buckets and policies

-- 1. Create 'products' public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Clean up any existing policies on storage.objects for this bucket to avoid duplicates
DROP POLICY IF EXISTS "Allow public read on products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin all on products bucket" ON storage.objects;

-- 3. Policy: Public read access to objects in 'products' bucket
CREATE POLICY "Allow public read on products bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 4. Policy: Admin full access to objects in 'products' bucket
CREATE POLICY "Allow admin all on products bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'products' AND public.is_admin())
WITH CHECK (bucket_id = 'products' AND public.is_admin());
