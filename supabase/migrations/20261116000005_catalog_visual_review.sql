-- Corrections validated from the mobile catalogue review.

UPDATE public.categories
SET name = 'Sacs à main'
WHERE slug = 'sacs';

-- Four products explicitly marked out of stock by the supplier.
UPDATE public.products
SET is_active = FALSE,
    is_bestseller = FALSE,
    promo_price = NULL,
    badge = NULL
WHERE id IN (
  '6e89a70d-50c7-49a7-b149-566edc7a125c',
  '358119b4-50d5-413c-90e2-f25c35af026a',
  'dcc1e277-686f-4899-aa23-50390072971a',
  'ca80af45-3b44-41cc-81e8-ffabe3602a67'
);

UPDATE public.product_variants
SET stock = 0
WHERE product_id IN (
  '6e89a70d-50c7-49a7-b149-566edc7a125c',
  '358119b4-50d5-413c-90e2-f25c35af026a',
  'dcc1e277-686f-4899-aa23-50390072971a',
  'ca80af45-3b44-41cc-81e8-ffabe3602a67'
);

-- Keep the unmarked new loafer arrival and use the requested customer-facing name.
UPDATE public.products
SET title = 'Loro Piana',
    slug = 'loro-piana-nouvel-arrivage',
    description = 'Mocassins Loro Piana disponibles en plusieurs couleurs. Modèle élégant et facile à porter au quotidien.'
WHERE id = 'b3051be1-15d2-434b-843d-4a00bdb1be8e';

-- Correct two handbag products that were imported as shoes.
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'sacs'),
    title = 'Sac à main structuré noir',
    slug = 'sac-a-main-structure-noir',
    description = 'Sac à main noir structuré avec poignées rigides et détails dorés.'
WHERE id = '235cdd5f-cc38-46a7-81c7-3bb23c6e6d6a';

UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'sacs'),
    title = 'Sac à main structuré – Collection élégance',
    slug = 'sac-a-main-structure-collection-elegance',
    description = 'Sac à main structuré disponible en plusieurs finitions, sélectionné pour le quotidien et les sorties.'
WHERE id = 'a873c7f9-968a-4dc3-b19b-68039c027c4a';

-- Remove the ordering flyer and storefront photo from the second handbag gallery.
DELETE FROM public.product_images
WHERE product_id = 'a873c7f9-968a-4dc3-b19b-68039c027c4a'
  AND (url LIKE '%/kakos-media-01.webp' OR url LIKE '%/kakos-media-02.webp');

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY position, id) - 1 AS new_position
  FROM public.product_images
  WHERE product_id = 'a873c7f9-968a-4dc3-b19b-68039c027c4a'
)
UPDATE public.product_images pi
SET position = ordered.new_position
FROM ordered
WHERE pi.id = ordered.id;

-- Supplier-only adverts without a usable clean product photo stay archived in admin.
UPDATE public.products
SET is_active = FALSE, is_bestseller = FALSE, promo_price = NULL, badge = NULL
WHERE id IN (
  '6323a70b-e8b5-460d-8623-bab1c1093740',
  'c2f309ff-ef94-4e0a-8848-8016ceb47860',
  '22928302-916c-4cd2-8ec8-5932516c4eb1'
);

-- Keep only product-only images when existing galleries show European landmarks
-- or light-skinned feet/hands. The retained image becomes the primary image.
DELETE FROM public.product_images WHERE product_id = 'bb222846-25a8-4d9d-8242-3d0a71558acb' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = 'bb222846-25a8-4d9d-8242-3d0a71558acb';

DELETE FROM public.product_images WHERE product_id = '9bad886c-cfc8-4576-9f03-df58252a5525' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '9bad886c-cfc8-4576-9f03-df58252a5525';

DELETE FROM public.product_images WHERE product_id = '9ca4df9c-9089-4a17-838e-a443bf9d9481' AND url NOT LIKE '%/kakos-media-01.webp' AND url NOT LIKE '%/kakos-media-02.webp' AND url NOT LIKE '%/kakos-media-03.webp' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 3 WHERE product_id = '9ca4df9c-9089-4a17-838e-a443bf9d9481' AND position = 7;

DELETE FROM public.product_images WHERE product_id = 'e497dd3e-054e-4106-843a-37a8aaedf1aa' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = 'e497dd3e-054e-4106-843a-37a8aaedf1aa';

DELETE FROM public.product_images WHERE product_id = '151ad0b9-a5c8-4568-9dfd-56da8406ff76' AND url NOT LIKE '%/kakos-media-05.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '151ad0b9-a5c8-4568-9dfd-56da8406ff76';

DELETE FROM public.product_images WHERE product_id = '4911ef25-36c5-4dad-ac63-a46381dde4a8' AND url NOT LIKE '%/kakos-media-07.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '4911ef25-36c5-4dad-ac63-a46381dde4a8';

DELETE FROM public.product_images WHERE product_id = '1ef18156-16e3-4318-bfed-94964f3da87d' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '1ef18156-16e3-4318-bfed-94964f3da87d';

DELETE FROM public.product_images WHERE product_id = '52073ee0-11a7-406e-b876-fd6bfc8fc6c1' AND url NOT LIKE '%/kakos-media-05.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '52073ee0-11a7-406e-b876-fd6bfc8fc6c1';

DELETE FROM public.product_images WHERE product_id = '51d9f1d8-0626-4bb7-b616-435a61de6284' AND url NOT LIKE '%/kakos-media-08.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '51d9f1d8-0626-4bb7-b616-435a61de6284';

DELETE FROM public.product_images WHERE product_id = '3b91efc7-5b3c-4462-be3d-063637710767' AND url NOT LIKE '%/kakos-media-05.webp';
UPDATE public.product_images SET position = 0 WHERE product_id = '3b91efc7-5b3c-4462-be3d-063637710767';

-- Replace the remaining unsuitable model photo with a KAKOS indoor studio asset.
DELETE FROM public.product_images
WHERE product_id = '8689dcb2-d6d3-4df4-8980-1ebb46d55278';

INSERT INTO public.product_images (product_id, url, position)
VALUES (
  '8689dcb2-d6d3-4df4-8980-1ebb46d55278',
  '/kakos-product-series-limitee-v2.webp',
  0
);
