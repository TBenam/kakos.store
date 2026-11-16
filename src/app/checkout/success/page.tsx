'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const trackingNumber = searchParams.get('tracking_number') || 'KK-XXXXXX';
  const whatsappUrl = searchParams.get('whatsapp_url') || 'https://wa.me/237697259094';
  const total = searchParams.get('total') ? Number(searchParams.get('total')) : null;

  return (
    <div className="flex-grow w-full max-w-lg mx-auto px-container-margin py-xl flex flex-col gap-lg items-center text-center pb-24">
      {/* Icon */}
      <span className="material-symbols-outlined text-[64px] text-accent fill animate-bounce" data-icon="check_circle">
        check_circle
      </span>

      {/* Message */}
      <div className="flex flex-col gap-xs">
        <h1 className="font-display text-headline-md sm:text-headline-lg font-bold tracking-tighter text-primary uppercase">
          COMMANDE ENREGISTRÉE !
        </h1>
        <p className="font-body-md text-sm text-secondary">
          Merci pour votre achat chez KAKOS. Votre commande est actuellement en attente de confirmation.
        </p>
      </div>

      {/* Recap Block */}
      <div className="w-full border-2 border-primary bg-surface-container-low p-md flex flex-col gap-sm text-left">
        <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
          <span className="font-label-sm text-[10px] uppercase font-bold text-secondary">RÉFÉRENCE</span>
          <span className="font-display text-sm font-bold text-primary">{trackingNumber}</span>
        </div>
        
        {total && (
          <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
            <span className="font-label-sm text-[10px] uppercase font-bold text-secondary">TOTAL À PAYER</span>
            <span className="font-display text-sm font-bold text-primary">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="font-label-sm text-[10px] uppercase font-bold text-secondary">PAIEMENT</span>
          <span className="font-label-sm text-[10px] uppercase font-bold text-[#00F0FF] bg-primary px-sm py-xs">
            À LA LIVRAISON (COD)
          </span>
        </div>
      </div>

      {/* Info Reassurance Box */}
      <div className="border border-outline-variant p-md text-xs font-body-md text-secondary leading-normal text-center bg-surface-container-low rounded-lg">
        <p className="font-bold text-primary mb-1">📦 Votre commande est enregistrée avec succès !</p>
        <p>Notre équipe prépare votre colis. Notre livreur vous contactera par téléphone avant la livraison pour confirmer le créneau.</p>
      </div>

      {/* Main CTA Action */}
      <div className="w-full mt-md flex flex-col gap-sm">
        <Link
          href="/"
          className="w-full bg-accent text-primary font-display text-base font-black uppercase py-md px-lg flex justify-center items-center gap-xs rounded-lg border-2 border-primary shadow-brutalist hover:shadow-brutalist-hover active:scale-95 transition-all text-center"
        >
          CONTINUER MES ACHATS
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-xl">
        <span className="material-symbols-outlined animate-spin text-[36px] text-accent" data-icon="sync">sync</span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
