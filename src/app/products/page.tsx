import React from 'react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import ProductsClient, { CatalogProduct } from './ProductsClient';

export const revalidate = 60; // Revalidate every 60s

export default async function ProductsPage() {
  let products: CatalogProduct[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id, title, slug, sale_price, supplier_price, created_at, categories(name, slug)')
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

      const rows = prodData.map((row: any) => {
        const productImages = imgData?.filter(i => i.product_id === row.id) || [];
        return {
          id: row.id,
          title: row.title,
          slug: row.slug,
          sale_price: row.sale_price,
          category_name: row.categories?.name,
          category_slug: row.categories?.slug,
          image_url: productImages.length > 0 ? productImages[0].url : null
        };
      });

      // Map and configure promo discounts for selected streetwear items
      products = rows.map((row, index) => {
        const salePrice = Number(row.sale_price) || 0;
      
      // We highlight around 50% of the catalog with Mega Promo badges & strikethrough original prices
      // (Even index or items with prices <= 10000 FCFA)
      const isPromo = index % 2 === 0 || salePrice <= 7000;
      
      let originalPrice: number | undefined = undefined;
      let promoBadge: string | undefined = undefined;

      if (isPromo && salePrice > 0) {
        // Calculate a realistic reference price higher by 30% - 40% (rounded nicely)
        const markup = index % 3 === 0 ? 1.4 : 1.3;
        originalPrice = Math.ceil((salePrice * markup) / 500) * 500;
        
        const badges = ['🔥 MÉGA PROMO', '⚡ VENTE FLASH', 'HOT DEAL', 'SOLDES -35%', 'SOLDES -30%'];
        promoBadge = badges[index % badges.length];
      }

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        salePrice,
        originalPrice,
        categoryName: row.category_name || 'Général',
        categorySlug: row.category_slug || 'autres',
        imageUrl: row.image_url || undefined,
        isPromo,
        promoBadge,
      };
    });
    }
  } catch (error) {
    console.error('Failed to fetch all products for shop catalog:', error);
  }

  return <ProductsClient products={products} />;
}
