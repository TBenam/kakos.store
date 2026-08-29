'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import SearchOverlay from './SearchOverlay';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount, openCart } = useCart();

  const categories = [
    { name: 'T-shirts', slug: 't-shirts' },
    { name: 'Sweats / Hoodies', slug: 'sweats-hoodies' },
    { name: 'Jeans', slug: 'jeans' },
    { name: 'Ensembles', slug: 'ensembles' },
    { name: 'Culottes / Shorts', slug: 'culottes-shorts' },
    { name: 'Vestes / Doudounes', slug: 'vestes-doudounes' },
    { name: 'Pantalons', slug: 'pantalons' },
    { name: 'Salopettes', slug: 'salopettes' },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-surface border-b border-outline-variant h-16 flex justify-between items-center px-container-margin">
        {/* Left: Burger Menu Toggler */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-primary hover:bg-surface-container-high transition-colors -ml-2 rounded-lg active:scale-95 duration-75"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Brand Logo */}
        <Link
          href="/"
          className="select-none flex items-center justify-center h-12"
        >
          <img src="/logo.png" alt="KAKOS Logo" className="h-full w-auto object-contain" />
        </Link>

        {/* Right: Search & Cart Icons */}
        <div className="flex items-center gap-sm -mr-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-primary hover:bg-surface-container-high transition-colors rounded-lg active:scale-95 duration-75"
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={openCart}
            className="p-2 text-primary hover:bg-surface-container-high transition-colors rounded-lg relative active:scale-95 duration-75"
            aria-label="Panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-primary text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border border-primary leading-none shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Slideout Drawer Menu for Categories (Mobile/Desktop sidebar) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-[80vw] max-w-[320px] bg-background border-r border-outline-variant flex flex-col h-full shadow-brutalist animate-slide-in-left z-50">
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-container-margin border-b border-outline-variant h-16">
                <span className="font-display text-headline-md uppercase tracking-tight text-primary">
                  Menu
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-primary hover:bg-surface-container-high transition-colors p-2 -mr-2 rounded-lg active:scale-95 duration-75"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex-grow overflow-y-auto py-md px-container-margin flex flex-col gap-sm">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-display text-body-lg text-primary uppercase font-bold py-sm hover:text-accent transition-colors"
                >
                  Accueil
                </Link>
                <Link
                  href="/collections/sale"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-display text-body-lg text-[#00F0FF] bg-[#0A0A0A] px-sm py-xs uppercase font-bold hover:text-white transition-colors flex items-center gap-xs"
                >
                  🔥 OFFRES / SALE
                </Link>

                <div className="border-t border-outline-variant my-sm" />

                <div className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant mb-xs">
                  Rayons / Catégories
                </div>

                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/collections/${cat.slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-body-md text-body-md text-primary py-xs hover:pl-sm transition-all duration-300 border-l border-transparent hover:border-accent"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="border-t border-outline-variant p-container-margin bg-surface-container-low flex flex-col gap-sm">
                <div className="font-label-sm text-[10px] text-secondary uppercase font-bold">
                  Besoin d'aide ?
                </div>
                <a
                  href="https://wa.me/237690000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white text-center font-label-sm text-label-sm uppercase font-bold py-sm px-md flex items-center justify-center gap-xs hover:brightness-95 active:scale-95 transition-transform"
                >
                  WhatsApp Shop
                </a>
              </div>
            </div>
          </div>
      )}

      {/* Search Overlay Panel */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <style jsx>{`
        .animate-slide-in-left {
          animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
