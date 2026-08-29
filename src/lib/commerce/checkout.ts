import { SupabaseClient } from '@supabase/supabase-js';

export interface CheckoutItem {
  variant_id: string;
  quantity: number;
  // Local info for WhatsApp formatting
  title?: string;
  size?: string;
  color?: string;
  price?: number;
}

export interface CheckoutInput {
  first_name: string;
  phone: string;
  city: string;
  neighborhood: string;
  address_precision?: string;
  delivery_zone_id: string;
  items: CheckoutItem[];
}

export interface CheckoutResponse {
  success: boolean;
  order_id?: string;
  tracking_number?: string;
  total_price?: number;
  whatsapp_url?: string;
  error?: string;
}

/**
 * Validates checkout inputs client-side.
 */
export function validateCheckoutInput(input: CheckoutInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.first_name || input.first_name.trim() === '') {
    errors.first_name = 'Le prénom est requis.';
  }

  if (!input.phone || input.phone.trim() === '') {
    errors.phone = 'Le numéro de téléphone/WhatsApp est requis.';
  }

  if (!input.city || input.city.trim() === '') {
    errors.city = 'La ville est requise.';
  }

  if (!input.neighborhood || input.neighborhood.trim() === '') {
    errors.neighborhood = 'Le quartier est requis.';
  }

  if (!input.delivery_zone_id || input.delivery_zone_id.trim() === '') {
    errors.delivery_zone_id = 'La zone de livraison est requise.';
  }

  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    errors.items = 'Le panier est vide.';
  } else {
    input.items.forEach((item, index) => {
      if (!item.variant_id) {
        errors[`items.${index}.variant_id`] = 'Variante de produit manquante.';
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors[`items.${index}.quantity`] = 'La quantité doit être supérieure à 0.';
      }
    });
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Submits the checkout information directly to the Supabase RPC function.
 * This completely bypasses the need for Deno Edge Functions and CLI deployments.
 * All stock checks and price calculations are executed atomically in the database.
 */
export async function submitCheckout(
  supabaseClient: SupabaseClient,
  input: CheckoutInput
): Promise<CheckoutResponse> {
  const { valid, errors } = validateCheckoutInput(input);
  if (!valid) {
    const errorMsg = Object.values(errors).join(' ');
    return { success: false, error: errorMsg };
  }

  try {
    // 1. Invoke the atomic stored procedure directly via Supabase RPC
    const { data: orderData, error: rpcError } = await supabaseClient.rpc('create_cod_order', {
      p_first_name: input.first_name.trim(),
      p_phone: input.phone.trim(),
      p_city: input.city.trim(),
      p_neighborhood: input.neighborhood.trim(),
      p_address_precision: input.address_precision?.trim() || '',
      p_delivery_zone_id: input.delivery_zone_id,
      p_items: input.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }))
    });

    if (rpcError || !orderData || orderData.length === 0) {
      console.error('RPC Checkout failed:', rpcError);
      return {
        success: false,
        error: rpcError?.message || 'Une erreur est survenue lors de la création de la commande.'
      };
    }

    // RPC returns structure matching: { order_id, tracking_number, subtotal_price, delivery_price, total_price }
    const oData = orderData[0];
    const orderId = oData.order_id;
    const trackingNumber = oData.tracking_number;
    const subtotalPrice = Number(oData.subtotal_price);
    const deliveryPrice = Number(oData.delivery_price);
    const totalPrice = Number(oData.total_price);

    // 2. Fetch the store contact details to format the WhatsApp link
    let whatsappContact = '237690000000'; // Fallback
    try {
      const { data: settingsData } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'store_info')
        .single();

      if (settingsData && (settingsData.value as any)?.whatsapp_contact) {
        whatsappContact = (settingsData.value as any).whatsapp_contact;
      }
    } catch (e) {
      console.warn('Could not load WhatsApp contact settings, using fallback.', e);
    }

    // 3. Construct the WhatsApp message on the client using verified database calculations
    let waMessage = `🔥 *NOUVELLE COMMANDE KAKOS MENSWEAR* 🔥\n\n`;
    waMessage += `📦 *Référence :* ${trackingNumber}\n`;
    waMessage += `👤 *Client :* ${input.first_name.trim()}\n`;
    waMessage += `📞 *Téléphone :* ${input.phone.trim()}\n`;
    waMessage += `📍 *Ville :* ${input.city.trim()}\n`;
    waMessage += `🏘️ *Quartier :* ${input.neighborhood.trim()}\n`;
    if (input.address_precision && input.address_precision.trim() !== '') {
      waMessage += `📝 *Adresse :* ${input.address_precision.trim()}\n`;
    }
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `*ARTICLES COMMANDÉS :*\n`;

    input.items.forEach(item => {
      const title = item.title || 'Article';
      const color = item.color ? ` (${item.color}` : '';
      const size = item.size ? `${color ? ' - ' : ' ('}${item.size})` : color ? ')' : '';
      const displayPrice = item.price ? `\n  _Prix : ${item.price.toLocaleString('fr-FR')} F CFA_` : '';
      waMessage += `- *${item.quantity}x* ${title}${size}${displayPrice}\n`;
    });

    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    const deliveryDisplay = deliveryPrice === 0 ? 'OFFERT (Gratuit)' : `${deliveryPrice.toLocaleString('fr-FR')} F CFA`;
    waMessage += `💵 *Sous-total :* ${subtotalPrice.toLocaleString('fr-FR')} F CFA\n`;
    waMessage += `🚚 *Frais de livraison :* ${deliveryDisplay}\n`;
    waMessage += `💵 *TOTAL À PAYER :* *${totalPrice.toLocaleString('fr-FR')} F CFA*\n\n`;
    waMessage += `Mode de paiement : *Paiement à la livraison (COD)*\n`;
    waMessage += `Merci pour votre commande ! L'équipe KAKOS va vous contacter pour confirmation.`;

    const waUrl = `https://wa.me/${whatsappContact}?text=${encodeURIComponent(waMessage)}`;

    return {
      success: true,
      order_id: orderId,
      tracking_number: trackingNumber,
      total_price: totalPrice,
      whatsapp_url: waUrl
    };
  } catch (err: any) {
    console.error('Unexpected error during checkout:', err);
    return {
      success: false,
      error: err.message || 'Une erreur réseau inattendue s\'est produite.'
    };
  }
}
