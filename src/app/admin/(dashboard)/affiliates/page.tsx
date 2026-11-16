import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  createAffiliateAction,
  markAffiliateCommissionPaidAction,
  updateAffiliateStatusAction,
} from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

const money = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('fr-FR')} F CFA`;

export default async function AffiliatesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: affiliates, error: affiliateError }, { data: commissions, error: commissionError }] = await Promise.all([
    supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
    supabase
      .from('affiliate_commissions')
      .select('id, affiliate_id, order_id, amount, status, paid_at, payment_reference, created_at, orders(tracking_number, status)')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const rows = affiliates || [];
  const commissionRows = commissions || [];
  const totals = commissionRows.reduce(
    (acc: Record<string, number>, row: any) => {
      acc[row.status] = (acc[row.status] || 0) + Number(row.amount || 0);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Vendeurs affiliés</h1>
        <p className="text-sm text-[#444748] mt-1">Codes vendeurs, ventes attribuées et commissions.</p>
      </div>

      {(affiliateError || commissionError) && (
        <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Appliquez d’abord la migration du système affilié dans Supabase.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Vendeurs actifs" value={rows.filter((a: any) => a.status === 'ACTIVE').length.toString()} />
        <Kpi label="Commissions en attente" value={money(totals.PENDING)} />
        <Kpi label="À payer" value={money(totals.APPROVED)} accent />
        <Kpi label="Déjà payées" value={money(totals.PAID)} />
      </div>

      <section className="bg-white border border-[#d8d8d8] p-5">
        <h2 className="font-display text-xl font-bold uppercase mb-4">Ajouter un vendeur</h2>
        <form
          action={async (formData) => {
            'use server';
            await createAffiliateAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <input name="code" required placeholder="CODE (ex: MARIE01)" className="border p-3 text-sm uppercase" />
          <input name="name" required placeholder="Nom du vendeur" className="border p-3 text-sm" />
          <input name="phone" required placeholder="WhatsApp / téléphone" className="border p-3 text-sm" />
          <input name="commissionRate" type="number" min="0" max="50" step="0.5" defaultValue="10" className="border p-3 text-sm" />
          <button className="bg-black text-white font-bold uppercase tracking-wider text-xs px-4 py-3 hover:bg-[#00F0FF] hover:text-black">
            Créer le vendeur
          </button>
        </form>
      </section>

      <section className="bg-white border border-[#d8d8d8] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white text-left uppercase text-[10px] tracking-wider">
            <tr><th className="p-3">Vendeur</th><th className="p-3">Code</th><th className="p-3">Téléphone</th><th className="p-3">Taux</th><th className="p-3">Statut</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {rows.map((affiliate: any) => (
              <tr key={affiliate.id} className="border-b">
                <td className="p-3 font-bold">{affiliate.name}</td>
                <td className="p-3 font-mono font-bold">{affiliate.code}</td>
                <td className="p-3">{affiliate.phone}</td>
                <td className="p-3">{(Number(affiliate.commission_rate) * 100).toFixed(0)}%</td>
                <td className="p-3">{affiliate.status}</td>
                <td className="p-3">
                  <form action={async () => {
                    'use server';
                    await updateAffiliateStatusAction(affiliate.id, affiliate.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                  }}>
                    <button className="border border-black px-3 py-1.5 text-[10px] font-bold uppercase">
                      {affiliate.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-[#d8d8d8] overflow-x-auto">
        <div className="p-4 border-b"><h2 className="font-display text-xl font-bold uppercase">Commissions</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-[#172033] text-white text-left uppercase text-[10px] tracking-wider">
            <tr><th className="p-3">Vendeur</th><th className="p-3">Commande</th><th className="p-3">Montant</th><th className="p-3">Statut</th><th className="p-3">Paiement</th></tr>
          </thead>
          <tbody>
            {commissionRows.map((commission: any) => {
              const affiliate = rows.find((row: any) => row.id === commission.affiliate_id);
              return (
                <tr key={commission.id} className="border-b">
                  <td className="p-3 font-bold">{affiliate?.name || commission.affiliate_id}</td>
                  <td className="p-3 font-mono">{commission.orders?.tracking_number || commission.order_id}</td>
                  <td className="p-3 font-bold">{money(commission.amount)}</td>
                  <td className="p-3">{commission.status}</td>
                  <td className="p-3">
                    {commission.status === 'APPROVED' ? (
                      <form action={async () => {
                        'use server';
                        await markAffiliateCommissionPaidAction(commission.id);
                      }}>
                        <button className="bg-[#00F0FF] text-black px-3 py-1.5 text-[10px] font-bold uppercase">Marquer payée</button>
                      </form>
                    ) : commission.paid_at ? new Date(commission.paid_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`${accent ? 'bg-[#00F0FF]' : 'bg-white'} border border-black p-4`}><p className="text-[10px] uppercase font-bold tracking-wider">{label}</p><p className="text-xl font-black mt-1">{value}</p></div>;
}

