'use client';

import { useState, useTransition } from 'react';
import { updateSettingsAction } from '@/app/admin/actions';

interface StoreInfo {
  name: string;
  currency: string;
  whatsapp_contact: string;
  country: string;
  physical_store_address?: string;
  pickup_location?: string;
}

interface SettingsFormProps {
  initialStoreInfo: StoreInfo;
}

export default function SettingsForm({ initialStoreInfo }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(initialStoreInfo);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettingsAction('store_info', storeInfo);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Paramètres mis à jour avec succès.' });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const inputCls = "w-full border border-[#c4c7c7] bg-transparent px-3 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors";
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-display text-4xl font-bold text-black tracking-tighter uppercase">Paramètres</h2>
        <p className="text-sm text-[#444748] mt-1">Configurez les informations globales de votre boutique Kakos</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-[#e3e2e2] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] flex flex-col gap-5">
        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black border-b border-[#e3e2e2] pb-3">Informations de la Boutique</h3>

        <div>
          <label className={labelCls}>Nom du Store</label>
          <input
            className={inputCls}
            value={storeInfo.name || ''}
            onChange={e => setStoreInfo(p => ({ ...p, name: e.target.value }))}
            placeholder="KAKOS"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Numéro de contact WhatsApp (avec code pays, sans +)</label>
            <input
              className={inputCls}
              value={storeInfo.whatsapp_contact || ''}
              onChange={e => setStoreInfo(p => ({ ...p, whatsapp_contact: e.target.value }))}
              placeholder="237697259094"
            />
            <p className="text-[10px] text-[#747878] mt-1">Sert pour la redirection client lors du Checkout COD.</p>
          </div>

          <div>
            <label className={labelCls}>Pays</label>
            <input
              className={inputCls}
              value={storeInfo.country || ''}
              onChange={e => setStoreInfo(p => ({ ...p, country: e.target.value }))}
              placeholder="Cameroun"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Devise</label>
            <input
              className={inputCls}
              value={storeInfo.currency || ''}
              onChange={e => setStoreInfo(p => ({ ...p, currency: e.target.value }))}
              placeholder="XAF"
            />
          </div>

          <div>
            <label className={labelCls}>Adresse Boutique Physique & Point de Retrait</label>
            <input
              className={inputCls}
              value={storeInfo.physical_store_address || storeInfo.pickup_location || ''}
              onChange={e => {
                const val = e.target.value;
                setStoreInfo(p => ({ ...p, physical_store_address: val, pickup_location: val }));
              }}
              placeholder="Douala, Hôpital Souboum"
            />
            <p className="text-[10px] text-[#747878] mt-1">Emplacement de la boutique physique et du retrait sur place.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="self-start mt-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest px-6 py-3 hover:bg-[#00F0FF] hover:text-black transition-all shadow-[4px_4px_0px_0px_#00F0FF] hover:shadow-[2px_2px_0px_0px_#0A0A0A] disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
}
