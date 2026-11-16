import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ days?: string }> };
type Summary = {
  sessions: string; visitors: string; page_views: string; avg_active_seconds: string;
  bounce_rate: string; converting_sessions: string; conversion_rate: string;
};
type Funnel = { visitors: string; product_views: string; carts: string; checkouts: string; orders: string };

const nf = new Intl.NumberFormat('fr-FR');
const pct = (value: string | number) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
const duration = (seconds: string | number) => {
  const total = Math.round(Number(seconds || 0));
  return total >= 60 ? `${Math.floor(total / 60)} min ${total % 60} s` : `${total} s`;
};

function Bar({ value, max, color = '#00F0FF' }: { value: number; max: number; color?: string }) {
  return <div className="h-2 bg-[#e3e2e2] overflow-hidden"><div className="h-full" style={{ width: `${max ? Math.max(2, value / max * 100) : 0}%`, background: color }} /></div>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  let available = true;
  let summary: Summary = { sessions: '0', visitors: '0', page_views: '0', avg_active_seconds: '0', bounce_rate: '0', converting_sessions: '0', conversion_rate: '0' };
  let funnel: Funnel = { visitors: '0', product_views: '0', carts: '0', checkouts: '0', orders: '0' };
  let daily: Array<{ day: string; sessions: string; views: string; orders: string }> = [];
  let pages: Array<{ path: string; views: string; sessions: string }> = [];
  let sources: Array<{ source: string; sessions: string; orders: string }> = [];
  let products: Array<{ title: string; slug: string; views: string; carts: string; orders: string }> = [];
  let searches: Array<{ search_query: string; searches: string; zero_results: string }> = [];
  let devices: Array<{ device_type: string; sessions: string }> = [];

  try {
    const results = await Promise.all([
      query<Summary>(`SELECT
        COUNT(*)::text AS sessions,
        COUNT(DISTINCT visitor_id)::text AS visitors,
        COALESCE(SUM(page_views), 0)::text AS page_views,
        COALESCE(AVG(active_seconds), 0)::text AS avg_active_seconds,
        COALESCE(100.0 * COUNT(*) FILTER (WHERE page_views = 1) / NULLIF(COUNT(*), 0), 0)::text AS bounce_rate,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.session_id = s.session_id AND e.event_name = 'order_created'))::text AS converting_sessions,
        COALESCE(100.0 * COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.session_id = s.session_id AND e.event_name = 'order_created')) / NULLIF(COUNT(*), 0), 0)::text AS conversion_rate
        FROM analytics_sessions s WHERE started_at >= $1`, [since]),
      query<Funnel>(`SELECT
        COUNT(DISTINCT session_id)::text AS visitors,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'product_view')::text AS product_views,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'add_to_cart')::text AS carts,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'begin_checkout')::text AS checkouts,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'order_created')::text AS orders
        FROM analytics_events WHERE created_at >= $1`, [since]),
      query<{ day: string; sessions: string; views: string; orders: string }>(`SELECT
        TO_CHAR(d.day, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT s.session_id)::text AS sessions,
        COUNT(e.id) FILTER (WHERE e.event_name = 'page_view')::text AS views,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_name = 'order_created')::text AS orders
        FROM GENERATE_SERIES(DATE_TRUNC('day', $1::timestamptz), DATE_TRUNC('day', NOW()), '1 day') d(day)
        LEFT JOIN analytics_sessions s ON s.started_at >= d.day AND s.started_at < d.day + INTERVAL '1 day'
        LEFT JOIN analytics_events e ON e.session_id = s.session_id AND e.created_at >= d.day AND e.created_at < d.day + INTERVAL '1 day'
        GROUP BY d.day ORDER BY d.day`, [since]),
      query<{ path: string; views: string; sessions: string }>(`SELECT path, COUNT(*)::text AS views, COUNT(DISTINCT session_id)::text AS sessions
        FROM analytics_events WHERE event_name = 'page_view' AND created_at >= $1
        GROUP BY path ORDER BY COUNT(*) DESC LIMIT 10`, [since]),
      query<{ source: string; sessions: string; orders: string }>(`SELECT
        CASE WHEN NULLIF(utm_source, '') IS NOT NULL THEN utm_source
             WHEN NULLIF(referrer, '') IS NULL THEN 'Direct / WhatsApp sans UTM'
             ELSE SPLIT_PART(REGEXP_REPLACE(referrer, '^https?://', ''), '/', 1) END AS source,
        COUNT(*)::text AS sessions,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.session_id = s.session_id AND e.event_name = 'order_created'))::text AS orders
        FROM analytics_sessions s WHERE started_at >= $1 GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 10`, [since]),
      query<{ title: string; slug: string; views: string; carts: string; orders: string }>(`SELECT p.title, p.slug,
        COUNT(e.id) FILTER (WHERE e.event_name = 'product_view')::text AS views,
        COUNT(e.id) FILTER (WHERE e.event_name = 'add_to_cart')::text AS carts,
        COUNT(e.id) FILTER (WHERE e.event_name = 'order_created')::text AS orders
        FROM analytics_events e JOIN products p ON p.id = e.product_id
        WHERE e.created_at >= $1 GROUP BY p.id, p.title, p.slug
        ORDER BY COUNT(e.id) FILTER (WHERE e.event_name = 'product_view') DESC LIMIT 10`, [since]),
      query<{ search_query: string; searches: string; zero_results: string }>(`SELECT search_query, COUNT(*)::text AS searches,
        COUNT(*) FILTER (WHERE properties->>'zero_results' = 'true')::text AS zero_results FROM analytics_events
        WHERE event_name = 'search' AND created_at >= $1 AND search_query IS NOT NULL
        GROUP BY search_query ORDER BY COUNT(*) DESC LIMIT 10`, [since]),
      query<{ device_type: string; sessions: string }>(`SELECT device_type, COUNT(*)::text AS sessions FROM analytics_sessions
        WHERE started_at >= $1 GROUP BY device_type ORDER BY COUNT(*) DESC`, [since]),
    ]);
    summary = results[0].rows[0] || summary;
    funnel = results[1].rows[0] || funnel;
    daily = results[2].rows;
    pages = results[3].rows;
    sources = results[4].rows;
    products = results[5].rows;
    searches = results[6].rows;
    devices = results[7].rows;
  } catch (error: any) {
    if (error?.code === '42P01') available = false;
    else throw error;
  }

  const dailyMax = Math.max(1, ...daily.map((d) => Number(d.sessions)));
  const funnelValues = [
    ['Visites', Number(funnel.visitors)],
    ['Produits consultés', Number(funnel.product_views)],
    ['Ajouts au panier', Number(funnel.carts)],
    ['Checkouts', Number(funnel.checkouts)],
    ['Commandes', Number(funnel.orders)],
  ] as const;

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00a8b2]">Croissance & performance</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-black tracking-tighter uppercase">Analytics</h2>
        <p className="text-sm text-[#444748] mt-1">Données anonymes de la boutique — mises à jour en continu</p>
      </div>
      <div className="flex border border-[#e3e2e2] bg-white">
        {[7, 30, 90].map((range) => <Link key={range} href={`/admin/analytics?days=${range}`} className={`px-4 py-2 text-[11px] font-black uppercase ${days === range ? 'bg-black text-[#00F0FF]' : 'text-black hover:bg-[#f5f3f3]'}`}>{range} j</Link>)}
      </div>
    </div>

    {!available && <div className="border-l-4 border-amber-500 bg-amber-50 p-5"><p className="font-bold text-amber-900">La migration Analytics doit encore être appliquée dans Supabase.</p></div>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        ['Visiteurs', summary.visitors, 'person'],
        ['Sessions', summary.sessions, 'monitoring'],
        ['Pages vues', summary.page_views, 'visibility'],
        ['Durée active moy.', duration(summary.avg_active_seconds), 'schedule'],
        ['Taux de rebond', pct(summary.bounce_rate), 'exit_to_app'],
        ['Conversion', pct(summary.conversion_rate), 'shopping_bag'],
        ['Commandes suivies', summary.converting_sessions, 'receipt_long'],
        ['Pages / session', Number(summary.sessions) ? (Number(summary.page_views) / Number(summary.sessions)).toFixed(1) : '0', 'web_traffic'],
      ].map(([label, value, icon], i) => <div key={label} className={`bg-white border border-[#e3e2e2] p-4 min-h-32 flex flex-col justify-between ${i === 0 ? 'border-l-4 border-l-[#00F0FF]' : ''}`}>
        <div className="flex justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">{label}</p><span className="material-symbols-outlined text-[19px] text-[#747878]">{icon}</span></div>
        <p className="font-display text-3xl md:text-4xl font-bold text-black">{typeof value === 'string' && /^\d+$/.test(value) ? nf.format(Number(value)) : value}</p>
      </div>)}
    </div>

    <div className="grid lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 bg-white border border-[#e3e2e2] p-5 shadow-[4px_4px_0_#0A0A0A]">
        <h3 className="font-display text-xl font-black uppercase">Sessions par jour</h3>
        <div className="mt-6 flex items-end gap-1 h-56 overflow-hidden">
          {daily.map((d) => <div key={d.day} className="group flex-1 min-w-[5px] h-full flex flex-col justify-end" title={`${d.day}: ${d.sessions} sessions`}><div className="bg-[#00F0FF] border-t border-black transition-all group-hover:bg-black" style={{ height: `${Math.max(2, Number(d.sessions) / dailyMax * 100)}%` }} /></div>)}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#747878]"><span>{daily[0]?.day || '—'}</span><span>Aujourd’hui</span></div>
      </section>
      <section className="lg:col-span-2 bg-black text-white p-5 shadow-[4px_4px_0_#00F0FF]">
        <h3 className="font-display text-xl font-black uppercase">Entonnoir d’achat</h3>
        <div className="mt-6 space-y-5">{funnelValues.map(([label, value], i) => {
          const rate = i === 0 ? 100 : (funnelValues[0][1] ? value / funnelValues[0][1] * 100 : 0);
          return <div key={label}><div className="flex justify-between text-xs mb-1"><span className="font-bold uppercase">{label}</span><span>{nf.format(value)} · {pct(rate)}</span></div><Bar value={value} max={funnelValues[0][1]} color={i === 4 ? '#dcae45' : '#00F0FF'} /></div>;
        })}</div>
      </section>
    </div>

    <div className="grid xl:grid-cols-2 gap-6">
      <Table title="Pages les plus visitées" headers={['Page', 'Vues', 'Sessions']} rows={pages.map((p) => [p.path, nf.format(Number(p.views)), nf.format(Number(p.sessions))])} />
      <Table title="Sources d’acquisition" headers={['Source', 'Sessions', 'Commandes']} rows={sources.map((s) => [s.source, nf.format(Number(s.sessions)), nf.format(Number(s.orders))])} />
      <Table title="Produits les plus performants" headers={['Produit', 'Vues', 'Paniers', 'Commandes']} rows={products.map((p) => [p.title, nf.format(Number(p.views)), nf.format(Number(p.carts)), nf.format(Number(p.orders))])} />
      <Table title="Recherches clients" headers={['Recherche', 'Nombre', 'Sans résultat']} rows={searches.map((s) => [s.search_query, nf.format(Number(s.searches)), nf.format(Number(s.zero_results))])} />
    </div>

    <section className="bg-white border border-[#e3e2e2] p-5">
      <h3 className="font-display text-xl font-black uppercase">Appareils</h3>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">{devices.map((d) => <div key={d.device_type} className="border border-[#e3e2e2] p-4"><p className="text-[10px] font-bold uppercase text-[#747878]">{d.device_type}</p><p className="text-3xl font-black mt-2">{nf.format(Number(d.sessions))}</p></div>)}</div>
    </section>
  </div>;
}

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return <section className="bg-white border border-[#e3e2e2] shadow-[4px_4px_0_#0A0A0A] overflow-hidden">
    <h3 className="font-display text-lg font-black uppercase p-4 border-b border-[#e3e2e2]">{title}</h3>
    <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f5f3f3]"><tr>{headers.map((h) => <th key={h} className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#444748]">{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={`${row[0]}-${i}`} className="border-t border-[#f5f3f3]">{row.map((cell, j) => <td key={j} className={`px-4 py-3 text-xs ${j === 0 ? 'font-bold text-black max-w-[260px] truncate' : 'text-[#444748]'}`}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="p-8 text-center text-sm text-[#747878]">Les données apparaîtront après les premières visites.</td></tr>}</tbody></table></div>
  </section>;
}
