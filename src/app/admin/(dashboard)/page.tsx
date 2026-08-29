import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';

export const revalidate = 30;

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch stats in parallel
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    { data: todayOrders },
    { data: pendingOrders },
    { data: allOrdersRevenue },
    { data: lowStockVariants },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_price, status')
      .gte('created_at', todayISO),
    supabase
      .from('orders')
      .select('id')
      .in('status', ['NEW', 'CONFIRMATION_REQUIRED']),
    supabase
      .from('orders')
      .select('total_price, supplier_price:order_items(unit_price, quantity)')
      .gte('created_at', todayISO),
    supabase
      .from('product_variants')
      .select('id, size, color, stock, product_id, products(title)')
      .lte('stock', 3)
      .gt('stock', 0)
      .limit(5),
    supabase
      .from('orders')
      .select(`
        id, tracking_number, customer_name, customer_phone, total_price,
        status, city, created_at,
        delivery_zones(name)
      `)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const todayCA = todayOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0;
  const todayCount = todayOrders?.length ?? 0;
  const pendingCount = pendingOrders?.length ?? 0;
  const lowStockCount = lowStockVariants?.length ?? 0;

  const formatPrice = (p: number) =>
    p.toLocaleString('fr-FR') + ' F';

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-black tracking-tighter uppercase">Overview</h2>
        <p className="text-sm text-[#444748] mt-1">Douala / Yaoundé — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {/* CA du jour */}
        <div className="bg-white border border-[#e3e2e2] p-4 flex flex-col justify-between h-32 border-l-4 border-l-[#00F0FF]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">CA du Jour</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-black mt-auto">{formatPrice(todayCA)}</p>
        </div>

        {/* Commandes aujourd'hui */}
        <div className="bg-white border border-[#e3e2e2] p-4 flex flex-col justify-between h-32">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">Commandes Aujourd&apos;hui</p>
          <p className="font-display text-4xl font-bold text-black mt-auto">{todayCount}</p>
        </div>

        {/* À confirmer */}
        <div className="bg-white border border-[#e3e2e2] p-4 flex flex-col justify-between h-32">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">À Confirmer</p>
          <div className="flex items-baseline gap-2 mt-auto">
            <p className="font-display text-4xl font-bold text-black">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
            )}
          </div>
        </div>

        {/* Alertes stock */}
        <div className="bg-white border border-[#e3e2e2] p-4 flex flex-col justify-between h-32">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">Alertes Stock</p>
          <div className="flex items-baseline gap-2 mt-auto">
            <p className="font-display text-4xl font-bold text-black">{lowStockCount}</p>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">Critique</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e3e2e2] shadow-[4px_4px_0px_0px_#0A0A0A]">
            <div className="px-4 py-3 border-b border-[#e3e2e2] flex justify-between items-center">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black">Commandes Récentes</h3>
              <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-[#00F0FF] hover:text-black transition-colors">
                Voir tout →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="bg-[#e3e2e2]">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Référence</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Client</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Ville</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Montant</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-[#f5f3f3] hover:bg-[#f5f3f3] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="text-xs font-bold text-black hover:text-[#00F0FF] transition-colors font-mono">
                            {order.tracking_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#444748]">{order.customer_name}</td>
                        <td className="px-4 py-3 text-xs text-[#444748]">{order.city}</td>
                        <td className="px-4 py-3 text-xs font-bold text-black">{formatPrice(Number(order.total_price))}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#747878]">
                        Aucune commande pour le moment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#e3e2e2] shadow-[4px_4px_0px_0px_#0A0A0A]">
            <div className="px-4 py-3 border-b border-[#e3e2e2] flex justify-between items-center">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black">Stock Critique</h3>
              <Link href="/admin/products" className="text-[10px] font-bold uppercase tracking-widest text-[#00F0FF] hover:text-black transition-colors">
                Gérer →
              </Link>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {lowStockVariants && lowStockVariants.length > 0 ? (
                lowStockVariants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between border-b border-[#f5f3f3] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-black truncate max-w-[140px]">{(v.products as any)?.title}</p>
                      <p className="text-[10px] text-[#444748]">{v.size} / {v.color}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 ${v.stock <= 1 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {v.stock} restant{v.stock > 1 ? 's' : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#747878] py-4 text-center">Aucune alerte stock</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 bg-black p-4 shadow-[4px_4px_0px_0px_#00F0FF]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#00F0FF] mb-3">Actions Rapides</p>
            <div className="flex flex-col gap-2">
              <Link href="/admin/products/new" className="flex items-center gap-2 text-white text-xs hover:text-[#00F0FF] transition-colors">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Ajouter un produit
              </Link>
              <Link href="/admin/orders?status=NEW" className="flex items-center gap-2 text-white text-xs hover:text-[#00F0FF] transition-colors">
                <span className="material-symbols-outlined text-[16px]">pending_actions</span>
                Commandes en attente
              </Link>
              <Link href="/admin/delivery" className="flex items-center gap-2 text-white text-xs hover:text-[#00F0FF] transition-colors">
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                Zones de livraison
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
