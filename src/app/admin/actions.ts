'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' };
  }

  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Identifiants incorrects.' };
  }

  // Verify user is in admin_profiles
  const { data: adminProfile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !adminProfile) {
    await supabase.auth.signOut();
    return { error: 'Accès refusé. Ce compte n\'a pas les droits administrateur.' };
  }

  redirect('/admin');
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function updateOrderStatusAction(orderId: string, newStatus: string, notes?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateError) return { error: updateError.message };

  // Insert history record
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: newStatus,
    changed_by: user.id,
    notes: notes || null,
  });

  return { success: true };
}

export async function upsertProductAction(productData: {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  supplier_price: number;
  sale_price: number;
  is_active: boolean;
  promo_price?: number | null;
  badge?: string | null;
  sku?: string | null;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_featured?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const payload: Record<string, any> = {
    title: productData.title,
    slug: productData.slug,
    description: productData.description,
    category_id: productData.category_id || null,
    supplier_price: productData.supplier_price,
    sale_price: productData.sale_price,
    is_active: productData.is_active,
  };

  if (productData.id) {
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productData.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { success: true, id: data.id };
  }

  return { success: true };
}

export async function deleteVariantAction(variantId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function upsertVariantAction(variant: {
  id?: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
}) {
  const supabase = await createSupabaseServerClient();
  if (variant.id) {
    const { error } = await supabase
      .from('product_variants')
      .update({ size: variant.size, color: variant.color, stock: variant.stock })
      .eq('id', variant.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('product_variants').insert(variant);
    if (error) return { error: error.message };
  }
  return { success: true };
}

export async function deleteProductImageAction(imageId: string, storagePath: string) {
  const supabase = await createSupabaseServerClient();

  // Delete from storage
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('products')
      .remove([storagePath]);
    if (storageError) console.error('Storage delete error:', storageError.message);
  }

  // Delete from DB
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function setPrimaryImageAction(productId: string, imageId: string) {
  const supabase = await createSupabaseServerClient();

  // Get all images ordered by position
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .order('position', { ascending: true });

  if (error || !images) return { error: error?.message || 'Erreur images' };

  const others = images.filter((img) => img.id !== imageId);
  const newOrder = [imageId, ...others.map((img) => img.id)];

  for (let i = 0; i < newOrder.length; i++) {
    await supabase
      .from('product_images')
      .update({ position: i })
      .eq('id', newOrder[i]);
  }

  return { success: true };
}

export async function upsertDeliveryZoneAction(zone: {
  id?: string;
  name: string;
  price: number;
  is_active: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  if (zone.id) {
    const { error } = await supabase
      .from('delivery_zones')
      .update({ name: zone.name, price: zone.price, is_active: zone.is_active })
      .eq('id', zone.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('delivery_zones').insert(zone);
    if (error) return { error: error.message };
  }
  return { success: true };
}

export async function deleteDeliveryZoneAction(zoneId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function upsertCampaignAction(campaign: {
  id?: string;
  title: string;
  banner_url: string;
  is_active: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  if (campaign.id) {
    const { error } = await supabase
      .from('campaigns')
      .update({ title: campaign.title, banner_url: campaign.banner_url, is_active: campaign.is_active })
      .eq('id', campaign.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('campaigns').insert(campaign);
    if (error) return { error: error.message };
  }
  return { success: true };
}

export async function deleteCampaignAction(campaignId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateSettingsAction(key: string, value: object) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value })
    .eq('key', key);
  if (error) return { error: error.message };
  return { success: true };
}
