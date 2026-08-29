import { createSupabaseServerClient } from '@/lib/supabase-server';
import CampaignsPageClient from './CampaignsPageClient';

export const revalidate = 0;

export default async function AdminCampaignsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  return <CampaignsPageClient campaigns={campaigns ?? []} />;
}
