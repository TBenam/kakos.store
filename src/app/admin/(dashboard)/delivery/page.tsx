import { createSupabaseServerClient } from '@/lib/supabase-server';
import DeliveryPageClient from './DeliveryPageClient';

export const revalidate = 0;

export default async function AdminDeliveryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('name');

  return <DeliveryPageClient zones={zones ?? []} />;
}
