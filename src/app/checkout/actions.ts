'use server';

import { query } from '@/lib/db';

interface OrderResponse {
  success: boolean;
  order_id?: string;
  tracking_number?: string;
  whatsapp_url?: string;
  error?: string;
}

interface CartItemInput {
  variant_id: string;
  quantity: number;
}

export async function createOrder(formData: {
  firstName: string;
  phone: string;
  city: string;
  neighborhood: string;
  addressPrecision?: string;
  deliveryZoneId: string;
  items: CartItemInput[];
}): Promise<OrderResponse> {
  try {
    // 1. Inputs validation
    if (
      !formData.firstName ||
      !formData.phone ||
      !formData.city ||
      !formData.neighborhood ||
      !formData.deliveryZoneId ||
      !formData.items ||
      formData.items.length === 0
    ) {
      return { success: false, error: 'Informations de livraison manquantes ou panier vide.' };
    }

    // 2. Call the atomic PostgreSQL RPC function create_cod_order
    const rpcRes = await query(
      `SELECT * FROM public.create_cod_order($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        formData.firstName,
        formData.phone,
        formData.city,
        formData.neighborhood,
        formData.addressPrecision || '',
        formData.deliveryZoneId,
        JSON.stringify(formData.items),
      ]
    );

    if (rpcRes.rows.length === 0) {
      return { success: false, error: 'Une erreur inconnue est survenue lors de la création.' };
    }

    const orderData = rpcRes.rows[0];
    const orderId = orderData.order_id;
    const trackingNumber = orderData.tracking_number;
    const subtotalPrice = Number(orderData.subtotal_price);
    const deliveryPrice = Number(orderData.delivery_price);
    const totalPrice = Number(orderData.total_price);

    // 3. Query the ordered items for formatting the WhatsApp message
    const itemsRes = await query<{ quantity: number; unit_price: string; size: string; color: string; title: string }>(
      `SELECT 
        oi.quantity,
        oi.unit_price,
        pv.size,
        pv.color,
        p.title
      FROM public.order_items oi
      JOIN public.product_variants pv ON oi.product_variant_id = pv.id
      JOIN public.products p ON pv.product_id = p.id
      WHERE oi.order_id = $1`,
      [orderId]
    );

    // 4. Query WhatsApp contact phone number from settings
    let whatsappContact = '237690000000'; // Default Cameroon backup
    const settingsRes = await query(
      `SELECT value FROM public.settings WHERE key = 'store_info' LIMIT 1`
    );

    if (settingsRes.rows.length > 0 && settingsRes.rows[0].value?.whatsapp_contact) {
      whatsappContact = settingsRes.rows[0].value.whatsapp_contact;
    }

    // 5. Format WhatsApp Message
    const waMessage = `Bonjour KAKOS, je vous contacte concernant ma commande #${trackingNumber}.`;

    const waUrl = `https://wa.me/${whatsappContact}?text=${encodeURIComponent(waMessage)}`;

    return {
      success: true,
      order_id: orderId,
      tracking_number: trackingNumber,
      whatsapp_url: waUrl,
    };
  } catch (error: any) {
    console.error('Error during createOrder Server Action:', error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la validation de la commande.',
    };
  }
}
