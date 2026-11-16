import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';
import type { Metadata } from 'next';
import AgeGate from '@/components/ui/AgeGate';

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sale_price: string;
  promo_price: string | null;
  badge: string | null;
  category_name: string;
  category_slug: string | null;
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

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  try {
    const result = await query<{ title: string; description: string | null; image_url: string | null }>(
      `SELECT p.title, p.description,
        (SELECT url FROM public.product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS image_url
       FROM public.products p WHERE p.slug = $1 AND p.is_active = true LIMIT 1`,
      [slug]
    );
    const product = result.rows[0];
    if (!product) return { title: 'Produit introuvable', robots: { index: false } };
    const description = (product.description || `Découvrez ${product.title} sur KAKOS, livré au Cameroun.`).replace(/<[^>]+>/g, ' ').slice(0, 160);
    return {
      title: product.title,
      description,
      alternates: { canonical: `/products/${slug}` },
      openGraph: { title: product.title, description, type: 'website', images: product.image_url ? [product.image_url] : undefined },
    };
  } catch {
    return { title: 'Produit KAKOS' };
  }
}

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
        p.promo_price,
        p.badge,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug
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
    <div className={product.category_slug === 'intimite-18-plus' ? "min-h-screen bg-[#080505] text-white [&_.text-primary]:!text-white [&_.text-secondary]:!text-zinc-300 [&_.text-outline]:!text-zinc-400 [&_.text-accent]:!text-red-500 [&_.bg-accent]:!bg-red-600 [&_.decoration-accent]:!decoration-red-600 [&_.border-primary]:!border-red-700 [&_.border-outline-variant]:!border-red-950 [&_.bg-surface]:!bg-[#080505] [&_.bg-surface-container-low]:!bg-[#12090a] [&_.bg-surface-container-lowest]:!bg-[#170b0c] [&_.bg-surface-container-high]:!bg-[#1d1011] [&_.bg-surface-container-highest]:!bg-[#281416]" : undefined}>
      {product.category_slug === 'intimite-18-plus' && <AgeGate />}
      <ProductDetailClient
        product={product}
        variants={variants}
        images={images}
        categoryId={product.category_id ?? undefined}
        adultTheme={product.category_slug === 'intimite-18-plus'}
      />
    </div>
  );
}
