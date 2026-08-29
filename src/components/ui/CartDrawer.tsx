'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  ArrowRight, 
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen: propsIsOpen, onClose: propsOnClose }: CartDrawerProps) {
  const { 
    items, 
    cartCount, 
    cartSubtotal, 
    updateQuantity, 
    removeFromCart, 
    isCartOpen, 
    closeCart 
  } = useCart();

  // If props are passed, respect them, otherwise fallback to context state
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isCartOpen;
  const handleClose = propsOnClose || closeCart;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const freeShippingThreshold = 20000;
  const progressPercent = Math.min((cartSubtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={handleClose}
          />

          {/* Slide-out Panel pinned to right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-surface text-on-surface border-l border-outline-variant flex flex-col h-full shadow-2xl z-10"
          >
            {/* 1. Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-lowest flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary text-white rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-primary leading-none">
                    Votre Panier
                  </h2>
                  <span className="text-xs text-secondary font-medium">
                    {cartCount} article{cartCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-primary hover:bg-surface-container-high rounded-lg transition-colors active:scale-95 duration-75"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Gamified Free Shipping Progress Bar */}
            {items.length > 0 && (
              <div className="bg-surface-container-low border-b border-outline-variant px-5 py-3 flex-shrink-0">
                <div className="flex justify-between items-center text-xs font-bold uppercase mb-1.5">
                  {cartSubtotal >= freeShippingThreshold ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      Livraison Gratuite Débloquée ! 🎉
                    </span>
                  ) : (
                    <>
                      <span className="text-secondary flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Livraison offerte dès 20 000 FCFA
                      </span>
                      <span className="text-primary font-black">
                        Plus que {remainingForFreeShipping.toLocaleString('fr-FR')} F CFA
                      </span>
                    </>
                  )}
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      cartSubtotal >= freeShippingThreshold 
                        ? 'bg-emerald-500' 
                        : 'bg-accent'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 3. Items List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 divide-y divide-outline-variant min-h-0">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 gap-4">
                  <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center text-outline">
                    <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold uppercase text-primary">
                      Votre panier est vide
                    </h3>
                    <p className="text-sm text-secondary mt-1 max-w-xs">
                      Parcourez nos collections exclusives et ajoutez vos articles coup de cœur.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 bg-primary text-white font-display text-sm uppercase font-bold py-3.5 px-6 rounded-lg hover:bg-black active:scale-95 transition-all shadow-brutalist"
                  >
                    Découvrir les drops
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={item.imageUrl || '/fallback_product.webp'}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sans font-bold text-sm uppercase text-primary line-clamp-1">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-outline hover:text-red-600 p-1 -mr-1 transition-colors rounded"
                            title="Supprimer"
                            aria-label="Supprimer cet article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variants info */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.size && (
                            <span className="text-[11px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded border border-outline-variant text-on-surface-variant">
                              Taille: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[11px] font-bold uppercase bg-surface-container px-2 py-0.5 rounded border border-outline-variant text-on-surface-variant">
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        <span className="font-display text-base font-bold text-primary">
                          {(item.price * item.quantity).toLocaleString('fr-FR')} F CFA
                        </span>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-surface-container-high transition-colors active:scale-95 text-primary"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1 text-xs font-bold font-sans text-primary min-w-[28px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                            className="p-1.5 hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-30 text-primary"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 4. Footer with Subtotal and Checkout CTA */}
            {items.length > 0 && (
              <div className="border-t border-outline-variant p-5 bg-surface-container-lowest flex flex-col gap-3.5 flex-shrink-0 shadow-lg">
                {/* Subtotal */}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase font-bold text-secondary tracking-wider">
                    Sous-Total
                  </span>
                  <div className="text-right">
                    <span className="font-display text-2xl font-black text-primary">
                      {cartSubtotal.toLocaleString('fr-FR')} F CFA
                    </span>
                    {cartSubtotal >= freeShippingThreshold && (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                        <Truck className="w-3.5 h-3.5" />
                        Livraison offerte
                      </div>
                    )}
                  </div>
                </div>

                {/* COD reassurance banner */}
                <div className="bg-surface-container-low border border-outline-variant rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-secondary">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Paiement en espèces à la livraison (Cash on Delivery).</span>
                </div>

                {/* Checkout CTA */}
                <div className="flex flex-col gap-2">
                  <Link
                    href="/checkout"
                    onClick={handleClose}
                    className="w-full bg-accent text-primary text-center font-display text-base uppercase font-black py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 border-2 border-transparent hover:bg-primary hover:text-accent hover:border-accent shadow-brutalist hover:shadow-brutalist-hover active:scale-[0.98] transition-all duration-150"
                  >
                    <span>Commander</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={handleClose}
                    className="w-full text-center text-xs uppercase font-bold py-2 text-secondary hover:text-primary transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
