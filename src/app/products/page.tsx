import { createSupabaseServerClient } from '@/lib/supabase-server';
import ProductsClient, { CatalogProduct, CatalogCategory } from './ProductsClient';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 12;

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(single(params.page)) || 1);
  const category = single(params.category) || '';
  const search = (single(params.q) || '').trim();
  const promosOnly = single(params.promos) === '1';
  const sort = single(params.sort) || 'newest';
  const effectivePage = category ? 1 : requestedPage;
  const effectivePageSize = category ? 1000 : PAGE_SIZE;
  const from = (effectivePage - 1) * effectivePageSize;
  const to = from + effectivePageSize - 1;

  let products: CatalogProduct[] = [];
  let categories: CatalogCategory[] = [];
  let totalItems = 0;

  try {
    const supabase = await createSupabaseServerClient();
    let productQuery = supabase
      .from('products')
      .select('id, title, slug, sale_price, promo_price, badge, created_at, categories!inner(name, slug)', { count: 'exact' })
      .eq('is_active', true);

    if (category) productQuery = productQuery.eq('categories.slug', category);
    if (search) productQuery = productQuery.ilike('title', `%${search.replaceAll('%', '')}%`);
    if (promosOnly) productQuery = productQuery.not('promo_price', 'is', null).gt('promo_price', 0);

    if (sort === 'price-asc') productQuery = productQuery.order('sale_price', { ascending: true });
    else if (sort === 'price-desc') productQuery = productQuery.order('sale_price', { ascending: false });
    else productQuery = productQuery.order('created_at', { ascending: false });

    const [{ data: productRows, error: productError, count }, { data: categoryRows, error: categoryError }] = await Promise.all([
      productQuery.range(from, to),
      supabase.from('categories').select('name, slug').order('name'),
    ]);
    if (productError) throw productError;
    if (categoryError) throw categoryError;
    totalItems = count || 0;
    categories = (categoryRows || []) as CatalogCategory[];

    const rows = productRows || [];
    const productIds = rows.map((product) => product.id);
    const { data: imageRows, error: imageError } = productIds.length
      ? await supabase.from('product_images').select('product_id, url, position').in('product_id', productIds).order('position')
      : { data: [], error: null };
    if (imageError) throw imageError;

    const firstImageByProduct = new Map<string, string>();
    for (const image of imageRows || []) {
      if (!firstImageByProduct.has(image.product_id)) firstImageByProduct.set(image.product_id, image.url);
    }

    products = rows.map((row: any) => {
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
        isPromo: hasRealPromo,
        promoBadge: hasRealPromo ? row.badge || 'PROMO' : undefined,
      };
    });
  } catch (error) {
    console.error('Failed to fetch paginated shop catalog:', error);
  }

  return (
    <ProductsClient
      products={products}
      categories={categories}
      currentPage={effectivePage}
      totalItems={totalItems}
      pageSize={effectivePageSize}
      initialCategory={category}
      initialSearch={search}
      promosOnly={promosOnly}
      initialSort={sort}
    />
  );
}
