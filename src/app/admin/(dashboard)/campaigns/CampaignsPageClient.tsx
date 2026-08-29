'use client';

import { useState, useTransition } from 'react';
import { upsertCampaignAction, deleteCampaignAction } from '@/app/admin/actions';

interface Campaign {
  id: string;
  title: string;
  banner_url: string;
  is_active: boolean;
  created_at: string;
}

export default function CampaignsPageClient({ campaigns: initial }: { campaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', banner_url: '', is_active: true });
  const [message, setMessage] = useState<string | null>(null);

  const handleEdit = (c: Campaign) => {
    setEditId(c.id);
    setForm({ title: c.title, banner_url: c.banner_url, is_active: c.is_active });
    setShowForm(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertCampaignAction({ id: editId || undefined, ...form });
      if (result?.error) {
        setMessage('Erreur: ' + result.error);
      } else {
        setMessage('Campagne enregistrée.');
        setShowForm(false); setEditId(null);
        setForm({ title: '', banner_url: '', is_active: true });
        setTimeout(() => window.location.reload(), 500);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    startTransition(async () => {
      await deleteCampaignAction(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    });
  };

  const inputCls = "w-full border border-[#c4c7c7] px-3 py-2 text-sm focus:border-black focus:outline-none bg-transparent";

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold text-black tracking-tighter uppercase">Campagnes</h2>
          <p className="text-sm text-[#444748] mt-1">{campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', banner_url: '', is_active: true }); }}
          className="flex items-center gap-2 bg-[#00F0FF] text-black text-[11px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#0A0A0A]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvelle Campagne
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-300 text-green-800 text-sm">{message}</div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#e3e2e2] p-5 mb-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-4">{editId ? 'Modifier la Campagne' : 'Nouvelle Campagne'}</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5">Titre</label>
              <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Promo Rentrée 2026" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5">URL de la Bannière / Image</label>
              <input className={inputCls} value={form.banner_url} onChange={e => setForm(p => ({ ...p, banner_url: e.target.value }))} placeholder="https://..." />
              {form.banner_url && (
                <img src={form.banner_url} alt="Preview" className="mt-2 h-24 object-cover border border-[#e3e2e2]" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-black">Active</label>
              <div onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))} className={`relative w-11 h-6 rounded-full cursor-pointer transition-all ${form.is_active ? 'bg-black' : 'bg-[#e3e2e2]'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={isPending} className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2 hover:bg-[#00F0FF] hover:text-black transition-all">
              {isPending ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-[#c4c7c7] text-[#444748] text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:border-black transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map(c => (
          <div key={c.id} className={`bg-white border flex flex-col overflow-hidden hover:shadow-[4px_4px_0px_0px_#0A0A0A] transition-all ${c.is_active ? 'border-black' : 'border-[#e3e2e2]'}`}>
            <div className="relative aspect-video bg-[#efeded] border-b border-[#e3e2e2]">
              {c.banner_url && <img src={c.banner_url} alt={c.title} className="w-full h-full object-cover" />}
              {c.is_active && (
                <div className="absolute top-2 right-2 bg-[#00F0FF] text-black text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5">Active</div>
              )}
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm font-bold text-black">{c.title}</p>
              <p className="text-[10px] text-[#747878] mt-0.5">{new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button onClick={() => handleEdit(c)} className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#00F0FF] transition-colors">Modifier</button>
              <button onClick={() => handleDelete(c.id)} className="text-[10px] font-bold uppercase tracking-widest text-[#ba1a1a] hover:underline">Supprimer</button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-[#747878]">Aucune campagne créée</div>
        )}
      </div>
    </div>
  );
}
