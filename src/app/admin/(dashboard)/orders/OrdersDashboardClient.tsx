'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateStoreWhatsApp } from './actions';

interface OrderSummary {
  id: string;
  tracking_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  neighborhood: string;
  delivery_zone_name: string;
  total_price: string;
  status: string;
  created_at: string;
  delivery_person_name: string | null;
}

interface DeliveryZone {
  id: string;
  name: string;
}

interface OrdersDashboardClientProps {
  orders: OrderSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  zones: DeliveryZone[];
  initialWhatsApp: string;
  initialFilters: {
    status: string;
    search: string;
    zoneId: string;
    startDate: string;
    endDate: string;
  };
  dbError?: string;
}

const ALL_STATUSES = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'NEW', label: 'Nouveau' },
  { key: 'CONFIRMATION_REQUIRED', label: 'A Confirmer' },
  { key: 'CONFIRMED', label: 'Confirmé' },
  { key: 'STOCK_CHECKED', label: 'Stock OK' },
  { key: 'PREPARING', label: 'En Préparation' },
  { key: 'READY', label: 'Prêt' },
  { key: 'OUT_FOR_DELIVERY', label: 'En Livraison' },
  { key: 'DELIVERED', label: 'Livré' },
  { key: 'CANCELLED', label: 'Annulé' },
  { key: 'UNREACHABLE', label: 'Injoignable' },
  { key: 'REFUSED', label: 'Refusé' },
  { key: 'POSTPONED', label: 'Reporté' },
  { key: 'OUT_OF_STOCK', label: 'Rupture' },
];

export default function OrdersDashboardClient({
  orders,
  totalCount,
  totalPages,
  currentPage,
  zones,
  initialWhatsApp,
  initialFilters,
  dbError,
}: OrdersDashboardClientProps) {
  const router = useRouter();

  // Local state for filters
  const [search, setSearch] = useState(initialFilters.search);
  const [zoneId, setZoneId] = useState(initialFilters.zoneId);
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);

  // Settings Configuration State
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsApp);
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Apply filters via URL query
  const applyFilters = (updates: Record<string, string | number>) => {
    const query = new URLSearchParams();
    
    // Base filters from state
    if (initialFilters.status && initialFilters.status !== 'ALL') {
      query.set('status', initialFilters.status);
    }
    if (search) query.set('search', search);
    if (zoneId) query.set('zoneId', zoneId);
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    query.set('page', '1'); // reset to page 1

    // Apply updates
    Object.entries(updates).forEach(([key, val]) => {
      if (val === '' || val === 'ALL') {
        query.delete(key);
      } else {
        query.set(key, String(val));
      }
    });

    router.push(`/admin/orders?${query.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({});
  };

  const handleClearFilters = () => {
    setSearch('');
    setZoneId('');
    setStartDate('');
    setEndDate('');
    router.push('/admin/orders');
  };

  const handleStatusChange = (statusKey: string) => {
    applyFilters({ status: statusKey });
  };

  const handlePageChange = (pageNumber: number) => {
    applyFilters({ page: pageNumber });
  };

  // WhatsApp number edit save
  const handleSaveWhatsApp = async () => {
    if (!whatsappNumber.trim()) return;
    setIsSavingWhatsApp(true);
    setSettingsMessage(null);

    const res = await updateStoreWhatsApp(whatsappNumber);
    setIsSavingWhatsApp(false);
    
    if (res.success) {
      setSettingsMessage({ text: 'Numéro WhatsApp KAKOS mis à jour avec succès.', error: false });
      setIsEditingWhatsApp(false);
    } else {
      setSettingsMessage({ text: res.error || 'Erreur lors de la mise à jour.', error: true });
    }
  };

  // Helper for status badge color styles in brutalist theme
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-[#0A0A0A] text-white border border-[#0A0A0A]';
      case 'CONFIRMATION_REQUIRED':
        return 'bg-white text-error border border-error';
      case 'CONFIRMED':
        return 'bg-white text-blue-600 border border-blue-600';
      case 'STOCK_CHECKED':
        return 'bg-white text-green-600 border border-green-600';
      case 'PREPARING':
        return 'bg-orange-500 text-white border border-orange-500';
      case 'READY':
        return 'bg-[#00F0FF] text-primary border border-primary font-bold';
      case 'OUT_FOR_DELIVERY':
        return 'bg-yellow-400 text-primary border border-primary font-bold';
      case 'DELIVERED':
        return 'bg-green-500 text-white border border-green-500 font-bold';
      case 'CANCELLED':
        return 'bg-gray-400 text-white border border-gray-400';
      case 'UNREACHABLE':
        return 'bg-red-700 text-white border border-red-700';
      case 'REFUSED':
        return 'bg-red-500 text-white border border-red-500';
      case 'POSTPONED':
        return 'bg-gray-700 text-white border border-gray-700';
      case 'OUT_OF_STOCK':
        return 'bg-red-950 text-white border border-red-950';
      default:
        return 'bg-white text-primary border border-primary';
    }
  };

  return (
    <div className="flex flex-col gap-lg pb-24 w-full">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-md border-b-2 border-[#0A0A0A] pb-md">
        <div>
          <h2 className="font-display text-headline-lg font-bold tracking-tighter uppercase text-[#0A0A0A]">
            GESTION DES COMMANDES (COD)
          </h2>
          <p className="font-sans text-xs text-[#5d5f5f]">
            Suivi en temps réel des commandes, expéditions et livraison.
          </p>
        </div>

        {/* WhatsApp Configuration Widget */}
        <div className="bg-white border-2 border-primary p-sm max-w-sm flex flex-col gap-xs shadow-[4px_4px_0px_0px_#0A0A0A]">
          <span className="font-label-sm text-[10px] uppercase font-bold text-[#5d5f5f] flex items-center gap-xs">
            <span className="material-symbols-outlined text-xs text-[#25D366] fill">call</span>
            NUMÉRO DE RÉCEPTION WHATSAPP
          </span>

          {isEditingWhatsApp ? (
            <div className="flex gap-xs mt-xs">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ex: 237697259094"
                className="border border-[#c4c7c7] px-sm py-xs text-xs font-mono grow bg-transparent"
                disabled={isSavingWhatsApp}
              />
              <button
                onClick={handleSaveWhatsApp}
                disabled={isSavingWhatsApp}
                className="bg-[#00F0FF] text-primary border border-primary px-sm py-xs text-[10px] uppercase font-bold hover:bg-[#0A0A0A] hover:text-white transition-colors"
              >
                💾
              </button>
              <button
                onClick={() => {
                  setWhatsappNumber(initialWhatsApp);
                  setIsEditingWhatsApp(false);
                }}
                disabled={isSavingWhatsApp}
                className="border border-primary px-sm py-xs text-[10px] uppercase font-bold hover:bg-[#efeded] transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-lg mt-xs">
              <span className="font-mono text-sm font-bold text-primary">
                +{whatsappNumber}
              </span>
              <button
                onClick={() => setIsEditingWhatsApp(true)}
                className="bg-primary text-white hover:bg-[#00F0FF] hover:text-primary transition-all text-[10px] uppercase font-bold px-sm py-xs"
              >
                Modifier
              </button>
            </div>
          )}
          
          {settingsMessage && (
            <span className={`text-[10px] font-bold ${settingsMessage.error ? 'text-error' : 'text-green-600'} mt-xs`}>
              {settingsMessage.text}
            </span>
          )}
        </div>
      </div>

      {dbError && (
        <div className="border-2 border-error bg-[#ffdad6] text-[#93000a] p-md font-bold text-xs shadow-[4px_4px_0px_0px_#ba1a1a]">
          ⚠️ ERREUR DE CONNEXION BASE DE DONNÉES : {dbError}. <br />
          <span className="font-normal text-[11px] mt-xs block">
            Les ports SQL Supabase (5432/6543) sont bloqués sur votre réseau local. L'application tourne en local et fonctionnera automatiquement une fois déployée sur un serveur avec accès direct.
          </span>
        </div>
      )}

      {/* Filters Search Section */}
      <section className="bg-white border-2 border-primary p-md shadow-[4px_4px_0px_0px_#0A0A0A]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-sm">
            {/* Search Input */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Réf, Nom, Téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#c4c7c7] p-xs text-xs focus:border-primary bg-transparent rounded-none"
              />
            </div>

            {/* Zone Filter */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                Zone de livraison
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="border border-[#c4c7c7] p-xs text-xs focus:border-primary bg-transparent rounded-none h-[30px]"
              >
                <option value="ALL">Toutes les zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                Date début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-[#c4c7c7] p-xs text-xs focus:border-primary bg-transparent rounded-none"
              />
            </div>

            {/* Date Range End */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                Date fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-[#c4c7c7] p-xs text-xs focus:border-primary bg-transparent rounded-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-sm border-t border-[#efeded] pt-sm">
            <button
              type="button"
              onClick={handleClearFilters}
              className="border border-primary text-primary hover:bg-[#efeded] font-bold text-[10px] uppercase tracking-wider px-md py-sm transition-colors"
            >
              Effacer
            </button>
            <button
              type="submit"
              className="bg-primary text-white hover:bg-[#00F0FF] hover:text-primary border border-primary font-bold text-[10px] uppercase tracking-wider px-md py-sm transition-colors"
            >
              Appliquer
            </button>
          </div>
        </form>
      </section>

      {/* Status Tabs */}
      <section className="w-full border-b border-[#c4c7c7] flex overflow-x-auto no-scrollbar scroll-smooth">
        {ALL_STATUSES.map((tab) => {
          const isActive = initialFilters.status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-md py-sm whitespace-nowrap text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-150 ${
                isActive
                  ? 'border-primary text-primary bg-[#efeded]'
                  : 'border-transparent text-[#5d5f5f] hover:text-primary hover:border-[#c4c7c7]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

      {/* Orders Table */}
      <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-primary text-white uppercase text-[10px] tracking-wider border-b border-primary">
              <th className="p-md font-bold">Référence</th>
              <th className="p-md font-bold">Client</th>
              <th className="p-md font-bold">Date</th>
              <th className="p-md font-bold">Zone / Ville</th>
              <th className="p-md font-bold text-right">Total</th>
              <th className="p-md font-bold text-center">Statut</th>
              <th className="p-md font-bold">Livreur</th>
              <th className="p-md font-bold text-center">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efeded] text-xs">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-xl text-center text-[#5d5f5f] font-bold">
                  Aucune commande trouvée correspondante aux filtres.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                  {/* Tracking Number */}
                  <td className="p-md font-mono font-bold text-[#0A0A0A]">{order.tracking_number}</td>

                  {/* Customer details */}
                  <td className="p-md">
                    <div className="font-bold text-primary">{order.customer_name}</div>
                    <div className="text-[10px] text-secondary font-mono mt-xs">{order.customer_phone}</div>
                  </td>

                  {/* Created At */}
                  <td className="p-md text-[#5d5f5f]">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Zone/City */}
                  <td className="p-md">
                    <div className="font-bold text-primary">{order.city}</div>
                    <div className="text-[10px] text-secondary mt-xs">{order.neighborhood}</div>
                  </td>

                  {/* Total Price */}
                  <td className="p-md text-right font-mono font-bold text-primary">
                    {Number(order.total_price).toLocaleString('fr-FR')} FCFA
                  </td>

                  {/* Status Badge */}
                  <td className="p-md text-center">
                    <span className={`inline-block text-[9px] uppercase font-bold tracking-wider px-sm py-xs ${getStatusBadge(order.status)}`}>
                      {tabLabel(order.status)}
                    </span>
                  </td>

                  {/* Delivery Person */}
                  <td className="p-md font-bold text-secondary">
                    {order.delivery_person_name ? (
                      <span className="flex items-center gap-xs text-primary font-bold">
                        <span className="material-symbols-outlined text-xs">motorcycle</span>
                        {order.delivery_person_name}
                      </span>
                    ) : (
                      <span className="text-[#c4c7c7] font-normal italic">Non assigné</span>
                    )}
                  </td>

                  {/* Details Link */}
                  <td className="p-md text-center">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-block bg-primary hover:bg-[#00F0FF] text-white hover:text-primary px-sm py-xs text-[10px] uppercase font-bold border border-primary transition-colors font-sans"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <section className="flex justify-between items-center bg-white border-2 border-primary p-sm shadow-[4px_4px_0px_0px_#0A0A0A]">
          <span className="text-[10px] font-bold text-secondary uppercase px-sm">
            Commandes {orders.length} sur {totalCount}
          </span>

          <div className="flex gap-xs">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`border border-primary px-sm py-xs text-xs font-bold transition-all ${
                currentPage === 1
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-primary hover:bg-[#efeded]'
              }`}
            >
              Précédent
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`border px-sm py-xs text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-primary text-white border-primary'
                      : 'border-[#c4c7c7] text-[#5d5f5f] hover:text-primary hover:border-primary'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`border border-primary px-sm py-xs text-xs font-bold transition-all ${
                currentPage === totalPages
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-primary hover:bg-[#efeded]'
              }`}
            >
              Suivant
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// Convert DB status key to readable label
function tabLabel(status: string) {
  return ALL_STATUSES.find((s) => s.key === status)?.label || status;
}
