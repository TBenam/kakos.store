import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sale_price: string;
  category_name: string;
  category_id: string | null;
}

interface DbVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface DbImage {
  id: string;
  url: string;
  position: number;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // Revalidate dynamic PDP pages every 60 seconds

export default async function ProductDetailPage(props: PageProps) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  let product: DbProduct | null = null;
  let variants: DbVariant[] = [];
  let images: DbImage[] = [];

  try {
    // 1. Query product details
    const prodRes = await query<DbProduct>(
      `SELECT 
        p.id, 
        p.title, 
        p.slug, 
        p.description, 
        p.sale_price, 
        p.category_id,
        c.name as category_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.slug = $1
      LIMIT 1`,
      [slug]
    );

    if (prodRes.rows.length > 0) {
      product = prodRes.rows[0];

      // 2. Query variants
      const varRes = await query<DbVariant>(
        `SELECT id, size, color, stock 
        FROM public.product_variants 
        WHERE product_id = $1 
        ORDER BY size ASC, color ASC`,
        [product!.id]
      );
      variants = varRes.rows;

      // 3. Query images
      const imgRes = await query<DbImage>(
        `SELECT id, url, position 
        FROM public.product_images 
        WHERE product_id = $1 
        ORDER BY position ASC`,
        [product!.id]
      );
      images = imgRes.rows;
    }
  } catch (error) {
    console.error(`Failed to fetch PDP data for product slug ${slug}:`, error);
  }

  // If product is not found, render fallback empty state
  if (!product) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center text-center p-xl gap-md">
        <span className="material-symbols-outlined text-[48px] text-error" data-icon="error">error</span>
        <div>
          <h1 className="font-display text-headline-md text-primary">Produit Introuvable</h1>
          <p className="font-body-md text-body-md text-secondary mt-xs">
            L'article demandé ({slug}) n'existe pas ou a été désactivé.
          </p>
        </div>
        <Link
          href="/"
          className="bg-primary text-white font-label-sm text-label-sm uppercase font-bold py-md px-lg"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <ProductDetailClient
      product={product}
      variants={variants}
      images={images}
      categoryId={product.category_id ?? undefined}
    />
  );
}
