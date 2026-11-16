import { createSupabaseServerClient } from '@/lib/supabase-server';
import SettingsForm from './SettingsForm';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: settingsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'store_info')
    .single();

  const initialStoreInfo = (settingsData?.value as any) || {
    name: 'KAKOS',
    currency: 'XAF',
    whatsapp_contact: '237697259094',
    country: 'Cameroun',
    physical_store_address: 'Douala, Hôpital Souboum',
    pickup_location: 'Douala, Hôpital Souboum',
  };

  return <SettingsForm initialStoreInfo={initialStoreInfo} />;
}
