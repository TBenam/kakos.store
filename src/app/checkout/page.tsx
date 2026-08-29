import React from 'react';
import { query } from '@/lib/db';
import CheckoutClient from './CheckoutClient';

interface DbDeliveryZone {
  id: string;
  name: string;
  price: string;
}

export const dynamic = 'force-dynamic'; // Do not cache checkout pages

export default async function CheckoutPage() {
  let zones: DbDeliveryZone[] = [];

  try {
    const res = await query<DbDeliveryZone>(
      'SELECT id, name, price FROM public.delivery_zones WHERE is_active = true ORDER BY name ASC'
    );
    zones = res.rows;
  } catch (error) {
    console.error('Failed to fetch delivery zones for checkout:', error);
  }

  return <CheckoutClient zones={zones} />;
}
