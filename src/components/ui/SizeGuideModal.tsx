'use client';

import React, { useState } from 'react';
import { X, Ruler, Sparkles, CheckCircle2 } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  categoryName = 'T-shirts',
}: SizeGuideModalProps) {
  const isPantsOrJeans =
    categoryName.toLowerCase().includes('jean') ||
    categoryName.toLowerCase().includes('pantalon') ||
    categoryName.toLowerCase().includes('culotte') ||
    categoryName.toLowerCase().includes('short') ||
    categoryName.toLowerCase().includes('salopette');

  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms'>(
    isPantsOrJeans ? 'bottoms' : 'tops'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest border-2 border-primary rounded-lg shadow-brutalist p-5 sm:p-7 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary text-accent rounded">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <span className="font-label-sm text-[10px] uppercase font-black tracking-widest text-outline">
                KAKOS MENSWEAR
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-primary">
                Guide des Tailles
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tops')}
            className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-all ${
              activeTab === 'tops'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            👕 Hauts & Ensembles (M à XXL)
          </button>
          <button
            onClick={() => setActiveTab('bottoms')}
            className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-all ${
              activeTab === 'bottoms'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            👖 Jeans & Pantalons (30 à 38)
          </button>
        </div>

        {/* Table Tops */}
        {activeTab === 'tops' && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto border border-outline-variant rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high border-b border-outline-variant text-[11px] font-bold uppercase text-primary">
                  <tr>
                    <th className="p-3">Taille</th>
                    <th className="p-3">Tour de Poitrine</th>
                    <th className="p-3">Largeur Épaules</th>
                    <th className="p-3">Longueur Vêtement</th>
                    <th className="p-3">Taille Recommandée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-body-md">
                  <tr className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">M</td>
                    <td className="p-3 text-secondary">96 - 102 cm</td>
                    <td className="p-3 text-secondary">46 - 48 cm</td>
                    <td className="p-3 text-secondary">70 cm</td>
                    <td className="p-3 text-primary font-semibold">1m65 - 1m75 (60-72 kg)</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low bg-surface-container-lowest">
                    <td className="p-3 font-bold text-primary">L</td>
                    <td className="p-3 text-secondary">102 - 108 cm</td>
                    <td className="p-3 text-secondary">48 - 50 cm</td>
                    <td className="p-3 text-secondary">72 cm</td>
                    <td className="p-3 text-primary font-semibold">1m75 - 1m83 (73-84 kg)</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">XL</td>
                    <td className="p-3 text-secondary">108 - 114 cm</td>
                    <td className="p-3 text-secondary">50 - 52 cm</td>
                    <td className="p-3 text-secondary">74 cm</td>
                    <td className="p-3 text-primary font-semibold">1m80 - 1m90 (85-95 kg)</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low bg-surface-container-lowest">
                    <td className="p-3 font-bold text-primary">XXL</td>
                    <td className="p-3 text-secondary">114 - 122 cm</td>
                    <td className="p-3 text-secondary">52 - 54 cm</td>
                    <td className="p-3 text-secondary">76 cm</td>
                    <td className="p-3 text-primary font-semibold">1m85+ (95 kg+)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg flex items-start gap-2 text-xs text-secondary">
              <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-primary">Conseil Coupe Streetwear :</strong> Nos pièces ont généralement une coupe confortable et légèrement décontractée. Si vous préférez un tombé ajusté près du corps, privilégiez votre taille habituelle. Pour un style <em>Boxy / Oversize</em> très tendance, prenez une taille au-dessus.
              </p>
            </div>
          </div>
        )}

        {/* Table Bottoms */}
        {activeTab === 'bottoms' && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto border border-outline-variant rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high border-b border-outline-variant text-[11px] font-bold uppercase text-primary">
                  <tr>
                    <th className="p-3">Taille US</th>
                    <th className="p-3">Équivalence FR</th>
                    <th className="p-3">Tour de Taille</th>
                    <th className="p-3">Tour de Bassin</th>
                    <th className="p-3">Longueur Entrejambe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-body-md">
                  <tr className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">30</td>
                    <td className="p-3 text-secondary">38 FR</td>
                    <td className="p-3 text-secondary">76 - 79 cm</td>
                    <td className="p-3 text-secondary">92 - 95 cm</td>
                    <td className="p-3 text-primary font-semibold">102 cm</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low bg-surface-container-lowest">
                    <td className="p-3 font-bold text-primary">32</td>
                    <td className="p-3 text-secondary">40 - 42 FR</td>
                    <td className="p-3 text-secondary">80 - 84 cm</td>
                    <td className="p-3 text-secondary">96 - 100 cm</td>
                    <td className="p-3 text-primary font-semibold">104 cm</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">34</td>
                    <td className="p-3 text-secondary">44 FR</td>
                    <td className="p-3 text-secondary">85 - 89 cm</td>
                    <td className="p-3 text-secondary">101 - 105 cm</td>
                    <td className="p-3 text-primary font-semibold">106 cm</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low bg-surface-container-lowest">
                    <td className="p-3 font-bold text-primary">36</td>
                    <td className="p-3 text-secondary">46 FR</td>
                    <td className="p-3 text-secondary">90 - 95 cm</td>
                    <td className="p-3 text-secondary">106 - 110 cm</td>
                    <td className="p-3 text-primary font-semibold">108 cm</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">38</td>
                    <td className="p-3 text-secondary">48 FR</td>
                    <td className="p-3 text-secondary">96 - 102 cm</td>
                    <td className="p-3 text-secondary">111 - 116 cm</td>
                    <td className="p-3 text-primary font-semibold">109 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg flex items-start gap-2 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-primary">Besoin d&apos;assistance ?</strong> Notre équipe peut vous orienter en direct sur WhatsApp avant expédition pour s&apos;assurer que la coupe tombe parfaitement selon votre morphologie.
              </p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-outline-variant pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-brutalist hover:shadow-brutalist-hover transition-all"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
}
