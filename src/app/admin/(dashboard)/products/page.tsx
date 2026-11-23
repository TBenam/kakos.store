import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';

export const revalidate = 0;

interface ProductsPageProps {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('products')
    .select(`
      id, title, slug, sale_price, supplier_price, is_active, created_at, affiliate_eligible, affiliate_commission_amount,
      categories(name),
      product_images(url, position),
      product_variants(stock)
    `)
    .order('created_at', { ascending: false });

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`);
  }
  if (params.status === 'active') {
    query = query.eq('is_active', true);
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const { data: products, error: prodError } = await query.limit(200);
  if (prodError) {
    console.error('Error fetching admin products:', prodError);
  }
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  const formatPrice = (p: number) => p.toLocaleString('fr-FR') + ' F';

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold text-black tracking-tighter uppercase">Produits</h2>
          <p className="text-sm text-[#444748] mt-1">{products?.length ?? 0} produit{(products?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#00F0FF] text-black text-[11px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_0px_#00F0FF] active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Ajouter Produit
        </Link>
      </div>

      {/* Search & Filters */}
      <form method="get" className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center border border-[#c4c7c7] px-3 gap-2 flex-1 min-w-[200px] bg-white">
          <span className="material-symbols-outlined text-[18px] text-[#747878]">search</span>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Rechercher un produit..."
            className="bg-transparent py-2 text-sm w-full focus:outline-none"
          />
        </div>
        <select
          name="status"
          defaultValue={params.status || ''}
          className="border border-[#c4c7c7] px-3 py-2 text-sm bg-white focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <button type="submit" className="bg-black text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-[#444748] transition-all">
          Filtrer
        </button>
        <Link href="/admin/products" className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 border border-[#c4c7c7] text-[#444748] hover:border-black transition-all bg-white">
          Reset
        </Link>
      </form>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products && products.length > 0 ? (
          products.map((product: any) => {
            const images = [...(product.product_images ?? [])].sort((a: any, b: any) => a.position - b.position);
            const mainImg = images[0]?.url;
            const totalStock = (product.product_variants ?? []).reduce((s: number, v: any) => s + (v.stock ?? 0), 0);

            return (
              <div key={product.id} className="bg-white border border-[#e3e2e2] group relative overflow-hidden hover:border-black hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all duration-200">
                {/* Image */}
                <div className="relative aspect-[4/5] bg-[#efeded] border-b border-[#e3e2e2] overflow-hidden">
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-[#c4c7c7]">image_not_supported</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && (
                      <span className="bg-[#00F0FF] text-black text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5">New</span>
                    )}
                    {product.is_bestseller && (
                      <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5">Bestseller</span>
                    )}
                    {product.badge && (
                      <span className="bg-black text-[#00F0FF] text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5">{product.badge}</span>
                    )}
                  </div>

                  {/* Active indicator */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-2.5 h-2.5 rounded-full border border-white ${product.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                  </div>

                  {/* Hover overlay actions */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#00F0FF] transition-colors border border-black"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Modifier
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold text-black leading-tight line-clamp-2">{product.title}</p>
                  <p className="text-[10px] text-[#444748] mt-0.5">{(product.categories as any)?.name}</p>
                  <p className={`mt-1 text-[9px] font-black uppercase tracking-wider ${product.affiliate_eligible ? 'text-blue-700' : 'text-amber-700'}`}>
                    {product.affiliate_eligible
                      ? `Revendeurs · ${formatPrice(Number(product.affiliate_commission_amount || 0))}`
                      : 'Vente directe uniquement'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      {product.promo_price ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-red-600">{formatPrice(Number(product.promo_price))}</span>
                          <span className="text-xs text-[#747878] line-through">{formatPrice(Number(product.sale_price))}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-black">{formatPrice(Number(product.sale_price))}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 ${totalStock === 0 ? 'bg-red-100 text-red-700' : totalStock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {totalStock} unités
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-sm text-[#747878]">
            <span className="material-symbols-outlined text-[48px] text-[#c4c7c7] block mb-3">inventory_2</span>
            Aucun produit trouvé
          </div>
        )}
      </div>
    </div>
  );
}
