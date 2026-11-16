'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { CartProvider } from '@/context/CartContext';
import { SizingProvider } from '@/context/SizingContext';

import CartDrawer from '@/components/ui/CartDrawer';
import type { StoreCategory } from '@/components/ui/Header';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';

export default function StorefrontLayoutWrapper({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: StoreCategory[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <SizingProvider>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <AnnouncementBar />
        <Header categories={categories} />
        <div className="flex-grow w-full flex flex-col">{children}</div>
        <Footer />
        <CartDrawer />
      </SizingProvider>
    </CartProvider>
  );
}
