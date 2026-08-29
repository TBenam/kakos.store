import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import ProductCard from '@/components/ui/ProductCard';

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  sale_price: string;
  category_name: string;
  image_url: string | null;
}

export const revalidate = 60;

export default async function SalePage() {
  let products: DbProduct[] = [];

  try {
    // Fetch products representing sales (for testing, we pull all active products but we highlight them as sale/promo)
    const res = await query<DbProduct>(
      `SELECT 
        p.id, 
        p.title, 
        p.slug, 
        p.sale_price, 
        c.name as category_name, 
        (SELECT url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.position ASC LIMIT 1) as image_url
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.sale_price ASC`
    );
    products = res.rows;
  } catch (error) {
    console.error('Failed to fetch sale products:', error);
  }

  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-container-margin py-lg flex flex-col gap-lg">
      {/* Header with Brand Accents */}
      <div className="flex flex-col gap-xs border-b border-outline-variant pb-sm">
        <div className="flex items-center gap-xs text-[10px] uppercase font-bold text-outline">
          <Link href="/" className="hover:text-primary transition-colors">ACCUEIL</Link>
          <span>/</span>
          <span className="text-secondary">SALE & DROPS</span>
        </div>
        <h1 className="font-display text-headline-md sm:text-headline-lg font-bold tracking-tighter uppercase text-primary mt-xs">
          🔥 OFFRES FLASH / SOLDES
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-secondary leading-relaxed">
          Saisissez nos drops streetwear exclusifs à prix réduit. Stocks ultra-limités au Cameroun. Pas de réassort prévu !
        </p>
      </div>

      {/* Product List Grid */}
      {products.length === 0 ? (
        <div className="w-full text-center py-xl border border-dashed border-outline-variant flex flex-col items-center justify-center gap-sm rounded-lg">
          <span className="material-symbols-outlined text-[36px] text-outline" data-icon="local_fire_department">
            local_fire_department
          </span>
          <div>
            <h3 className="font-display text-body-lg text-primary font-bold">Rupture temporaire</h3>
            <p className="font-body-md text-xs text-secondary mt-xs">
              Tous nos articles remisés ont été vendus. Repassez très bientôt !
            </p>
          </div>
          <Link
            href="/"
            className="border border-primary text-primary font-label-sm text-xs uppercase font-bold py-sm px-md hover:bg-surface-container-low transition-colors mt-sm rounded-lg"
          >
            Retour au catalogue général
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              slug={product.slug}
              salePrice={Number(product.sale_price)}
              categoryName={product.category_name}
              imageUrl={product.image_url || undefined}
              badge="SALE"
            />
          ))}
        </div>
      )}
    </div>
  );
}
