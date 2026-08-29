'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  OrderDetails,
  updateOrderStatus,
  assignDeliveryPerson,
  addInternalNote,
} from '../actions';

interface OrderDetailClientProps {
  order: OrderDetails;
}

const ALL_STATUSES = [
  { key: 'NEW', label: 'Nouveau (NEW)' },
  { key: 'CONFIRMATION_REQUIRED', label: 'Confirmation Requise' },
  { key: 'CONFIRMED', label: 'Confirmé' },
  { key: 'STOCK_CHECKED', label: 'Stock Vérifié' },
  { key: 'PREPARING', label: 'En Préparation' },
  { key: 'READY', label: 'Prêt pour Livraison' },
  { key: 'OUT_FOR_DELIVERY', label: 'En Cours de Livraison' },
  { key: 'DELIVERED', label: 'Livré' },
  { key: 'CANCELLED', label: 'Annulé' },
  { key: 'UNREACHABLE', label: 'Client Injoignable' },
  { key: 'REFUSED', label: 'Refusé par Client' },
  { key: 'POSTPONED', label: 'Livraison Reportée' },
  { key: 'OUT_OF_STOCK', label: 'Rupture de Stock' },
];

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();

  // Delivery state
  const [driverName, setDriverName] = useState(order.delivery_person_name || '');
  const [driverPhone, setDriverPhone] = useState(order.delivery_person_phone || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentMsg, setAssignmentMsg] = useState('');

  // Transition state
  const [transitionNotes, setTransitionNotes] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  // Internal note state
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Admin');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Format Cameroon client phone number for WhatsApp url
  const getClientWhatsAppUrl = () => {
    let clean = order.customer_phone.replace(/\D/g, '');
    if (clean.length === 9 && clean.startsWith('6')) {
      clean = '237' + clean; // Add Cameroon country code if local number
    }
    return `https://wa.me/${clean}`;
  };

  // Assign delivery person handler
  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    setAssignmentMsg('');

    const res = await assignDeliveryPerson(order.id, driverName, driverPhone);
    setIsAssigning(false);

    if (res.success) {
      setAssignmentMsg('Livreur mis à jour avec succès.');
      router.refresh();
    } else {
      setAssignmentMsg(res.error || "Erreur lors de l'assignation.");
    }
  };

  // Status transition handler
  const handleTransition = async (statusKey: string) => {
    setIsTransitioning(true);
    setTransitionError('');

    const res = await updateOrderStatus(order.id, statusKey, transitionNotes);
    setIsTransitioning(false);

    if (res.success) {
      setTransitionNotes('');
      router.refresh();
    } else {
      setTransitionError(res.error || 'Erreur lors du changement de statut.');
    }
  };

  // Add internal note handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsAddingNote(true);
    setNoteError('');

    const res = await addInternalNote(order.id, noteAuthor, noteContent);
    setIsAddingNote(false);

    if (res.success) {
      setNoteContent('');
      router.refresh();
    } else {
      setNoteError(res.error || 'Erreur lors de l’ajout de la note.');
    }
  };

  // Combine history and notes arrays into a single chronological timeline (newest first)
  const getTimeline = () => {
    const timelineItems: any[] = [];

    // Map status history
    order.history.forEach((h) => {
      timelineItems.push({
        id: h.id,
        type: 'history',
        title: `Statut : ${tabLabel(h.status)}`,
        notes: h.notes,
        created_at: h.created_at,
        user: h.changed_by_email || 'Système',
        icon: 'sync_alt',
        color: 'text-blue-500 bg-blue-50',
      });
    });

    // Map internal notes
    order.notes.forEach((n) => {
      timelineItems.push({
        id: n.id,
        type: 'note',
        title: 'Note Interne',
        notes: n.content,
        created_at: n.created_at,
        user: n.author,
        icon: 'chat',
        color: 'text-[#00F0FF] bg-[#0A0A0A]',
      });
    });

    // Sort by date descending
    return timelineItems.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const timeline = getTimeline();

  // Quick Logical Transitions based on current status
  const getQuickTransitions = () => {
    const status = order.status;
    const buttons: { label: string; status: string; style: string }[] = [];

    switch (status) {
      case 'NEW':
        buttons.push(
          { label: 'Confirmer', status: 'CONFIRMED', style: 'bg-[#00F0FF] text-primary border border-primary hover:bg-[#0A0A0A] hover:text-white' },
          { label: 'Demander Confirmation', status: 'CONFIRMATION_REQUIRED', style: 'bg-white text-error border border-error hover:bg-[#ffdad6]' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'CONFIRMATION_REQUIRED':
        buttons.push(
          { label: 'Confirmer', status: 'CONFIRMED', style: 'bg-[#00F0FF] text-primary border border-primary hover:bg-[#0A0A0A] hover:text-white' },
          { label: 'Client Injoignable', status: 'UNREACHABLE', style: 'bg-red-700 text-white hover:bg-red-800' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'CONFIRMED':
        buttons.push(
          { label: 'Valider le Stock', status: 'STOCK_CHECKED', style: 'bg-green-600 text-white hover:bg-green-700' },
          { label: 'Rupture de Stock', status: 'OUT_OF_STOCK', style: 'bg-red-950 text-white hover:bg-red-900' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'STOCK_CHECKED':
        buttons.push(
          { label: 'Mettre en Préparation', status: 'PREPARING', style: 'bg-orange-500 text-white hover:bg-orange-600' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'PREPARING':
        buttons.push(
          { label: 'Prêt pour Livraison', status: 'READY', style: 'bg-[#00F0FF] text-primary border border-primary hover:bg-[#0A0A0A] hover:text-white' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'READY':
        buttons.push(
          { label: 'Remettre au Livreur', status: 'OUT_FOR_DELIVERY', style: 'bg-yellow-400 text-primary border border-primary hover:bg-[#0A0A0A] hover:text-white' },
          { label: 'Annuler', status: 'CANCELLED', style: 'bg-gray-400 text-white hover:bg-gray-500' }
        );
        break;
      case 'OUT_FOR_DELIVERY':
        buttons.push(
          { label: 'Livré (Encaissé)', status: 'DELIVERED', style: 'bg-green-500 text-white hover:bg-green-600 font-bold' },
          { label: 'Reporté', status: 'POSTPONED', style: 'bg-gray-700 text-white hover:bg-gray-800' },
          { label: 'Refusé', status: 'REFUSED', style: 'bg-red-500 text-white hover:bg-red-600' },
          { label: 'Client Injoignable', status: 'UNREACHABLE', style: 'bg-red-700 text-white hover:bg-red-800' }
        );
        break;
      default:
        // Completed/Cancelled/Refused states don't have quick actions
        break;
    }
    return buttons;
  };

  const quickTransitions = getQuickTransitions();

  return (
    <div className="flex flex-col gap-lg pb-24 w-full">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md border-b-2 border-[#0A0A0A] pb-md">
        <div>
          <div className="flex items-center gap-sm">
            <Link
              href="/admin/orders"
              className="text-[#5d5f5f] hover:text-primary font-bold text-xs uppercase flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Retour
            </Link>
            <span className="text-[#c4c7c7]">•</span>
            <span className="font-mono text-sm text-[#5d5f5f]">Commande #{order.tracking_number}</span>
          </div>

          <h2 className="font-display text-headline-lg font-bold tracking-tighter uppercase text-primary mt-xs">
            Détail Commande
          </h2>
        </div>

        {/* Action button header */}
        <div className="flex gap-sm">
          <a
            href={getClientWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white font-bold text-xs uppercase px-md py-sm border border-[#25D366] hover:bg-[#0A0A0A] hover:text-white transition-all flex items-center gap-sm shadow-[4px_4px_0px_0px_#0A0A0A]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.503-5.714-1.46L0 24zm6.262-3.642c1.6.953 3.578 1.458 5.748 1.459 5.867 0 10.638-4.767 10.642-10.63.003-2.846-1.1-5.522-3.106-7.53C17.585 1.65 14.922.55 12.012.55 6.142.55 1.37 5.32 1.367 11.185c-.001 2.06.538 4.073 1.56 5.87L1.93 22.07l5.248-1.378z" />
            </svg>
            Contacter Client
          </a>
        </div>
      </div>

      {/* Grid split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left 2 Cols: Main Info, Items, and Transitions */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {/* Status Box & Transition Form */}
          <section className="bg-white border-2 border-primary p-md shadow-[4px_4px_0px_0px_#0A0A0A] flex flex-col gap-md">
            <div className="flex justify-between items-center border-b border-[#efeded] pb-xs">
              <span className="font-label-sm text-[10px] uppercase font-bold text-[#5d5f5f]">
                Statut Actuel
              </span>
              <span className={`px-sm py-xs font-bold text-xs uppercase border ${
                order.status === 'READY' || order.status === 'DELIVERED'
                  ? 'bg-[#00F0FF] text-primary border-primary font-bold'
                  : 'bg-primary text-white border-primary'
              }`}>
                {tabLabel(order.status)}
              </span>
            </div>

            {/* Transition Notes input */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-[10px] uppercase font-bold text-[#5d5f5f]">
                Notes de transition (Optionnel, affiché dans l'historique)
              </label>
              <textarea
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Raison du changement (ex: rupture taille M, reporté à demain, etc.)..."
                className="w-full border border-[#c4c7c7] p-sm text-xs h-16 bg-transparent resize-none rounded-none"
                disabled={isTransitioning}
              />
            </div>

            {/* Transition controls */}
            <div className="flex flex-col gap-sm">
              {transitionError && (
                <div className="text-xs font-bold text-error border border-error bg-[#ffdad6] p-xs">
                  ⚠️ {transitionError}
                </div>
              )}

              {/* Quick Actions */}
              {quickTransitions.length > 0 && (
                <div className="flex flex-col gap-xs">
                  <span className="font-label-sm text-[10px] uppercase font-bold text-primary">
                    Actions Recommandées :
                  </span>
                  <div className="flex flex-wrap gap-xs">
                    {quickTransitions.map((btn) => (
                      <button
                        key={btn.status}
                        onClick={() => handleTransition(btn.status)}
                        disabled={isTransitioning}
                        className={`px-md py-sm text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${btn.style}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Force Manual Status */}
              <div className="flex flex-col gap-xs mt-xs pt-xs border-t border-[#efeded]">
                <label className="font-label-sm text-[10px] uppercase font-bold text-[#5d5f5f]">
                  Forcer un statut spécifique :
                </label>
                <div className="flex gap-xs max-w-sm">
                  <select
                    value={order.status}
                    onChange={(e) => handleTransition(e.target.value)}
                    disabled={isTransitioning}
                    className="border border-[#c4c7c7] px-sm py-xs text-xs font-sans grow bg-transparent h-[30px] rounded-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Ordered items list table */}
          <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A]">
            <h3 className="bg-[#0A0A0A] text-white p-sm font-display text-sm font-bold tracking-tight uppercase">
              Articles commandés
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-primary text-[10px] font-bold uppercase text-[#5d5f5f] bg-[#f5f3f3]">
                    <th className="p-sm">Article</th>
                    <th className="p-sm text-center">Taille</th>
                    <th className="p-sm text-center">Couleur</th>
                    <th className="p-sm text-right">Prix</th>
                    <th className="p-sm text-center">Quantité</th>
                    <th className="p-sm text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeded] text-xs">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-sm font-bold text-primary">{item.title}</td>
                      <td className="p-sm text-center font-mono font-bold text-primary">{item.size}</td>
                      <td className="p-sm text-center text-[#5d5f5f]">{item.color}</td>
                      <td className="p-sm text-right font-mono">
                        {Number(item.unit_price).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="p-sm text-center font-mono font-bold">{item.quantity}</td>
                      <td className="p-sm text-right font-mono font-bold text-primary">
                        {(Number(item.unit_price) * item.quantity).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals panel breakdown */}
            <div className="border-t-2 border-[#0A0A0A] bg-[#f5f3f3] p-md flex flex-col items-end gap-xs font-sans text-xs">
              <div className="flex justify-between w-64 text-[#5d5f5f]">
                <span>Sous-total :</span>
                <span className="font-mono font-bold">
                  {Number(order.subtotal_price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between w-64 text-[#5d5f5f]">
                <span>Livraison ({order.delivery_zone_name}) :</span>
                <span className="font-mono font-bold">
                  +{Number(order.delivery_price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between w-64 border-t border-[#c4c7c7] pt-xs mt-xs text-sm font-bold text-primary">
                <span>TOTAL À ENCAISSER :</span>
                <span className="font-mono font-black text-[#00F0FF] bg-[#0A0A0A] px-sm py-xs">
                  {Number(order.total_price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Col: Client Info, Delivery Driver, Notes & Timeline logs */}
        <div className="flex flex-col gap-lg">
          {/* Client info & shipping address */}
          <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A]">
            <h3 className="bg-[#0A0A0A] text-white p-sm font-display text-sm font-bold tracking-tight uppercase">
              Informations Client
            </h3>
            <div className="p-md flex flex-col gap-sm text-xs font-sans">
              <div>
                <span className="font-bold text-[#5d5f5f] block uppercase text-[10px]">Client</span>
                <span className="font-bold text-primary text-sm">{order.customer_name}</span>
              </div>
              <div>
                <span className="font-bold text-[#5d5f5f] block uppercase text-[10px]">Téléphone</span>
                <span className="font-mono font-bold text-primary">{order.customer_phone}</span>
              </div>
              <div className="border-t border-[#efeded] pt-xs">
                <span className="font-bold text-[#5d5f5f] block uppercase text-[10px]">Ville</span>
                <span className="font-bold text-primary">{order.city}</span>
              </div>
              <div>
                <span className="font-bold text-[#5d5f5f] block uppercase text-[10px]">Quartier</span>
                <span className="font-bold text-primary">{order.neighborhood}</span>
              </div>
              {order.address_precision && (
                <div>
                  <span className="font-bold text-[#5d5f5f] block uppercase text-[10px]">Précisions Adresse</span>
                  <span className="italic text-primary">{order.address_precision}</span>
                </div>
              )}
            </div>
          </section>

          {/* Delivery Person (Livreur) assignment */}
          <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A]">
            <h3 className="bg-[#0A0A0A] text-white p-sm font-display text-sm font-bold tracking-tight uppercase">
              Livreur Assigné
            </h3>
            <div className="p-md flex flex-col gap-md text-xs font-sans">
              {order.delivery_person_name ? (
                <div className="bg-[#f5f3f3] border border-[#c4c7c7] p-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-primary">{order.delivery_person_name}</div>
                    {order.delivery_person_phone && (
                      <div className="font-mono text-[#5d5f5f] text-[10px] mt-xs">{order.delivery_person_phone}</div>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl">motorcycle</span>
                </div>
              ) : (
                <span className="text-[#5d5f5f] italic block">Aucun livreur assigné pour cette commande.</span>
              )}

              {/* Assignment Form */}
              <form onSubmit={handleAssignDriver} className="flex flex-col gap-xs border-t border-[#efeded] pt-sm">
                <span className="font-label-sm text-[10px] uppercase font-bold text-primary mb-xs">
                  Assigner/Changer Livreur
                </span>

                <div className="flex flex-col gap-xs">
                  <input
                    type="text"
                    placeholder="Nom du livreur"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="border border-[#c4c7c7] p-xs text-xs bg-transparent rounded-none"
                    disabled={isAssigning}
                  />
                  <input
                    type="text"
                    placeholder="Téléphone du livreur"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="border border-[#c4c7c7] p-xs text-xs bg-transparent rounded-none"
                    disabled={isAssigning}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-[#00F0FF] text-white hover:text-primary transition-all border border-primary px-sm py-xs font-bold text-[10px] uppercase tracking-wider rounded-none self-end mt-xs"
                  disabled={isAssigning}
                >
                  Enregistrer
                </button>
                {assignmentMsg && (
                  <span className="text-[10px] font-bold text-secondary mt-xs block">
                    {assignmentMsg}
                  </span>
                )}
              </form>
            </div>
          </section>

          {/* Internal Notes Panel Editor */}
          <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A]">
            <h3 className="bg-[#0A0A0A] text-white p-sm font-display text-sm font-bold tracking-tight uppercase">
              Notes Internes
            </h3>
            <div className="p-md flex flex-col gap-sm text-xs font-sans">
              <form onSubmit={handleAddNote} className="flex flex-col gap-xs">
                {noteError && (
                  <span className="text-[10px] font-bold text-error border border-error bg-[#ffdad6] p-xs">
                    ⚠️ {noteError}
                  </span>
                )}

                <div className="flex gap-xs items-center mb-xs">
                  <span className="font-label-sm text-[10px] uppercase font-bold text-[#5d5f5f]">Auteur:</span>
                  <input
                    type="text"
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    placeholder="Initiales ou Nom"
                    className="border border-[#c4c7c7] px-xs py-xs text-[11px] font-bold bg-transparent rounded-none max-w-[120px]"
                    required
                  />
                </div>

                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Écrire une note interne (visible uniquement par l'équipe)..."
                  className="w-full border border-[#c4c7c7] p-sm text-xs h-20 bg-transparent resize-none rounded-none"
                  disabled={isAddingNote}
                  required
                />

                <button
                  type="submit"
                  className="bg-primary hover:bg-[#00F0FF] text-white hover:text-primary transition-all border border-primary px-sm py-xs font-bold text-[10px] uppercase tracking-wider rounded-none self-end mt-xs"
                  disabled={isAddingNote}
                >
                  Ajouter Note
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>

      {/* History and notes timeline section */}
      <section className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_#0A0A0A] p-md w-full">
        <h3 className="font-display text-headline-md font-bold tracking-tight uppercase text-primary border-b border-[#efeded] pb-xs mb-md">
          Historique & Notes Internes
        </h3>

        {timeline.length === 0 ? (
          <p className="text-xs text-[#5d5f5f] italic">Aucun événement loggé dans l'historique.</p>
        ) : (
          <div className="relative border-l border-[#c4c7c7] ml-sm pl-md flex flex-col gap-md py-sm">
            {timeline.map((item) => (
              <div key={item.id} className="relative flex flex-col gap-xs text-xs font-sans">
                {/* Timeline node icon */}
                <div className={`absolute -left-[27px] top-0 w-[18px] h-[18px] rounded-full border border-primary flex items-center justify-center ${item.color}`}>
                  <span className="material-symbols-outlined text-[10px] font-bold">{item.icon}</span>
                </div>

                {/* Timeline details header */}
                <div className="flex justify-between items-center text-[10px] text-[#5d5f5f] uppercase font-bold tracking-wider">
                  <div className="flex items-center gap-xs">
                    <span className="text-primary font-black">{item.title}</span>
                    <span>•</span>
                    <span>Par {item.user}</span>
                  </div>
                  <span className="font-mono font-normal">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Timeline content note */}
                {item.notes && (
                  <div className={`p-sm font-medium ${item.type === 'note' ? 'bg-[#efeded] border-l-2 border-primary' : 'bg-surface border-l-2 border-blue-500'} text-[#1b1c1c] leading-relaxed whitespace-pre-wrap`}>
                    {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Convert DB status key to readable label
function tabLabel(status: string) {
  return ALL_STATUSES.find((s) => s.key === status)?.label || status;
}
