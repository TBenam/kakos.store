import { createSupabaseServerClient } from '@/lib/supabase-server';
import { reviewCatalogCandidateAction } from '@/app/admin/actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CatalogueImportPage() {
  const supabase = await createSupabaseServerClient();
  const { data: candidates, error } = await supabase
    .from('catalog_candidates')
    .select('*, suppliers(name)')
    .order('updated_at', { ascending: false })
    .limit(300);

  const rows = candidates || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Import WhatsApp</h1>
        <p className="text-sm text-[#444748] mt-1">Validation humaine avant publication du catalogue.</p>
      </div>

      {error && <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">Appliquez la migration catalogue puis synchronisez les brouillons WhatsApp.</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="À vérifier" value={rows.filter((r: any) => r.review_status === 'REVIEW_REQUIRED').length} />
        <Kpi label="Approuvés" value={rows.filter((r: any) => r.review_status === 'APPROVED').length} />
        <Kpi label="Bloqués" value={rows.filter((r: any) => (r.blocking_reasons || []).length > 0).length} />
        <Kpi label="Publiés" value={rows.filter((r: any) => r.review_status === 'PUBLISHED').length} accent />
      </div>

      <div className="bg-white border border-[#d8d8d8] overflow-x-auto">
        <table className="w-full text-sm min-w-[1050px]">
          <thead className="bg-black text-white text-left uppercase text-[10px] tracking-wider">
            <tr><th className="p-3">Fournisseur</th><th className="p-3">Produit</th><th className="p-3">Coût</th><th className="p-3">Prix KAKOS</th><th className="p-3">Photos</th><th className="p-3">Blocages</th><th className="p-3">Statut</th><th className="p-3">Décision</th></tr>
          </thead>
          <tbody>
            {rows.map((candidate: any) => {
              const blocked = (candidate.blocking_reasons || []).length > 0;
              return (
                <tr key={candidate.id} className="border-b align-top">
                  <td className="p-3">{candidate.suppliers?.name}</td>
                  <td className="p-3"><p className="font-bold">{candidate.title}</p><p className="text-xs text-gray-500">{candidate.category} · {candidate.source_product_id}</p></td>
                  <td className="p-3">{candidate.supplier_price ? `${Number(candidate.supplier_price).toLocaleString('fr-FR')} F` : '—'}</td>
                  <td className="p-3 font-bold">{candidate.recommended_retail_price ? `${Number(candidate.recommended_retail_price).toLocaleString('fr-FR')} F` : '—'}</td>
                  <td className="p-3">{candidate.media_count}</td>
                  <td className="p-3 max-w-[280px]">{blocked ? <ul className="text-xs text-red-700 list-disc pl-4">{candidate.blocking_reasons.map((reason: string) => <li key={reason}>{reason}</li>)}</ul> : <span className="text-green-700 font-bold text-xs">Prêt</span>}</td>
                  <td className="p-3 font-bold">{candidate.review_status}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/catalogue-import/${candidate.id}`} className="border border-black px-3 py-1.5 text-[10px] font-bold uppercase">Corriger</Link>
                      <form action={async () => {'use server'; await reviewCatalogCandidateAction(candidate.id, 'APPROVED');}}>
                        <button disabled={blocked} className="bg-[#00F0FF] disabled:bg-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase">Approuver</button>
                      </form>
                      <form action={async () => {'use server'; await reviewCatalogCandidateAction(candidate.id, 'REJECTED');}}>
                        <button className="border border-red-500 text-red-700 px-3 py-1.5 text-[10px] font-bold uppercase">Rejeter</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`${accent ? 'bg-[#00F0FF]' : 'bg-white'} border border-black p-4`}><p className="text-[10px] uppercase font-bold tracking-wider">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>;
}

