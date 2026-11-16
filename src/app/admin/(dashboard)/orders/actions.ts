'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Interface types
export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: string;
  title: string;
  color: string;
  size: string;
}

export interface StatusHistory {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  changed_by_email: string | null;
}

export interface InternalNote {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface OrderDetails {
  id: string;
  tracking_number: string;
  customer_name: string;
  customer_phone: string;
  customer_first_name: string;
  city: string;
  neighborhood: string;
  address_precision: string | null;
  delivery_zone_id: string;
  delivery_zone_name: string;
  delivery_price: string;
  subtotal_price: string;
  total_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_person_name: string | null;
  delivery_person_phone: string | null;
  items: OrderItem[];
  history: StatusHistory[];
  notes: InternalNote[];
}

export interface OrderSummary {
  id: string;
  tracking_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  neighborhood: string;
  delivery_zone_name: string;
  total_price: string;
  status: string;
  created_at: string;
  delivery_person_name: string | null;
}

// Fetch orders list with search, pagination, and filters
export async function getOrders(params: {
  status?: string;
  search?: string;
  zoneId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const {
    status = '',
    search = '',
    zoneId = '',
    startDate = '',
    endDate = '',
    page = 1,
    limit = 10,
  } = params;

  const offset = (page - 1) * limit;
  const queryParams: any[] = [];
  let paramCount = 1;

  let whereClause = 'WHERE 1=1';

  if (status && status !== 'ALL') {
    whereClause += ` AND o.status = $${paramCount}`;
    queryParams.push(status);
    paramCount++;
  }

  if (search) {
    whereClause += ` AND (o.tracking_number ILIKE $${paramCount} OR o.customer_name ILIKE $${paramCount} OR o.customer_phone ILIKE $${paramCount})`;
    queryParams.push(`%${search}%`);
    paramCount++;
  }

  if (zoneId) {
    whereClause += ` AND o.delivery_zone_id = $${paramCount}`;
    queryParams.push(zoneId);
    paramCount++;
  }

  if (startDate) {
    whereClause += ` AND o.created_at >= $${paramCount}`;
    queryParams.push(startDate);
    paramCount++;
  }

  if (endDate) {
    whereClause += ` AND o.created_at <= $${paramCount}`;
    queryParams.push(endDate + ' 23:59:59');
    paramCount++;
  }

  try {
    // Get total count
    const countRes = await query(
      `SELECT COUNT(*) as total 
       FROM public.orders o
       LEFT JOIN public.delivery_zones dz ON o.delivery_zone_id = dz.id
       ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

    // Get orders rows
    const selectParams = [...queryParams, limit, offset];
    const ordersRes = await query<OrderSummary>(
      `SELECT 
        o.id,
        o.tracking_number,
        o.customer_name,
        o.customer_phone,
        o.city,
        o.neighborhood,
        dz.name as delivery_zone_name,
        o.total_price,
        o.status,
        o.created_at,
        o.delivery_person_name
       FROM public.orders o
       LEFT JOIN public.delivery_zones dz ON o.delivery_zone_id = dz.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      selectParams
    );

    // Get all delivery zones for filter dropdown
    const zonesRes = await query(
      `SELECT id, name FROM public.delivery_zones ORDER BY name ASC`
    );

    return {
      success: true,
      orders: ordersRes.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      zones: zonesRes.rows,
    };
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    return {
      success: false,
      orders: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      zones: [],
      error: err.message || 'Une erreur est survenue lors de la récupération des commandes.',
    };
  }
}

// Fetch details for a specific order
export async function getOrderDetails(orderId: string): Promise<{ success: boolean; order?: OrderDetails; error?: string }> {
  try {
    const orderRes = await query(
      `SELECT 
        o.*,
        dz.name as delivery_zone_name
       FROM public.orders o
       LEFT JOIN public.delivery_zones dz ON o.delivery_zone_id = dz.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return { success: false, error: 'Commande introuvable.' };
    }

    const orderRow = orderRes.rows[0];

    // Fetch ordered items
    const itemsRes = await query<OrderItem>(
      `SELECT 
        oi.id,
        oi.quantity,
        oi.unit_price,
        p.title,
        pv.color,
        pv.size
       FROM public.order_items oi
       JOIN public.product_variants pv ON oi.product_variant_id = pv.id
       JOIN public.products p ON pv.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Fetch status history
    const historyRes = await query<StatusHistory>(
      `SELECT 
        osh.id,
        osh.status,
        osh.notes,
        osh.created_at,
        ap.email as changed_by_email
       FROM public.order_status_history osh
       LEFT JOIN public.admin_profiles ap ON osh.changed_by = ap.id
       WHERE osh.order_id = $1
       ORDER BY osh.created_at DESC`,
      [orderId]
    );

    // Fetch internal notes
    const notesRes = await query<InternalNote>(
      `SELECT 
        oin.id,
        oin.author,
        oin.content,
        oin.created_at
       FROM public.order_internal_notes oin
       WHERE oin.order_id = $1
       ORDER BY oin.created_at DESC`,
      [orderId]
    );

    const order: OrderDetails = {
      id: orderRow.id,
      tracking_number: orderRow.tracking_number,
      customer_name: orderRow.customer_name,
      customer_phone: orderRow.customer_phone,
      customer_first_name: orderRow.customer_first_name,
      city: orderRow.city,
      neighborhood: orderRow.neighborhood,
      address_precision: orderRow.address_precision,
      delivery_zone_id: orderRow.delivery_zone_id,
      delivery_zone_name: orderRow.delivery_zone_name || 'Inconnue',
      delivery_price: orderRow.delivery_price,
      subtotal_price: orderRow.subtotal_price,
      total_price: orderRow.total_price,
      status: orderRow.status,
      created_at: orderRow.created_at,
      updated_at: orderRow.updated_at,
      delivery_person_name: orderRow.delivery_person_name,
      delivery_person_phone: orderRow.delivery_person_phone,
      items: itemsRes.rows,
      history: historyRes.rows,
      notes: notesRes.rows,
    };

    return { success: true, order };
  } catch (err: any) {
    console.error('Error fetching order details:', err);
    return { success: false, error: err.message || 'Erreur lors de la récupération du détail commande.' };
  }
}

// Transition status and handle inventory replenishment if cancelled/out of stock
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  notes?: string
) {
  try {
    // 1. Get current order details
    const orderRes = await query(
      `SELECT status, tracking_number FROM public.orders WHERE id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return { success: false, error: 'Commande introuvable.' };
    }

    const currentStatus = orderRes.rows[0].status;

    if (currentStatus === newStatus) {
      return { success: true }; // No change
    }

    const cancelStatuses = ['CANCELLED', 'OUT_OF_STOCK'];
    const isCurrentlyCancelled = cancelStatuses.includes(currentStatus);
    const isNewCancelled = cancelStatuses.includes(newStatus);

    // Fetch order items to modify stocks if transitioning cancellation
    const itemsRes = await query(
      `SELECT product_variant_id, quantity FROM public.order_items WHERE order_id = $1`,
      [orderId]
    );

    // 2. Perform atomic updates
    // If transitioning TO cancelled, replenish stocks
    if (!isCurrentlyCancelled && isNewCancelled) {
      for (const item of itemsRes.rows) {
        await query(
          `UPDATE public.product_variants 
           SET stock = stock + $1 
           WHERE id = $2`,
          [item.quantity, item.product_variant_id]
        );
      }
    }
    // If transitioning FROM cancelled back to active, decrement stocks (check availability first)
    else if (isCurrentlyCancelled && !isNewCancelled) {
      // First verify all stocks are sufficient
      for (const item of itemsRes.rows) {
        const stockRes = await query(
          `SELECT stock, size, color, p.title 
           FROM public.product_variants pv
           JOIN public.products p ON pv.product_id = p.id
           WHERE pv.id = $1`,
          [item.product_variant_id]
        );
        if (stockRes.rows.length > 0) {
          const currentStock = stockRes.rows[0].stock;
          if (currentStock < item.quantity) {
            return {
              success: false,
              error: `Stock insuffisant pour réactiver la commande. Produit "${stockRes.rows[0].title}" (${stockRes.rows[0].color} - ${stockRes.rows[0].size}) disponible: ${currentStock}, demandé: ${item.quantity}.`
            };
          }
        }
      }

      // Decrement stocks
      for (const item of itemsRes.rows) {
        await query(
          `UPDATE public.product_variants 
           SET stock = stock - $1 
           WHERE id = $2`,
          [item.quantity, item.product_variant_id]
        );
      }
    }

    // 3. Update order status
    await query(
      `UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, orderId]
    );

    // 4. Log in history (changed_by can be null for now, or optionally linked if auth context exists)
    await query(
      `INSERT INTO public.order_status_history (order_id, status, notes)
       VALUES ($1, $2, $3)`,
      [orderId, newStatus, notes || `Statut mis à jour de ${currentStatus} à ${newStatus}.`]
    );

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');

    return { success: true };
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return { success: false, error: err.message || 'Erreur lors de la mise à jour du statut.' };
  }
}

// Assign delivery person (livreur) to order
export async function assignDeliveryPerson(
  orderId: string,
  name: string,
  phone: string
) {
  try {
    await query(
      `UPDATE public.orders 
       SET delivery_person_name = $1, delivery_person_phone = $2, updated_at = NOW() 
       WHERE id = $3`,
      [name || null, phone || null, orderId]
    );

    // Log the assignment in status history
    const logNote = name 
      ? `Livreur assigné : ${name} (${phone || 'Sans téléphone'}).` 
      : 'Livreur retiré de la commande.';
      
    await query(
      `INSERT INTO public.order_status_history (order_id, status, notes)
       VALUES ($1, (SELECT status FROM public.orders WHERE id = $1), $2)`,
      [orderId, logNote]
    );

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error assigning delivery person:', err);
    return { success: false, error: err.message || "Erreur lors de l'assignation du livreur." };
  }
}

// Add an internal note to the order details screen
export async function addInternalNote(orderId: string, author: string, content: string) {
  if (!content || !content.trim()) {
    return { success: false, error: 'Le contenu de la note ne peut pas être vide.' };
  }

  try {
    await query(
      `INSERT INTO public.order_internal_notes (order_id, author, content)
       VALUES ($1, $2, $3)`,
      [orderId, author || 'Administrateur', content]
    );

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error adding internal note:', err);
    return { success: false, error: err.message || "Erreur lors de la création de la note." };
  }
}

// Get WhatsApp contact info configuration
export async function getStoreSettings() {
  try {
    const res = await query(
      `SELECT value FROM public.settings WHERE key = 'store_info' LIMIT 1`
    );
    if (res.rows.length > 0) {
      return { success: true, settings: res.rows[0].value };
    }
    return { 
      success: true, 
      settings: { 
        name: 'KAKOS MENSWEAR', 
        currency: 'XAF', 
        whatsapp_contact: '237697259094',
        country: 'Cameroun' 
      } 
    };
  } catch (err: any) {
    console.error('Error getting store settings:', err);
    return { success: false, error: err.message || 'Erreur lors du chargement des paramètres.' };
  }
}

// Update the official KAKOS WhatsApp number in settings
export async function updateStoreWhatsApp(newNumber: string) {
  if (!newNumber || !newNumber.trim()) {
    return { success: false, error: 'Le numéro de contact ne peut pas être vide.' };
  }

  const cleanedNumber = newNumber.replace(/\D/g, ''); // Keep only digits

  try {
    // Fetch current settings value
    const res = await query(
      `SELECT value FROM public.settings WHERE key = 'store_info' LIMIT 1`
    );

    let currentValue: any = {
      name: 'KAKOS MENSWEAR',
      currency: 'XAF',
      country: 'Cameroun',
    };

    if (res.rows.length > 0) {
      currentValue = res.rows[0].value;
    }

    currentValue.whatsapp_contact = cleanedNumber;

    // Update settings table
    await query(
      `INSERT INTO public.settings (key, value, updated_at)
       VALUES ('store_info', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE 
       SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(currentValue)]
    );

    revalidatePath('/admin/orders');
    return { success: true, whatsapp_contact: cleanedNumber };
  } catch (err: any) {
    console.error('Error updating store whatsapp contact:', err);
    return { success: false, error: err.message || 'Erreur lors de la mise à jour du numéro WhatsApp.' };
  }
}
