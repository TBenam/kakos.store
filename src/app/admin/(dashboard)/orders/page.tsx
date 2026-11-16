import React from 'react';
import { getOrders, getStoreSettings } from './actions';
import OrdersDashboardClient from './OrdersDashboardClient';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    zoneId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const status = searchParams.status || 'ALL';
  const search = searchParams.search || '';
  const zoneId = searchParams.zoneId || '';
  const startDate = searchParams.startDate || '';
  const endDate = searchParams.endDate || '';
  const page = parseInt(searchParams.page || '1', 10);

  // Fetch orders based on searchParams
  const result = await getOrders({
    status,
    search,
    zoneId,
    startDate,
    endDate,
    page,
    limit: 10,
  });

  // Fetch official WhatsApp settings
  const settingsResult = await getStoreSettings();
  const whatsappContact = settingsResult.success 
    ? settingsResult.settings?.whatsapp_contact || '237697259094'
    : '237697259094';

  return (
    <OrdersDashboardClient
      orders={result.success ? result.orders : []}
      totalCount={result.success ? result.totalCount : 0}
      totalPages={result.success ? result.totalPages : 0}
      currentPage={result.success ? result.currentPage : 1}
      zones={result.success ? result.zones : []}
      initialWhatsApp={whatsappContact}
      initialFilters={{
        status,
        search,
        zoneId,
        startDate,
        endDate,
      }}
      dbError={!result.success ? result.error : undefined}
    />
  );
}
