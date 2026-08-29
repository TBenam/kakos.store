'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/app/admin/actions';

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    if (status === currentStatus && !notes) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status, notes || undefined);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Statut mis à jour avec succès.' });
        setNotes('');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-2">Nouveau Statut</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${status === s ? 'bg-black text-white border-black' : 'bg-white text-[#444748] border-[#c4c7c7] hover:border-black'}`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-black mb-1.5">Note (optionnelle)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Raison du changement, message client..."
          rows={2}
          className="w-full border border-[#c4c7c7] px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
        />
      </div>

      {message && (
        <div className={`px-3 py-2 text-xs font-medium border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpdate}
        disabled={isPending}
        className="self-start bg-black text-white text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 hover:bg-[#00F0FF] hover:text-black transition-all disabled:opacity-50"
      >
        {isPending ? 'Enregistrement...' : 'Mettre à jour le statut'}
      </button>
    </div>
  );
}
