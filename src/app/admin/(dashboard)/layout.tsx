import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'KAKOS Admin',
  description: 'Tableau de bord administrateur KAKOS MENSWEAR',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Verify admin profile
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#f5f3f3] flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-8">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
