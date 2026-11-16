'use client';

import { usePathname } from 'next/navigation';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import NewsletterPopup from '@/components/ui/NewsletterPopup';
import LivePurchasePopup from '@/components/ui/LivePurchasePopup';
import { CartProvider } from '@/context/CartContext';
import { SizingProvider } from '@/context/SizingContext';

import CartDrawer from '@/components/ui/CartDrawer';
import type { StoreCategory } from '@/components/ui/Header';

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
        <AnnouncementBar />
        <Header categories={categories} />
        <div className="flex-grow w-full flex flex-col">{children}</div>
        <Footer />
        <NewsletterPopup />
        <LivePurchasePopup />
        <CartDrawer />
      </SizingProvider>
    </CartProvider>
  );
}
