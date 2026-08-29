'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Shirt, 
  Layers, 
  Flame, 
  Tag
} from 'lucide-react';

interface ProductDescriptionSectionProps {
  description: string | null;
  categoryName: string;
  title: string;
}

export default function ProductDescriptionSection({
  description,
  categoryName,
  title,
}: ProductDescriptionSectionProps) {
  // Accordion open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    details: true,
    care: false,
    shipping: false,
    guarantee: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Determine smart attributes based on category
  const isPantsOrJeans =
    categoryName.toLowerCase().includes('jean') ||
    categoryName.toLowerCase().includes('pantalon');
  const isHoodieOrSweat =
    categoryName.toLowerCase().includes('sweat') ||
    categoryName.toLowerCase().includes('hoodie') ||
    categoryName.toLowerCase().includes('doudoune');
  const isEnsemble = categoryName.toLowerCase().includes('ensemble');

  const fabricBadge = isPantsOrJeans
    ? 'Denim & Coton Résistant'
    : isHoodieOrSweat
    ? 'Molleton Lourd & Douillet'
    : isEnsemble
    ? 'Maille Respirante Confort'
    : 'Coton Peigné Premium';

  const fitBadge = isPantsOrJeans
    ? 'Coupe Regular / Loose'
    : 'Coupe Streetwear Moderne';

  return (
    <div className="flex flex-col gap-6 border-t border-outline-variant pt-6 mt-4">
      {/* 1. KEY HIGHLIGHT BADGES */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/80">
          <div className="p-1.5 bg-primary text-white rounded">
            <Shirt className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Matière</span>
            <span className="text-xs font-bold text-primary leading-tight">{fabricBadge}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/80">
          <div className="p-1.5 bg-primary text-accent rounded">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Coupe</span>
            <span className="text-xs font-bold text-primary leading-tight">{fitBadge}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/80">
          <div className="p-1.5 bg-primary text-white rounded">
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Expédition</span>
            <span className="text-xs font-bold text-primary leading-tight">24h - 48h au Cameroun</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/80">
          <div className="p-1.5 bg-primary text-accent rounded">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Paiement</span>
            <span className="text-xs font-bold text-primary leading-tight">À la Livraison</span>
          </div>
        </div>
      </div>

      {/* 2. DESCRIPTION & INTRO */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-label-sm text-xs uppercase font-black text-primary tracking-wider">
            Présentation du Produit
          </span>
        </div>

        {description ? (
          <div
            className="prose prose-sm max-w-none text-secondary leading-relaxed text-xs sm:text-sm font-sans space-y-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-primary [&_strong]:font-bold [&_em]:text-primary [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Pièce essentielle du vestiaire KAKOS MENSWEAR, alliant design urbain contemporain, tombé structuré et confort maximal pour le quotidien.
          </p>
        )}
      </div>

      {/* 3. STYLE NOTE CALLOUT */}
      <div className="relative overflow-hidden p-3.5 bg-primary text-white rounded-lg border border-primary flex items-start gap-3 shadow-brutalist">
        <div className="p-1.5 bg-accent text-primary rounded flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-display text-xs font-black uppercase tracking-wider text-accent">
            Conseil de Style KAKOS
          </span>
          <p className="text-[11px] sm:text-xs text-zinc-300 leading-snug">
            Associez cette pièce avec des sneakers montantes et nos accessoires urbains pour une silhouette streetwear affirmée et soignée.
          </p>
        </div>
      </div>

      {/* 4. ACCORDIONS SECTION */}
      <div className="flex flex-col border-y border-outline-variant divide-y divide-outline-variant">
        {/* Accordion 1: Caractéristiques & Détails */}
        <div className="py-3">
          <button
            type="button"
            onClick={() => toggleSection('details')}
            className="w-full flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-primary hover:text-outline transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Détails & Finitions
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.details ? 'rotate-180 text-primary' : 'text-outline'
              }`}
            />
          </button>
          {openSections.details && (
            <div className="pt-3 pb-1 text-xs text-secondary leading-relaxed flex flex-col gap-1.5 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Matière sélectionnée pour sa durabilité et sa respirabilité.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Surpiqûres renforcées au niveau des zones de tension.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Logo & finitions signature de la maison KAKOS MENSWEAR.</span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Entretien */}
        <div className="py-3">
          <button
            type="button"
            onClick={() => toggleSection('care')}
            className="w-full flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-primary hover:text-outline transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-primary" />
              Conseils d&apos;Entretien
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.care ? 'rotate-180 text-primary' : 'text-outline'
              }`}
            />
          </button>
          {openSections.care && (
            <div className="pt-3 pb-1 text-xs text-secondary leading-relaxed flex flex-col gap-1.5 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Lavage en machine à 30°C sur l&apos;envers pour préserver les fibres et couleurs.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Éviter le sèche-linge ; privilégier le séchage à plat ou sur cintre.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Repassage à température moyenne sur l&apos;envers (ne pas repasser directement les imprimés).</span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Livraison & Retours */}
        <div className="py-3">
          <button
            type="button"
            onClick={() => toggleSection('shipping')}
            className="w-full flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-primary hover:text-outline transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Livraison Express & Échanges
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.shipping ? 'rotate-180 text-primary' : 'text-outline'
              }`}
            />
          </button>
          {openSections.shipping && (
            <div className="pt-3 pb-1 text-xs text-secondary leading-relaxed flex flex-col gap-2 animate-fadeIn">
              <p>
                ⚡ <strong>Douala & Yaoundé :</strong> Livraison à domicile ou bureau en 24h chrono. Paiement disponible à la réception en cash ou Mobile Money (Orange / MTN).
              </p>
              <p>
                📦 <strong>Autres villes du Cameroun :</strong> Expédition par agence de voyage sécurisée (48h à 72h).
              </p>
              <p>
                🔄 <strong>Échange de taille :</strong> Possibilité de demander un échange de taille sous 48h si l&apos;article ne vous convient pas parfaitement (article non porté et étiqueté).
              </p>
            </div>
          )}
        </div>

        {/* Accordion 4: Garantie Qualité */}
        <div className="py-3">
          <button
            type="button"
            onClick={() => toggleSection('guarantee')}
            className="w-full flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-primary hover:text-outline transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Engagement Qualité KAKOS
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.guarantee ? 'rotate-180 text-primary' : 'text-outline'
              }`}
            />
          </button>
          {openSections.guarantee && (
            <div className="pt-3 pb-1 text-xs text-secondary leading-relaxed animate-fadeIn">
              <p>
                Chaque article est inspecté avant expédition pour garantir des coutures impeccables, une matière irréprochable et une coupe conforme aux standards streetwear haut de gamme.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
