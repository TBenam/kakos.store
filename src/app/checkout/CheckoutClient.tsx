'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/context/CartContext';
import { createOrder } from './actions';
import { trackAnalyticsEvent } from '@/lib/analytics';

interface DeliveryZone {
  id: string;
  name: string;
  price: string;
}

interface CheckoutClientProps {
  zones: DeliveryZone[];
}

export default function CheckoutClient({ zones }: CheckoutClientProps) {
  const { items: cartItems, cartSubtotal: cartContextSubtotal, clearCart } = useCart();
  const router = useRouter();

  const [isDirectMode, setIsDirectMode] = useState(false);
  const [directItem, setDirectItem] = useState<CartItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Redirect if cart is empty or direct mode has no item
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'direct') {
      setIsDirectMode(true);
      const stored = sessionStorage.getItem('kakos_direct_item');
      if (stored) {
        setDirectItem(JSON.parse(stored));
      } else {
        router.push('/');
      }
    } else {
      if (cartItems.length === 0) {
        router.push('/');
      }
    }
    setIsInitialized(true);
  }, [cartItems.length, router]);

  const items = isDirectMode ? (directItem ? [directItem] : []) : cartItems;
  const cartSubtotal = isDirectMode ? (directItem ? Number(directItem.price) : 0) : cartContextSubtotal;

  // Form states
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressPrecision, setAddressPrecision] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('vendeur') || params.get('ref') || localStorage.getItem('kakos_affiliate_code');
    if (referralCode) {
      const normalized = referralCode.trim().toUpperCase();
      setAffiliateCode(normalized);
      localStorage.setItem('kakos_affiliate_code', normalized);
    }
  }, []);

  // Find selected zone fee & free shipping threshold calculation
  const isFreeShipping = cartSubtotal >= 20000;
  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const rawDeliveryFee = selectedZone ? Number(selectedZone.price) : 0;
  const deliveryFee = isFreeShipping ? 0 : rawDeliveryFee;
  const totalPrice = cartSubtotal + deliveryFee;

  useEffect(() => {
    if (!isInitialized || items.length === 0) return;
    trackAnalyticsEvent({
      event: 'begin_checkout',
      value: cartSubtotal,
      properties: {
        mode: isDirectMode ? 'direct' : 'cart',
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  }, [isInitialized, isDirectMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    if (!selectedZoneId) {
      setErrorMessage('Veuillez sélectionner une zone de livraison.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const orderItems = items.map((item) => ({
      variant_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const res = await createOrder({
        firstName,
        phone,
        city: selectedZone ? selectedZone.name.split(' ')[0] : city, // Extracts name from zone like "Douala"
        neighborhood,
        addressPrecision,
        deliveryZoneId: selectedZoneId,
        affiliateCode,
        items: orderItems,
      });

      if (res.success && res.tracking_number && res.whatsapp_url) {
        items.forEach((item) => trackAnalyticsEvent({
          event: 'order_created',
          productId: item.productId,
          value: Number(item.price) * item.quantity,
          properties: { quantity: item.quantity, affiliate: Boolean(affiliateCode), slug: item.slug },
        }));
        if (isDirectMode) {
          sessionStorage.removeItem('kakos_direct_item');
        } else {
          clearCart();
        }
        // Redirect to success page
        router.push(
          `/checkout/success?tracking_number=${res.tracking_number}&whatsapp_url=${encodeURIComponent(
            res.whatsapp_url
          )}&total=${totalPrice}`
        );
      } else {
        setErrorMessage(res.error || 'Erreur lors de la validation de la commande.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur de connexion est survenue.');
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || items.length === 0) return null;

  return (
    <div className="flex-grow w-full max-w-[560px] mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tighter text-primary font-black">Checkout</h1>
        <p className="font-body-md text-xs sm:text-sm text-secondary mt-1">
          Commandez en 1 minute. Aucun compte requis. Paiement à la livraison.
        </p>
      </div>

      {errorMessage && (
        <div className="border border-error bg-error-container text-on-error-container p-3 text-xs font-bold rounded">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 3 Steps / Fields Quick Order Section */}
        <section className="flex flex-col gap-4 bg-surface-container-low p-4 sm:p-5 border border-outline-variant rounded-lg shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              Informations du Client (3 étapes)
            </h2>
            <span className="font-mono text-[10px] bg-accent text-primary px-2 py-0.5 font-black uppercase rounded">
              Ultra Rapide ⚡
            </span>
          </div>
          
          {/* Field 1: Nom */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase font-bold text-primary flex items-center gap-1.5" htmlFor="firstName">
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-mono font-bold">1</span>
              Nom Complet *
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="w-full bg-surface border border-outline-variant p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-lg font-medium"
            />
          </div>

          {/* Field 2: Téléphone */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase font-bold text-primary flex items-center gap-1.5" htmlFor="phone">
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-mono font-bold">2</span>
              Numéro de Téléphone *
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 690000000"
              className="w-full bg-surface border border-outline-variant p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-lg font-medium"
            />
          </div>

          {/* Field 3: Ville & Quartier */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase font-bold text-primary flex items-center gap-1.5" htmlFor="zone">
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-mono font-bold">3</span>
              Ville & Quartier de Livraison *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <select
                  id="zone"
                  required
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-3 text-sm focus:border-primary transition-colors appearance-none rounded-lg cursor-pointer pr-8 font-medium"
                >
                  <option value="" disabled>Sélectionner Ville/Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} (+{Number(zone.price).toLocaleString('fr-FR')} FCFA)
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" data-icon="expand_more">
                  expand_more
                </span>
              </div>

              <input
                type="text"
                id="neighborhood"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Quartier (Ex: Akwa, Bastos...)"
                className="w-full bg-surface border border-outline-variant p-3 text-sm focus:border-primary transition-colors rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-outline-variant">
            <label className="font-label-sm text-[11px] uppercase font-bold text-primary" htmlFor="affiliateCode">
              Code vendeur <span className="text-secondary normal-case font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              id="affiliateCode"
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
              placeholder="Ex: MARIE01"
              maxLength={24}
              className="w-full bg-surface border border-outline-variant p-3 text-sm uppercase focus:border-primary rounded-lg font-mono font-bold"
            />
            <p className="text-[10px] text-secondary">Permet d’attribuer la vente au vendeur qui vous a conseillé.</p>
          </div>
        </section>


        {/* Order Summary Section */}
        <section className="flex flex-col gap-3 bg-surface-container-low p-4 sm:p-5 border border-outline-variant rounded-lg">
          <h2 className="font-label-sm text-[10px] uppercase font-bold text-primary border-b border-outline-variant pb-1">
            Résumé de la Commande
          </h2>
          <div className="flex justify-between items-center font-body-md text-xs sm:text-sm text-secondary">
            <span>Sous-total ({items.reduce((acc, item) => acc + item.quantity, 0)} articles)</span>
            <span className="font-bold text-primary">{cartSubtotal.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center font-body-md text-xs sm:text-sm text-secondary">
            <span>Frais de livraison</span>
            <span>
              {isFreeShipping ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">OFFERT (0 FCFA)</span>
              ) : selectedZoneId ? (
                `${deliveryFee.toLocaleString('fr-FR')} FCFA`
              ) : (
                'Calculé à la sélection'
              )}
            </span>
          </div>
          <div className="flex justify-between items-center font-display text-base sm:text-lg text-primary border-t border-outline-variant pt-2 mt-1 font-bold">
            <span>TOTAL À PAYER</span>
            <span className="text-accent bg-primary px-3 py-1 border border-primary rounded-lg font-black tracking-tight">
              {totalPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </section>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-display text-sm sm:text-base uppercase font-black py-4 px-6 flex justify-center items-center gap-2 active:scale-95 transition-all rounded-lg shadow-brutalist hover:shadow-brutalist-hover ${
              isSubmitting
                ? 'bg-surface-container-high text-outline cursor-not-allowed shadow-none'
                : 'bg-accent text-primary hover:bg-surface-container-high cursor-pointer'
            }`}
          >
            {isSubmitting ? 'VALIDATION EN COURS...' : 'CONFIRMER LA COMMANDE'}
            {!isSubmitting && (
              <span className="material-symbols-outlined font-black" data-icon="arrow_forward">
                arrow_forward
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
