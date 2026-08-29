interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  NEW: { label: 'Nouveau', classes: 'bg-black text-white border-black' },
  CONFIRMATION_REQUIRED: { label: 'À Confirmer', classes: 'bg-red-50 text-error border-error' },
  CONFIRMED: { label: 'Confirmée', classes: 'bg-blue-50 text-blue-800 border-blue-300' },
  STOCK_CHECKED: { label: 'Stock Vérifié', classes: 'bg-green-50 text-green-800 border-green-300' },
  PREPARING: { label: 'En Préparation', classes: 'bg-orange-500 text-white border-orange-500' },
  READY: { label: 'Prêt', classes: 'bg-cyan-100 text-primary border-primary' },
  OUT_FOR_DELIVERY: { label: 'En Livraison', classes: 'bg-yellow-400 text-primary border-primary' },
  DELIVERED: { label: 'Livrée', classes: 'bg-green-500 text-white border-green-500' },
  CANCELLED: { label: 'Annulée', classes: 'bg-gray-400 text-white border-gray-400' },
  UNREACHABLE: { label: 'Injoignable', classes: 'bg-red-700 text-white border-red-700' },
  REFUSED: { label: 'Refusée', classes: 'bg-red-500 text-white border-red-500' },
  POSTPONED: { label: 'Reportée', classes: 'bg-gray-700 text-white border-gray-700' },
  OUT_OF_STOCK: { label: 'Rupture Stock', classes: 'bg-red-950 text-white border-red-950' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-100 text-gray-800 border-gray-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${config.classes}`}>
      {config.label}
    </span>
  );
}
