import { createSupabaseServerClient } from '@/lib/supabase-server';
import ProductForm from '../ProductForm';

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <ProductForm
      product={undefined}
      categories={categories ?? []}
      variants={[]}
      images={[]}
    />
  );
}
