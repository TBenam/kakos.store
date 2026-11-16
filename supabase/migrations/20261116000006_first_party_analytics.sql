-- First-party analytics for KAKOS.
-- No customer name, phone, address, IP address or form value is stored.

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    session_id UUID PRIMARY KEY,
    visitor_id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    landing_path TEXT NOT NULL DEFAULT '/',
    exit_path TEXT NOT NULL DEFAULT '/',
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    device_type TEXT NOT NULL DEFAULT 'unknown' CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
    browser_language TEXT,
    page_views INTEGER NOT NULL DEFAULT 0 CHECK (page_views >= 0),
    event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
    active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0)
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    event_name TEXT NOT NULL CHECK (event_name IN (
        'page_view', 'engagement', 'product_view', 'search',
        'add_to_cart', 'remove_from_cart', 'begin_checkout',
        'order_created', 'whatsapp_click'
    )),
    path TEXT NOT NULL DEFAULT '/',
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_slug TEXT,
    search_query TEXT,
    value NUMERIC(12, 2),
    properties JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_sessions_started_idx ON public.analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON public.analytics_sessions(visitor_id, started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_source_idx ON public.analytics_sessions(utm_source, started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON public.analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_product_idx ON public.analytics_events(product_id, event_name, created_at DESC);

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admins to read analytics sessions" ON public.analytics_sessions;
CREATE POLICY "Allow admins to read analytics sessions" ON public.analytics_sessions
    FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins to read analytics events" ON public.analytics_events;
CREATE POLICY "Allow admins to read analytics events" ON public.analytics_events
    FOR SELECT TO authenticated USING (public.is_admin());

COMMENT ON TABLE public.analytics_sessions IS 'Anonymous first-party storefront sessions. No direct personal data.';
COMMENT ON TABLE public.analytics_events IS 'Validated storefront behavior and commerce events. No form field values.';
