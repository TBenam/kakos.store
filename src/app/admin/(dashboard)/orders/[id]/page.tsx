import React from 'react';
import { getOrderDetails } from '../actions';
import OrderDetailClient from './OrderDetailClient';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage(props: PageProps) {
  const params = await props.params;
  const orderId = params.id;

  const result = await getOrderDetails(orderId);

  if (!result.success || !result.order) {
    return (
      <div className="flex flex-col gap-md items-center py-xl text-center">
        <span className="material-symbols-outlined text-[64px] text-error">warning</span>
        <h2 className="font-display text-headline-md font-bold uppercase text-primary">
          Erreur de chargement
        </h2>
        <p className="text-secondary text-sm max-w-md">
          {result.error || 'Cette commande est introuvable ou a été supprimée.'}
        </p>
        <Link
          href="/admin/orders"
          className="bg-primary text-white font-bold text-xs uppercase px-md py-sm border border-primary hover:bg-[#00F0FF] hover:text-primary transition-colors mt-sm"
        >
          Retourner aux commandes
        </Link>
      </div>
    );
  }

  return <OrderDetailClient order={result.order} />;
}
