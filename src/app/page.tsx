import React from 'react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import HomeClient from './HomeClient';

interface HomeProduct {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  categoryName: string;
  imageUrl?: string;
}

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function HomePage() {
  let products: HomeProduct[] = [];
  
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch products
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id, title, slug, sale_price, category_id, created_at, categories(name)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (prodError) throw prodError;

    if (prodData && prodData.length > 0) {
      const productIds = prodData.map(p => p.id);
      
      // Fetch images for these products
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
          salePrice: Number(row.sale_price),
          categoryName: row.categories?.name || 'Unknown',
          imageUrl: productImages.length > 0 ? productImages[0].url : undefined
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch products for homepage:', error);
  }

  return <HomeClient products={products} />;
}
