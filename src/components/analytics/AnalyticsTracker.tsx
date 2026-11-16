'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPage = useRef('');

  useEffect(() => {
    const query = searchParams.toString();
    const page = `${pathname}${query ? `?${query}` : ''}`;
    if (lastPage.current === page) return;
    lastPage.current = page;
    trackAnalyticsEvent({ event: 'page_view', path: page });
  }, [pathname, searchParams]);

  useEffect(() => {
    let active = !document.hidden;
    const onVisibility = () => { active = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(() => {
      if (active) trackAnalyticsEvent({ event: 'engagement', activeSeconds: 15 });
    }, 15_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest('a[href*="wa.me"], a[href*="whatsapp.com"]') as HTMLAnchorElement | null;
      if (link) trackAnalyticsEvent({ event: 'whatsapp_click', properties: { location: pathname } });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  return null;
}
