'use client';

import { useState, useTransition } from 'react';
import { loginAction } from '../actions';

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#fbf9f9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl font-bold text-black tracking-tighter uppercase">KAKOS</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#444748] mt-2">
            Admin Console
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e3e2e2] p-8 shadow-[4px_4px_0px_0px_#0A0A0A]">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black mb-6">Connexion</h2>

          <form action={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-black mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border border-[#c4c7c7] bg-transparent px-3 py-2.5 text-sm text-black focus:border-black focus:outline-none transition-colors placeholder:text-[#747878]"
                placeholder="admin@kakos.store"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-widest text-black mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full border border-[#c4c7c7] bg-transparent px-3 py-2.5 text-sm text-black focus:border-black focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 px-3 py-2 text-xs text-red-800 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-black text-white text-[11px] font-bold uppercase tracking-widest py-3 hover:bg-[#00F0FF] hover:text-black transition-all duration-200 shadow-[4px_4px_0px_0px_#00F0FF] hover:shadow-[2px_2px_0px_0px_#0A0A0A] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#747878] mt-6 uppercase tracking-wider">
          KAKOS MENSWEAR · Accès réservé
        </p>
      </div>
    </div>
  );
}
