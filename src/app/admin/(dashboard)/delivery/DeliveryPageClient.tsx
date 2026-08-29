'use client';

import { useState, useTransition } from 'react';
import { upsertDeliveryZoneAction, deleteDeliveryZoneAction } from '@/app/admin/actions';

interface DeliveryZone {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export default function DeliveryPageClient({ zones: initialZones }: { zones: DeliveryZone[] }) {
  const [zones, setZones] = useState(initialZones);
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', is_active: true });
  const [message, setMessage] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleEdit = (zone: DeliveryZone) => {
    setEditId(zone.id);
    setForm({ name: zone.name, price: String(zone.price), is_active: zone.is_active });
    setShowAdd(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertDeliveryZoneAction({
        id: editId || undefined,
        name: form.name,
        price: parseFloat(form.price) || 0,
        is_active: form.is_active,
      });
      if (result?.error) {
        setMessage('Erreur: ' + result.error);
      } else {
        setMessage('Zone enregistrée.');
        setEditId(null);
        setShowAdd(false);
        setForm({ name: '', price: '', is_active: true });
        setTimeout(() => window.location.reload(), 500);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    startTransition(async () => {
      await deleteDeliveryZoneAction(id);
      setZones(prev => prev.filter(z => z.id !== id));
    });
  };

  const handleToggleActive = (zone: DeliveryZone) => {
    startTransition(async () => {
      await upsertDeliveryZoneAction({ id: zone.id, name: zone.name, price: zone.price, is_active: !zone.is_active });
      setZones(prev => prev.map(z => z.id === zone.id ? { ...z, is_active: !z.is_active } : z));
    });
  };

  const inputCls = "w-full border border-[#c4c7c7] px-3 py-2 text-sm focus:border-black focus:outline-none bg-transparent";

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold text-black tracking-tighter uppercase">Livraison</h2>
          <p className="text-sm text-[#444748] mt-1">{zones.length} zone{zones.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', price: '', is_active: true }); }}
          className="flex items-center gap-2 bg-[#00F0FF] text-black text-[11px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_#0A0A0A]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvelle Zone
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-300 text-green-800 text-sm">{message}</div>
      )}

      {/* Add/Edit Form */}
      {(showAdd || editId) && (
        <div className="bg-white border border-[#e3e2e2] p-5 mb-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black mb-4">{editId ? 'Modifier la Zone' : 'Nouvelle Zone'}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5">Nom de la zone</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Douala (Standard)" />
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5">Prix (FCFA)</label>
              <input className={inputCls} type="number" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="text-xs font-bold uppercase tracking-widest text-black">Active</label>
              <div
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-all ${form.is_active ? 'bg-black' : 'bg-[#e3e2e2]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={isPending} className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2 hover:bg-[#00F0FF] hover:text-black transition-all">
              {isPending ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditId(null); }} className="border border-[#c4c7c7] text-[#444748] text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:border-black transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Zones Table */}
      <div className="bg-white border border-[#e3e2e2]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#e3e2e2] border-b-2 border-black">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Zone</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Prix</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Statut</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#444748]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(zone => (
              <tr key={zone.id} className="border-b border-[#f5f3f3] hover:bg-[#f5f3f3]">
                <td className="px-4 py-3 text-sm font-bold text-black">{zone.name}</td>
                <td className="px-4 py-3 text-sm text-[#444748]">
                  {zone.price === 0 ? 'Gratuit' : zone.price.toLocaleString('fr-FR') + ' F CFA'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleActive(zone)} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${zone.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button onClick={() => handleEdit(zone)} className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-[#00F0FF] transition-colors">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(zone.id)} className="text-[10px] font-bold uppercase tracking-widest text-[#ba1a1a] hover:underline">
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
