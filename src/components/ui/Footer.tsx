import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0A] text-white border-t border-[#1C1B1B] py-xl px-container-margin mt-auto">
      <div className="max-w-[512px] mx-auto flex flex-col gap-lg items-center text-center">
        {/* Brand */}
        <div>
          <div className="font-display text-headline-lg font-bold tracking-tighter text-white">
            KAKOS
          </div>
          <p className="font-body-md text-xs text-outline-variant mt-xs max-w-[320px]">
            Streetwear premium pour l'homme urbain contemporain. Conçu pour le Cameroun.
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-md font-label-sm text-xs uppercase tracking-widest text-[#858383]">
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <Link href="/collections/sale" className="hover:text-white transition-colors">
            Soldes
          </Link>
          <a
            href="https://wa.me/237690000000"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00F0FF] transition-colors"
          >
            WhatsApp Support
          </a>
        </nav>

        {/* Payment Policy & Info */}
        <div className="border-t border-[#1C1B1B] w-full pt-md flex flex-col gap-sm">
          <p className="font-body-md text-xs text-outline-variant">
            🚚 <span className="text-white font-bold">Livraison offerte dès 20 000 FCFA</span> — Expédition partout à Douala, Yaoundé, Bafoussam, Garoua, Buea, Kribi.
          </p>
          <p className="font-body-md text-xs text-outline-variant">
            💵 Mode de règlement : <span className="text-white font-bold">Paiement à la livraison (Cash On Delivery - COD)</span>.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-[10px] text-[#474646] uppercase font-label-sm">
          © {new Date().getFullYear()} KAKOS MENSWEAR. TOUS DROITS RÉSERVÉS.
        </div>
      </div>
    </footer>
  );
}
