'use client';

export type AnalyticsEventName =
  | 'page_view'
  | 'engagement'
  | 'product_view'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'order_created'
  | 'whatsapp_click';

type AnalyticsPayload = {
  event: AnalyticsEventName;
  path?: string;
  productId?: string;
  categorySlug?: string;
  searchQuery?: string;
  value?: number;
  activeSeconds?: number;
  properties?: Record<string, string | number | boolean | null>;
};

const VISITOR_KEY = 'kakos_analytics_visitor';
const SESSION_KEY = 'kakos_analytics_session';
const SESSION_TOUCH_KEY = 'kakos_analytics_session_touch';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function safeStorage(kind: 'local' | 'session') {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function validUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function getIdentity() {
  const local = safeStorage('local');
  const session = safeStorage('session');
  let visitorId = local?.getItem(VISITOR_KEY) ?? null;
  if (!validUuid(visitorId)) {
    visitorId = crypto.randomUUID();
    local?.setItem(VISITOR_KEY, visitorId);
  }

  const lastTouch = Number(session?.getItem(SESSION_TOUCH_KEY) || 0);
  let sessionId = session?.getItem(SESSION_KEY) ?? null;
  if (!validUuid(sessionId) || Date.now() - lastTouch > SESSION_TIMEOUT_MS) {
    sessionId = crypto.randomUUID();
    session?.setItem(SESSION_KEY, sessionId);
  }
  session?.setItem(SESSION_TOUCH_KEY, String(Date.now()));
  return { visitorId, sessionId };
}

function acquisition() {
  const params = new URLSearchParams(window.location.search);
  return {
    referrer: document.referrer || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmContent: params.get('utm_content'),
    utmTerm: params.get('utm_term'),
  };
}

export function trackAnalyticsEvent(payload: AnalyticsPayload, useBeacon = false) {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/admin')) return;
  const identity = getIdentity();
  const body = JSON.stringify({
    ...identity,
    ...acquisition(),
    ...payload,
    path: (payload.path || `${window.location.pathname}${window.location.search}`).slice(0, 500),
    language: navigator.language,
    screenWidth: window.innerWidth,
  });

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Analytics must never block shopping.
  });
}
