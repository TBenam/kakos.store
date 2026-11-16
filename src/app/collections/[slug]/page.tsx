import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import ProductCard from '@/components/ui/ProductCard';
import type { Metadata } from 'next';

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  sale_price: string;
  promo_price: string | null;
  category_name: string;
  image_url: string | null;
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60; // Revalidate dynamic routes every 60 seconds

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('categories').select('name').eq('slug', slug).maybeSingle();
    if (!data) return { title: 'Rayon introuvable', robots: { index: false } };
    const description = `Découvrez le rayon ${data.name} KAKOS : une sélection actuelle au meilleur prix, livrée au Cameroun.`;
    return { title: data.name, description, alternates: { canonical: `/collections/${slug}` } };
  } catch {
    return { title: 'Rayon KAKOS' };
  }
}

const CATEGORY_IMAGES: Record<string, string> = {
  't-shirts': '/cat_tshirts_kakos-v2.png',
  'sweats-hoodies': '/cat_hoodies.webp',
  'jeans': '/cat_jeans.webp',
  'ensembles': '/cat_ensembles.webp',
  'culottes-shorts': '/cat_shorts.webp',
  'vestes-doudounes': '/cat_vestes.webp',
  'pantalons': '/cat_pantalons.webp',
  'salopettes': '/cat_salopettes.webp',
};

export default async function CategoryPage(props: PageProps) {
  const params = await props.params;
  const slug = params.slug;
  let category: DbCategory | null = null;
  let products: DbProduct[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Fetch current category details
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (catError && catError.code !== 'PGRST116') throw catError; // PGRST116 is not found

    if (catData) {
      category = catData;

      // 2. Fetch products under this category
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, title, slug, sale_price, promo_price, created_at, categories(name)')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      if (prodData && prodData.length > 0) {
        const productIds = prodData.map(p => p.id);
        
        const { data: imgData, error: imgError } = await supabase
          .from('product_images')
          .select('product_id, url')
          .in('product_id', productIds)
          .order('position', { ascending: true });

        if (imgError) throw imgError;

        products = prodData.map((row: any) => {
          const productImages = imgData?.filter(i => i.product_id === row.id) || [];
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            sale_price: row.sale_price,
            promo_price: row.promo_price,
            category_name: row.categories?.name || category!.name,
            image_url: productImages.length > 0 ? productImages[0].url : null
          };
        });
      }
    }
  } catch (error) {
    console.error(`Failed to fetch category page data for ${slug}:`, error);
  }

  // If category is not found, render fallback
  if (!category) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center text-center p-xl gap-md">
        <span className="material-symbols-outlined text-[48px] text-error" data-icon="error">error</span>
        <div>
          <h1 className="font-display text-headline-md text-primary">Catégorie Introuvable</h1>
          <p className="font-body-md text-body-md text-secondary mt-xs">
            Le rayon demandé n'existe pas ou a été déplacé.
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

  const catImage = CATEGORY_IMAGES[slug] || '/fallback_product.jpg';

  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-container-margin py-lg flex flex-col gap-lg">
      {/* Category Hero Banner */}
      <div className="relative rounded-lg overflow-hidden border-2 border-outline-variant bg-[#0A0A0A] p-6 sm:p-10 flex flex-col justify-between min-h-[200px] sm:min-h-[240px] shadow-brutalist">
        <Image
          src={catImage}
          alt={category.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 grayscale filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        <div className="relative z-10 flex flex-col gap-xs">
          <div className="flex items-center gap-xs text-[10px] uppercase font-bold text-gray-400">
            <Link href="/" className="hover:text-accent transition-colors">ACCUEIL</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-accent transition-colors">COLLECTIONS</Link>
            <span>/</span>
            <span className="text-accent">{category.name}</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tighter uppercase text-white mt-1">
            {category.name}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-gray-300 max-w-md font-bold uppercase tracking-wider">
            Découvrez notre sélection exclusive de {category.name.toLowerCase()} premium conçue pour durer.
          </p>
        </div>

        <div className="relative z-10 pt-4 flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase font-bold bg-accent text-primary px-2.5 py-1 rounded">
            {products.length} {products.length > 1 ? 'ARTICLES' : 'ARTICLE'}
          </span>
          <span className="font-mono text-[11px] uppercase font-bold bg-black/60 text-gray-300 px-2.5 py-1 border border-outline rounded">
            AUTHENTIQUE KAKOS
          </span>
        </div>
      </div>

      {/* Product List Grid */}
      {products.length === 0 ? (
        <div className="w-full text-center py-xl border border-dashed border-outline-variant flex flex-col items-center justify-center gap-sm">
          <span className="material-symbols-outlined text-[36px] text-outline" data-icon="sentiment_dissatisfied">
            sentiment_dissatisfied
          </span>
          <div>
            <h3 className="font-display text-body-lg text-primary font-bold">Bientôt disponible</h3>
            <p className="font-body-md text-xs text-secondary mt-xs">
              De nouveaux articles de ce rayon arrivent bientôt. Restez branché !
            </p>
          </div>
          <Link
            href="/"
            className="border border-primary text-primary font-label-sm text-xs uppercase font-bold py-sm px-md hover:bg-surface-container-low transition-colors mt-sm"
          >
            Découvrir d'autres rayons
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
              salePrice={product.promo_price && Number(product.promo_price) < Number(product.sale_price) ? Number(product.promo_price) : Number(product.sale_price)}
              originalPrice={product.promo_price && Number(product.promo_price) < Number(product.sale_price) ? Number(product.sale_price) : undefined}
              categoryName={product.category_name}
              imageUrl={product.image_url || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
