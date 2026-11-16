'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/actions';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: 'monitoring' },
  { href: '/admin/orders', label: 'Commandes', icon: 'shopping_cart' },
  { href: '/admin/products', label: 'Produits', icon: 'inventory_2' },
  { href: '/admin/catalogue-import', label: 'Import catalogue', icon: 'upload_file' },
  { href: '/admin/affiliates', label: 'Affiliés', icon: 'groups' },
  { href: '/admin/delivery', label: 'Livraison', icon: 'local_shipping' },
  { href: '/admin/campaigns', label: 'Campagnes', icon: 'campaign' },
  { href: '/admin/settings', label: 'Paramètres', icon: 'settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // Get current section name for the mobile top bar
  const currentItem = navItems.find((item) => isActive(item.href, item.exact));
  const currentPageTitle = currentItem ? currentItem.label : 'Console';

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP BAR (Fixed on Mobile, hidden on Desktop)                    */}
      {/* ========================================================================= */}
      <header className="md:hidden flex justify-between items-center px-4 h-14 bg-white border-b border-[#e3e2e2] fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-black tracking-tighter uppercase">KAKOS</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black text-[#00F0FF]">
            {currentPageTitle}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex items-center justify-center w-10 h-10 border border-[#e3e2e2] bg-[#fbf9f9] text-black active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[24px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE SLIDE-OVER DRAWER & BACKDROP                                    */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        >
          <style>{`
            @keyframes slideInFromLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          <div
            className="w-4/5 max-w-xs h-full bg-white flex flex-col shadow-2xl p-5 overflow-y-auto"
            style={{ animation: 'slideInFromLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e3e2e2] mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-black tracking-tighter uppercase">KAKOS</h2>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#444748]">Admin Console</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-[#e3e2e2] text-black hover:bg-black hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 flex flex-col gap-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#747878] px-3 mb-1">Navigation</p>
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? 'bg-black text-white border-l-4 border-[#00F0FF] shadow-sm'
                        : 'text-black hover:bg-[#f5f3f3]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${active ? 'text-[#00F0FF]' : 'text-[#444748]'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Link to Storefront */}
            <div className="mt-6 pt-4 border-t border-[#e3e2e2] flex flex-col gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black border border-[#e3e2e2] hover:border-black transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  Voir le site public
                </span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </Link>

              {/* Logout Button */}
              <form action={logoutAction} className="mt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Quick Access on Mobile)                   */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e3e2e2] z-40 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
            isActive('/admin', true) ? 'text-black font-bold' : 'text-[#747878] hover:text-black'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive('/admin', true) ? 'text-black' : 'text-[#747878]'}`}>
            dashboard
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Accueil</span>
        </Link>

        <Link
          href="/admin/orders"
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
            isActive('/admin/orders') ? 'text-black font-bold' : 'text-[#747878] hover:text-black'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive('/admin/orders') ? 'text-black' : 'text-[#747878]'}`}>
            shopping_cart
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Commandes</span>
        </Link>

        <Link
          href="/admin/products"
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
            isActive('/admin/products') ? 'text-black font-bold' : 'text-[#747878] hover:text-black'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive('/admin/products') ? 'text-black' : 'text-[#747878]'}`}>
            inventory_2
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Produits</span>
        </Link>

        <Link
          href="/admin/delivery"
          className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
            isActive('/admin/delivery') ? 'text-black font-bold' : 'text-[#747878] hover:text-black'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${isActive('/admin/delivery') ? 'text-black' : 'text-[#747878]'}`}>
            local_shipping
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Livraison</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[#747878] hover:text-black transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">
            menu
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Menu</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 4. DESKTOP SIDEBAR (Permanent left sidebar on Desktop)                    */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 py-6 bg-white border-r border-[#e3e2e2] z-40">
        <div className="px-5 mb-8">
          <Link href="/admin" className="block">
            <h1 className="font-display text-2xl font-bold text-black tracking-tighter uppercase">KAKOS</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#444748] mt-0.5">Admin Console</p>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-150 ${
                  active
                    ? 'bg-black text-white border-l-4 border-[#00F0FF]'
                    : 'text-[#444748] hover:bg-[#f5f3f3] hover:text-black'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-[#00F0FF]' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pt-4 border-t border-[#e3e2e2] flex flex-col gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#444748] hover:text-black hover:bg-[#f5f3f3] transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              Boutique en ligne
            </span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#ba1a1a] hover:bg-red-50 transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
