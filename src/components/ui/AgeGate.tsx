'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'kakos-adult-access-confirmed';

export default function AgeGate() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(window.sessionStorage.getItem(STORAGE_KEY) === 'yes');
    setReady(true);
  }, []);

  if (!ready || allowed) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/95 px-5 text-white backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="w-full max-w-md border border-red-800/70 bg-gradient-to-b from-[#1a0708] to-[#080505] p-7 shadow-[0_24px_80px_rgba(127,29,29,0.35)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-500">KAKOS · Intimité 18+</p>
        <h1 id="age-gate-title" className="mt-3 font-display text-4xl font-black uppercase leading-none">Espace réservé aux adultes</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-300">Cette section présente des produits de bien-être intime. En continuant, vous confirmez avoir au moins 18 ans.</p>
        <button
          type="button"
          onClick={() => { window.sessionStorage.setItem(STORAGE_KEY, 'yes'); setAllowed(true); }}
          className="mt-6 w-full bg-red-600 px-5 py-4 text-sm font-black uppercase text-white transition-colors hover:bg-red-500"
        >
          Je certifie être une personne majeure
        </button>
        <Link href="/" className="mt-3 block w-full border border-red-950 bg-black px-5 py-4 text-center text-sm font-bold uppercase transition-colors hover:border-red-700">Quitter cette section</Link>
        <p className="mt-4 text-center text-[11px] text-gray-500">Navigation discrète · Livraison dans un emballage neutre</p>
      </div>
    </div>
  );
}
