'use client';

import React, { useState, useEffect } from 'react';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Show popup 2 minutes (120000ms) after navigation if not dismissed
    const hasSeenPopup = sessionStorage.getItem('kakos_seen_promo');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 120000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('kakos_seen_promo', 'true');
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && phone.trim()) {
      setIsSubscribed(true);
      sessionStorage.setItem('kakos_seen_promo', 'true');
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black bg-opacity-60 animate-fade-in">
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-background border-2 border-primary shadow-brutalist rounded-lg flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-sm right-sm z-10 bg-white text-primary border border-primary hover:bg-accent transition-colors p-1 active:scale-95"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="close">close</span>
        </button>

        {/* Left: Editorial Image representing Cameroonian urban model */}
        <div className="w-full md:w-1/2 min-h-[220px] md:min-h-full relative bg-surface-container-low">
          <img
            src="/vip_club.jpg"
            alt="Club KAKOS Drops"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-1/2 p-lg flex flex-col justify-center gap-md">
          {!isSubscribed ? (
            <>
              <div>
                <span className="font-label-sm text-[10px] uppercase font-bold text-accent bg-primary px-sm py-xs tracking-wider border border-primary">
                  ACCÈS PRIVÉ
                </span>
                <h2 className="font-display text-headline-md font-bold tracking-tight text-primary mt-sm">
                  REJOINDRE LE CLUB KAKOS
                </h2>
                <p className="font-body-md text-xs text-secondary mt-xs leading-normal">
                  Inscrivez-vous pour recevoir en priorité les alertes de nouveaux drops exclusifs et promotions par WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full bg-transparent border border-outline-variant p-sm text-xs focus:border-primary transition-colors rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-sm text-[10px] uppercase font-bold text-primary">
                    WhatsApp / Téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237..."
                    className="w-full bg-transparent border border-outline-variant p-sm text-xs focus:border-primary transition-colors rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-accent text-primary font-label-sm text-xs uppercase font-bold py-sm px-md flex justify-center items-center gap-xs rounded-lg shadow-brutalist hover:shadow-brutalist-hover hover:bg-primary hover:text-white active:scale-95 transition-all mt-xs cursor-pointer"
                >
                  S'INSCRIRE AUX DROPS
                  <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">
                    chevron_right
                  </span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-sm py-lg">
              <span className="material-symbols-outlined text-[48px] text-accent fill" data-icon="check_circle">
                check_circle
              </span>
              <h3 className="font-display text-headline-md text-primary">BIENVENUE DANS LE CLUB !</h3>
              <p className="font-body-md text-xs text-secondary">
                Merci {firstName}, vous recevrez nos alertes de drops directement sur WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
