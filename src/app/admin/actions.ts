'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
  affiliate_eligible?: boolean;
  affiliate_commission_amount?: number | null;
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
    promo_price: productData.promo_price ?? null,
    badge: productData.badge ?? null,
    sku: productData.sku ?? null,
    is_new: productData.is_new ?? false,
    is_bestseller: productData.is_bestseller ?? false,
    is_featured: productData.is_featured ?? false,
    affiliate_eligible: productData.affiliate_eligible ?? false,
    affiliate_commission_amount: productData.affiliate_eligible
      ? Math.max(0, Number(productData.affiliate_commission_amount) || 0)
      : 0,
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

export async function createAffiliateAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const code = String(formData.get('code') || '').trim().toUpperCase();
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const commissionRate = Number(formData.get('commissionRate') || 10) / 100;

  if (!/^[A-Z0-9_-]{3,24}$/.test(code) || !name || !phone) {
    return { error: 'Code, nom ou téléphone invalide.' };
  }

  const { error } = await supabase.from('affiliates').insert({
    code,
    name,
    phone,
    whatsapp_phone: phone,
    commission_rate: commissionRate,
    status: 'ACTIVE',
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/affiliates');
  return { success: true };
}

export async function updateAffiliateStatusAction(affiliateId: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('affiliates').update({ status }).eq('id', affiliateId);
  if (error) return { error: error.message };
  revalidatePath('/admin/affiliates');
  return { success: true };
}

export async function markAffiliateCommissionPaidAction(commissionId: string, paymentReference?: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('affiliate_commissions')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference?.trim() || null,
    })
    .eq('id', commissionId)
    .eq('status', 'APPROVED');

  if (error) return { error: error.message };
  revalidatePath('/admin/affiliates');
  return { success: true };
}

export async function reviewCatalogCandidateAction(
  candidateId: string,
  status: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED'
) {
  const supabase = await createSupabaseServerClient();
  if (status === 'APPROVED') {
    const { data: candidate, error: candidateError } = await supabase
      .from('catalog_candidates')
      .select('blocking_reasons')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) return { error: candidateError?.message || 'Fiche introuvable.' };
    if (candidate.blocking_reasons?.length) {
      return { error: 'Cette fiche contient encore des informations obligatoires à compléter.' };
    }
  }

  const { error } = await supabase
    .from('catalog_candidates')
    .update({
      review_status: status,
      publish_requested: status === 'APPROVED',
      reviewed_at: status === 'REVIEW_REQUIRED' ? null : new Date().toISOString(),
    })
    .eq('id', candidateId);

  if (error) return { error: error.message };
  revalidatePath('/admin/catalogue-import');
  return { success: true };
}

export async function updateCatalogCandidateDetailsAction(candidateId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: candidate, error: fetchError } = await supabase
    .from('catalog_candidates')
    .select('source_payload, media_count')
    .eq('id', candidateId)
    .single();
  if (fetchError || !candidate) return { error: fetchError?.message || 'Fiche introuvable.' };

  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const supplierPrice = Number(formData.get('supplierPrice') || 0);
  const retailPrice = Number(formData.get('retailPrice') || 0);
  const availability = String(formData.get('availability') || 'TO_CONFIRM');
  const sizes = String(formData.get('sizes') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const colors = String(formData.get('colors') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const splitRequired = formData.get('splitRequired') === 'on';
  const visualReviewPassed = formData.get('visualReviewPassed') === 'on';

  const sourcePayload = {
    ...(candidate.source_payload as Record<string, any>),
    title,
    category,
    supplierPrice,
    availability,
    sizes,
    colors,
    splitRequired,
    visualReviewPassed,
    pricing: {
      ...((candidate.source_payload as any)?.pricing || {}),
      recommendedRetailPrice: retailPrice,
    },
  };

  const blockingReasons: string[] = [];
  if (!supplierPrice) blockingReasons.push('Coût fournisseur manquant');
  if (!retailPrice) blockingReasons.push('Prix KAKOS manquant');
  if (!candidate.media_count) blockingReasons.push('Photo produit manquante');
  if (!visualReviewPassed) blockingReasons.push('Validation visuelle requise : retirer fournisseurs, numéros, affiches et modèles inadaptés');
  if (splitRequired) blockingReasons.push('Séparer les modèles en fiches individuelles');
  if (availability !== 'AVAILABLE') blockingReasons.push('Disponibilité fournisseur à confirmer');
  if (sizes.length === 0) blockingReasons.push('Tailles à renseigner');
  if (colors.length === 0) blockingReasons.push('Couleurs à renseigner');

  const { error } = await supabase.from('catalog_candidates').update({
    title,
    category,
    supplier_price: supplierPrice || null,
    recommended_retail_price: retailPrice || null,
    availability,
    split_required: splitRequired,
    blocking_reasons: blockingReasons,
    source_payload: sourcePayload,
    review_status: 'REVIEW_REQUIRED',
    publish_requested: false,
    reviewed_at: null,
  }).eq('id', candidateId);

  if (error) return { error: error.message };
  revalidatePath('/admin/catalogue-import');
  revalidatePath(`/admin/catalogue-import/${candidateId}`);
  return { success: true };
}
