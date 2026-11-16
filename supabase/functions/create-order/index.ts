// Supabase Edge Function: create-order
// Runtime: Deno (TypeScript)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  try {
    // 1. Initialize Supabase client with Service Role Key (bypasses RLS to secure transactions)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const whatsappContact = Deno.env.get('WHATSAPP_CONTACT') ?? '237697259094'; // Default backup whatsapp

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Parse request body
    const body = await req.json()
    const first_name = body.first_name || body.customer_first_name || body.customer_name || body.prenom
    const phone = body.phone || body.customer_phone || body.telephone
    const city = body.city || body.ville
    const neighborhood = body.neighborhood || body.quartier
    const address_precision = body.address_precision || body.address_notes || body.precision_adresse
    const delivery_zone_id = body.delivery_zone_id
    const items = body.items

    if (!first_name || !phone || !city || !neighborhood || !delivery_zone_id || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 3. Call the atomic PostgreSQL RPC function create_cod_order
    const { data: orderData, error: orderError } = await supabase
      .rpc('create_cod_order', {
        p_first_name: first_name,
        p_phone: phone,
        p_city: city,
        p_neighborhood: neighborhood,
        p_address_precision: address_precision,
        p_delivery_zone_id: delivery_zone_id,
        p_items: items
      })

    if (orderError || !orderData || orderData.length === 0) {
      return new Response(JSON.stringify({ error: orderError?.message || "Erreur lors de la création de la commande" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const oData = orderData[0]
    const orderId = oData.order_id
    const trackingNumber = oData.tracking_number
    const subtotalPrice = Number(oData.subtotal_price)
    const deliveryPrice = Number(oData.delivery_price)
    const totalPrice = Number(oData.total_price)

    // 4. Fetch the created order items and delivery zone details for building the WhatsApp message
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        product_variants (
          size,
          color,
          products (
            title
          )
        )
      `)
      .eq('order_id', orderId)

    const { data: zoneData } = await supabase
      .from('delivery_zones')
      .select('name')
      .eq('id', delivery_zone_id)
      .single()

    // 5. Fetch WhatsApp contact phone number from settings
    let whatsappContact = Deno.env.get('WHATSAPP_CONTACT') || '237697259094'
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'store_info')
      .single()

    if (settingsData && (settingsData.value as any)?.whatsapp_contact) {
      whatsappContact = (settingsData.value as any).whatsapp_contact
    }

    // 6. Format WhatsApp Message and Generate URL
    let waMessage = `🔥 *NOUVELLE COMMANDE KAKOS* 🔥\n\n`
    waMessage += `📦 *Référence :* ${trackingNumber}\n`
    waMessage += `👤 *Client :* ${first_name}\n`
    waMessage += `📞 *Téléphone :* ${phone}\n`
    waMessage += `📍 *Ville :* ${city}\n`
    waMessage += `🏘️ *Quartier :* ${neighborhood}\n`
    if (address_precision && address_precision.trim() !== '') {
      waMessage += `📝 *Adresse :* ${address_precision}\n`
    }
    waMessage += `🚚 *Zone de livraison :* ${zoneData?.name || 'Standard'}\n\n`
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`
    waMessage += `*ARTICLES COMMANDEZ :*\n`
    
    if (orderItems && Array.isArray(orderItems)) {
      for (const item of orderItems) {
        const variant = item.product_variants as any
        const product = variant?.products as any
        const title = product?.title || 'Produit sans titre'
        const color = variant?.color || ''
        const size = variant?.size || ''
        waMessage += `- *${item.quantity}x* ${title} (${color} - ${size})\n`
        waMessage += `  _Prix : ${Number(item.unit_price).toLocaleString('fr-FR')} F CFA_\n`
      }
    }
    
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`
    const deliveryDisplay = deliveryPrice === 0 ? 'OFFERT (Gratuit)' : `${deliveryPrice.toLocaleString('fr-FR')} F CFA`
    waMessage += `💵 *Sous-total :* ${subtotalPrice.toLocaleString('fr-FR')} F CFA\n`
    waMessage += `🚚 *Frais de livraison :* ${deliveryDisplay}\n`
    waMessage += `💵 *TOTAL À PAYER :* *${totalPrice.toLocaleString('fr-FR')} F CFA*\n\n`
    waMessage += `Mode de paiement : *Paiement à la livraison (COD)*\n`
    waMessage += `Merci pour votre commande ! L'équipe KAKOS va vous contacter pour confirmation.`

    const waUrl = `https://wa.me/${whatsappContact}?text=${encodeURIComponent(waMessage)}`

    // 7. Success Response
    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      tracking_number: trackingNumber,
      total_price: totalPrice,
      whatsapp_url: waUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
