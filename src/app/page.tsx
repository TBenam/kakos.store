import { createSupabaseServerClient } from '@/lib/supabase-server';
import HomeClient, { HomeCampaign, HomeProduct } from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let flashDeals: HomeProduct[] = [];
  let bestSellers: HomeProduct[] = [];
  let newArrivals: HomeProduct[] = [];
  let perfumes: HomeProduct[] = [];
  let careProducts: HomeProduct[] = [];
  let bagFeature: HomeProduct | undefined;
  let campaign: HomeCampaign | undefined;

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: productRows, error: productError }, { data: campaignRows }] = await Promise.all([
      supabase
        .from('products')
        .select('id, title, slug, sale_price, promo_price, badge, is_new, is_bestseller, created_at, categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('campaigns')
        .select('title, banner_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (productError) throw productError;
    const rows = (productRows || []).filter((row: any) => row.categories?.slug !== 'intimite-18-plus');
    const productIds = rows.map((product) => product.id);
    const { data: imageRows, error: imageError } = productIds.length
      ? await supabase.from('product_images').select('product_id, url, position').in('product_id', productIds).order('position')
      : { data: [], error: null };
    if (imageError) throw imageError;

    const firstImageByProduct = new Map<string, string>();
    for (const image of imageRows || []) {
      if (!firstImageByProduct.has(image.product_id)) firstImageByProduct.set(image.product_id, image.url);
    }

    const products: HomeProduct[] = rows.map((row: any) => {
      const regularPrice = Number(row.sale_price) || 0;
      const promoPrice = Number(row.promo_price) || 0;
      const hasRealPromo = promoPrice > 0 && promoPrice < regularPrice;
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        salePrice: hasRealPromo ? promoPrice : regularPrice,
        originalPrice: hasRealPromo ? regularPrice : undefined,
        categoryName: row.categories?.name || 'Autres',
        categorySlug: row.categories?.slug || 'autres',
        imageUrl: firstImageByProduct.get(row.id),
        badge: hasRealPromo ? row.badge || 'PROMO' : undefined,
      };
    });
    const productsById = new Map(products.map((product) => [product.id, product]));
    flashDeals = products.filter((product) => product.originalPrice).reverse();
    newArrivals = rows
      .filter((row: any) => row.is_new)
      .map((row: any) => productsById.get(row.id))
      .filter((product): product is HomeProduct => Boolean(product));
    perfumes = rows
      .filter((row: any) => row.categories?.slug === 'parfums-brumes')
      .map((row: any) => productsById.get(row.id))
      .filter((product): product is HomeProduct => Boolean(product));
    careProducts = rows
      .filter((row: any) => ['Soins du corps', 'Soins capillaires', 'Soins du visage'].includes(row.categories?.name))
      .map((row: any) => productsById.get(row.id))
      .filter((product): product is HomeProduct => Boolean(product));
    bagFeature = products.find((product) => product.categorySlug === 'sacs');
    bestSellers = rows
      .filter((row: any) => row.is_bestseller)
      .map((row: any) => productsById.get(row.id))
      .filter((product): product is HomeProduct => Boolean(product))
      .reverse();

    const activeCampaign = campaignRows?.[0];
    if (activeCampaign?.banner_url) campaign = { title: activeCampaign.title, bannerUrl: activeCampaign.banner_url };
  } catch (error) {
    console.error('Failed to fetch homepage shopping shelves:', error);
  }

  return <HomeClient flashDeals={flashDeals} bestSellers={bestSellers} newArrivals={newArrivals} perfumes={perfumes} careProducts={careProducts} bagFeature={bagFeature} campaign={campaign} />;
}
