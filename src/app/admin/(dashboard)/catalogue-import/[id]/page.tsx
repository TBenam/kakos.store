import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { updateCatalogCandidateDetailsAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function EditCatalogCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: candidate } = await supabase
    .from('catalog_candidates')
    .select('*, suppliers(name)')
    .eq('id', id)
    .single();
  if (!candidate) notFound();

  const payload = (candidate.source_payload || {}) as Record<string, any>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/catalogue-import" className="text-xs font-bold uppercase tracking-wider">← Retour à la file</Link>
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter mt-3">Corriger la fiche</h1>
        <p className="text-sm text-gray-600">{candidate.suppliers?.name} · {candidate.source_product_id} · {candidate.media_count} photo(s)</p>
      </div>

      <form action={async (formData) => {
        'use server';
        const result = await updateCatalogCandidateDetailsAction(id, formData);
        if (result.success) redirect('/admin/catalogue-import');
      }} className="bg-white border border-[#d8d8d8] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Titre" name="title" defaultValue={candidate.title} wide />
        <Field label="Catégorie" name="category" defaultValue={candidate.category || ''} />
        <Field label="Coût fournisseur (F CFA)" name="supplierPrice" type="number" defaultValue={candidate.supplier_price || ''} />
        <Field label="Prix KAKOS (F CFA)" name="retailPrice" type="number" defaultValue={candidate.recommended_retail_price || ''} />
        <Field label="Tailles séparées par virgule" name="sizes" defaultValue={(payload.sizes || []).join(', ')} placeholder="S, M, L, XL" />
        <Field label="Couleurs séparées par virgule" name="colors" defaultValue={(payload.colors || []).join(', ')} placeholder="Noir, Blanc" />

        <label className="flex flex-col gap-1 text-xs font-bold uppercase">
          Disponibilité fournisseur
          <select name="availability" defaultValue={candidate.availability} className="border p-3 text-sm normal-case font-normal">
            <option value="TO_CONFIRM">À confirmer</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="UNAVAILABLE">Indisponible</option>
          </select>
        </label>

        <label className="flex items-center gap-3 border p-3 text-sm font-bold">
          <input type="checkbox" name="splitRequired" defaultChecked={candidate.split_required} />
          Plusieurs modèles à séparer
        </label>

        <div className="md:col-span-2 bg-amber-50 border border-amber-300 p-4 text-sm">
          Après correction, la fiche revient dans « À vérifier ». Elle doit ensuite être approuvée dans la file avant publication.
        </div>
        <button className="md:col-span-2 bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black">Enregistrer les corrections</button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text', placeholder, wide = false }: { label: string; name: string; defaultValue: string | number; type?: string; placeholder?: string; wide?: boolean }) {
  return <label className={`flex flex-col gap-1 text-xs font-bold uppercase ${wide ? 'md:col-span-2' : ''}`}>{label}<input name={name} type={type} required defaultValue={defaultValue} placeholder={placeholder} className="border p-3 text-sm normal-case font-normal" /></label>;
}

