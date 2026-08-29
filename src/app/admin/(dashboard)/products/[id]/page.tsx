import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ProductForm from '../ProductForm';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single(),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  if (!product) notFound();

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('size');

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .order('position');

  return (
    <ProductForm
      product={product}
      categories={categories ?? []}
      variants={variants ?? []}
      images={images ?? []}
    />
  );
}
