"use client";

import React, { useState, useEffect } from 'react';
import { useSizing } from '@/context/SizingContext';
import { getRecommendedSize, FitPreference, ClothingCategory } from '@/lib/sizing/sizing-engine';
import SizeMannequin from './SizeMannequin';

interface SizeRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: ClothingCategory;
  availableSizes: string[];
  currentSelectedSize?: string;
  onApplySize: (size: string) => void;
}

export default function SizeRecommenderModal({
  isOpen,
  onClose,
  categoryName,
  availableSizes,
  currentSelectedSize,
  onApplySize,
}: SizeRecommenderModalProps) {
  const { heightCm: savedHeight, weightKg: savedWeight, fitPreference: savedFit, setMeasurements } = useSizing();

  const [height, setHeight] = useState<number>(savedHeight || 180);
  const [weight, setWeight] = useState<number>(savedWeight || 78);
  const [fit, setFit] = useState<FitPreference>(savedFit || 'regular');

  useEffect(() => {
    if (savedHeight) setHeight(savedHeight);
    if (savedWeight) setWeight(savedWeight);
    if (savedFit) setFit(savedFit);
  }, [savedHeight, savedWeight, savedFit]);

  if (!isOpen) return null;

  const recommendation = getRecommendedSize({
    heightCm: height,
    weightKg: weight,
    fitPreference: fit,
    category: categoryName,
    availableSizes,
  });

  const handleApply = () => {
    setMeasurements(height, weight, fit);
    onApplySize(recommendation.recommendedSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-zinc-950 border-2 border-cyan-400/60 rounded-lg shadow-brutalist-cyan text-white p-6 sm:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
              <span className="font-mono text-xs uppercase font-black tracking-widest text-cyan-400">
                KAKOS SMART SIZER // 3D MORPHO ENGINE
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              TROUVEZ VOTRE TAILLE IDÉALE
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-400">
              Ajustez votre taille et votre poids pour visualiser votre silhouette et obtenir la coupe parfaite.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Grid Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Interactive Sliders & Fit Options */}
          <div className="flex flex-col gap-6">
            {/* Height Slider */}
            <div className="flex flex-col gap-2 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-zinc-300 font-bold uppercase tracking-wider">VOTRE TAILLE</span>
                <span className="text-cyan-400 font-black text-base">{height} cm</span>
              </div>
              <input
                type="range"
                min="150"
                max="210"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                <span>150 cm</span>
                <span>180 cm</span>
                <span>210 cm</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div className="flex flex-col gap-2 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-zinc-300 font-bold uppercase tracking-wider">VOTRE POIDS</span>
                <span className="text-cyan-400 font-black text-base">{weight} kg</span>
              </div>
              <input
                type="range"
                min="45"
                max="135"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                <span>45 kg</span>
                <span>80 kg</span>
                <span>135 kg</span>
              </div>
            </div>

            {/* Fit Preference Pills */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs text-zinc-300 font-bold uppercase tracking-wider">
                STYLE DE COUPE DÉSIRÉ
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'fitted', label: 'Ajustée', desc: 'Près du corps' },
                  { key: 'regular', label: 'Standard', desc: 'Confort classique' },
                  { key: 'oversize', label: 'Oversize 🔥', desc: 'Streetwear loose' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFit(item.key as FitPreference)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      fit === item.key
                        ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-display text-xs uppercase font-black">{item.label}</span>
                    <span className="text-[10px] text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing Match Result Card */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-4 rounded-lg border border-cyan-400/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                  RECOMMANDATION KAKOS
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  ✓ {recommendation.confidenceScore}% DE MATCH
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-black text-cyan-400">
                  TAILLE {recommendation.recommendedSize}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  ({recommendation.morphology.bodyTypeLabel})
                </span>
              </div>

              <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                {recommendation.sizeAdvice}
              </p>

              {recommendation.alternativeSize && (
                <div className="mt-1 text-[11px] font-sans text-zinc-400 border-t border-zinc-800 pt-2 flex items-center gap-1.5">
                  <span className="text-yellow-400 font-bold">Astuce style :</span>
                  <span>{recommendation.alternativeAdvice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Dynamic Mannequin */}
          <div className="flex flex-col items-center justify-center">
            <SizeMannequin
              morphology={recommendation.morphology}
              fitPreference={fit}
              heightCm={height}
              weightKg={weight}
              recommendedSize={recommendation.recommendedSize}
              categoryName={categoryName}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <span className="material-symbols-outlined text-sm text-cyan-400">lock</span>
            <span>Mensurations sauvegardées pour tous les articles de la boutique.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/3 sm:w-auto px-5 py-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-mono text-xs uppercase font-bold rounded-lg transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handleApply}
              className="w-2/3 sm:w-auto px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-display text-sm uppercase font-black rounded-lg shadow-brutalist hover:shadow-brutalist-hover active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>APPLIQUER LA TAILLE {recommendation.recommendedSize}</span>
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
