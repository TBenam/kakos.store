import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const allowedEvents = new Set([
  'page_view', 'engagement', 'product_view', 'search', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'order_created', 'whatsapp_click',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) || null : null;
}

function deviceType(width: number) {
  if (width <= 767) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const userAgent = request.headers.get('user-agent') || '';
    if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(userAgent)) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    const body = await request.json();
    if (!uuid.test(body.sessionId) || !uuid.test(body.visitorId) || !allowedEvents.has(body.event)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const path = text(body.path, 500) || '/';
    const eventName = body.event as string;
    const productId = uuid.test(body.productId || '') ? body.productId : null;
    const activeSeconds = eventName === 'engagement'
      ? Math.min(Math.max(Number(body.activeSeconds) || 0, 0), 60)
      : 0;
    const numericValue = Number.isFinite(Number(body.value))
      ? Math.min(Math.max(Number(body.value), 0), 1_000_000_000)
      : null;
    const serializedProperties = body.properties && typeof body.properties === 'object'
      ? JSON.stringify(body.properties)
      : '{}';
    const properties = serializedProperties.length <= 4000 ? serializedProperties : '{"truncated":true}';

    await query(
      `WITH upserted AS (
        INSERT INTO public.analytics_sessions (
          session_id, visitor_id, landing_path, exit_path, referrer,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          device_type, browser_language, page_views, event_count, active_seconds
        ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          CASE WHEN $12 = 'page_view' THEN 1 ELSE 0 END, 1, $13)
        ON CONFLICT (session_id) DO UPDATE SET
          last_seen_at = NOW(),
          exit_path = EXCLUDED.exit_path,
          page_views = analytics_sessions.page_views + CASE WHEN $12 = 'page_view' THEN 1 ELSE 0 END,
          event_count = analytics_sessions.event_count + 1,
          active_seconds = analytics_sessions.active_seconds + $13
        RETURNING session_id
      )
      INSERT INTO public.analytics_events (
        session_id, visitor_id, event_name, path, product_id,
        category_slug, search_query, value, properties
      )
      SELECT $1, $2, $12, $3, $14, $15, $16, $17, $18::jsonb FROM upserted`,
      [
        body.sessionId,
        body.visitorId,
        path,
        text(body.referrer, 500),
        text(body.utmSource, 120),
        text(body.utmMedium, 120),
        text(body.utmCampaign, 160),
        text(body.utmContent, 160),
        text(body.utmTerm, 160),
        deviceType(Number(body.screenWidth) || 0),
        text(body.language, 20),
        eventName,
        activeSeconds,
        productId,
        text(body.categorySlug, 120),
        text(body.searchQuery, 160),
        numericValue,
        properties,
      ]
    );
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error('Analytics ingestion failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
