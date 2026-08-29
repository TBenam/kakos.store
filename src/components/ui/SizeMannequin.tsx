"use client";

import React from 'react';
import { MorphologyProfile, FitPreference } from '@/lib/sizing/sizing-engine';

interface SizeMannequinProps {
  morphology: MorphologyProfile;
  fitPreference: FitPreference;
  heightCm: number;
  weightKg: number;
  recommendedSize: string;
  categoryName?: string;
}

export default function SizeMannequin({
  morphology,
  fitPreference,
  heightCm,
  weightKg,
  recommendedSize,
  categoryName = 'T-shirt',
}: SizeMannequinProps) {
  const { widthScale, heightScale, bodyTypeLabel, chestEstimateCm, waistEstimateCm } = morphology;

  // Normalized scaling parameters
  const shoulderWidth = Math.round(70 * widthScale);
  const chestWidth = Math.round(58 * widthScale);
  const waistWidth = Math.round(48 * widthScale);
  const hipWidth = Math.round(54 * widthScale);
  const legWidth = Math.round(20 * widthScale);

  const torsoHeight = Math.round(110 * heightScale);
  const legHeight = Math.round(150 * heightScale);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl text-white select-none">
      {/* Background Grid & Cyberpunk Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Header Info Tag */}
      <div className="relative z-10 flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-cyan-400 font-bold">
            SCAN MORPHO // {morphology.bmi} IMC
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
          {bodyTypeLabel}
        </span>
      </div>

      {/* Interactive Morphing Silhouette Canvas */}
      <div className="relative w-full max-w-[280px] h-[360px] flex items-center justify-center py-2">
        {/* Height Measurement Line Left */}
        <div className="absolute left-2 top-6 bottom-6 flex flex-col justify-between items-start font-mono text-[9px] text-zinc-500 border-l border-dashed border-zinc-700 pl-1.5 pointer-events-none">
          <span>{heightCm} cm</span>
          <span className="text-cyan-400 font-bold tracking-tighter">ÉPAULES: ~{chestWidth * 2}cm</span>
          <span className="text-yellow-400 font-bold tracking-tighter">TAILLE: ~{waistWidth * 2}cm</span>
          <span>SOL</span>
        </div>

        {/* Dynamic Stylized Mannequin SVG */}
        <svg
          viewBox="0 0 240 360"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 ease-out"
        >
          <defs>
            <linearGradient id="mannequinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            <linearGradient id="cyberNeon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#00A3FF" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Center Vertical Axis */}
          <line x1="120" y1="20" x2="120" y2="340" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />

          {/* HEAD */}
          <ellipse
            cx="120"
            cy="42"
            rx={16 * Math.min(widthScale, 1.15)}
            ry="20"
            fill="url(#mannequinGrad)"
            stroke="#00F0FF"
            strokeWidth="1.5"
          />

          {/* NECK */}
          <rect
            x={120 - 9 * widthScale}
            y="60"
            width={18 * widthScale}
            height="14"
            fill="url(#mannequinGrad)"
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {/* TORSO / UPPER BODY (Morphing Polygon) */}
          <polygon
            points={`
              ${120 - shoulderWidth},74 
              ${120 + shoulderWidth},74 
              ${120 + chestWidth},${74 + torsoHeight * 0.45} 
              ${120 + waistWidth},${74 + torsoHeight * 0.85} 
              ${120 + hipWidth},${74 + torsoHeight} 
              ${120 - hipWidth},${74 + torsoHeight} 
              ${120 - waistWidth},${74 + torsoHeight * 0.85} 
              ${120 - chestWidth},${74 + torsoHeight * 0.45}
            `}
            fill="url(#mannequinGrad)"
            stroke="#00F0FF"
            strokeWidth="1.5"
            className="transition-all duration-300 ease-out"
          />

          {/* CHEST GUIDELINE */}
          <line
            x1={120 - chestWidth - 8}
            y1={74 + torsoHeight * 0.45}
            x2={120 + chestWidth + 8}
            y2={74 + torsoHeight * 0.45}
            stroke="#00F0FF"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* WAIST GUIDELINE */}
          <line
            x1={120 - waistWidth - 8}
            y1={74 + torsoHeight * 0.85}
            x2={120 + waistWidth + 8}
            y2={74 + torsoHeight * 0.85}
            stroke="#FACC15"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* ARMS */}
          {/* Left Arm */}
          <path
            d={`M ${120 - shoulderWidth} 76 Q ${120 - shoulderWidth - 14 * widthScale} ${120 + torsoHeight * 0.5}, ${120 - hipWidth - 12 * widthScale} ${74 + torsoHeight + 20}`}
            fill="none"
            stroke="#00F0FF"
            strokeWidth={14 * Math.min(widthScale, 1.2)}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          {/* Right Arm */}
          <path
            d={`M ${120 + shoulderWidth} 76 Q ${120 + shoulderWidth + 14 * widthScale} ${120 + torsoHeight * 0.5}, ${120 + hipWidth + 12 * widthScale} ${74 + torsoHeight + 20}`}
            fill="none"
            stroke="#00F0FF"
            strokeWidth={14 * Math.min(widthScale, 1.2)}
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* LEGS */}
          {/* Left Leg */}
          <path
            d={`M ${120 - hipWidth + 4} ${74 + torsoHeight} L ${120 - legWidth - 6} ${74 + torsoHeight + legHeight * 0.5} L ${120 - legWidth - 4} ${74 + torsoHeight + legHeight}`}
            fill="none"
            stroke="#00F0FF"
            strokeWidth={legWidth * 1.2}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          {/* Right Leg */}
          <path
            d={`M ${120 + hipWidth - 4} ${74 + torsoHeight} L ${120 + legWidth + 6} ${74 + torsoHeight + legHeight * 0.5} L ${120 + legWidth + 4} ${74 + torsoHeight + legHeight}`}
            fill="none"
            stroke="#00F0FF"
            strokeWidth={legWidth * 1.2}
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* CLOTHING OVERLAY SIMULATION (Streetwear Fit Visualizer) */}
          {fitPreference === 'oversize' && (
            <rect
              x={120 - shoulderWidth - 10}
              y={70}
              width={(shoulderWidth + 10) * 2}
              height={torsoHeight + 15}
              fill="none"
              stroke="#FACC15"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              rx="4"
            />
          )}

          {/* SIZE BADGE ON CHEST */}
          <g transform={`translate(120, ${74 + torsoHeight * 0.45})`}>
            <circle r="15" fill="#000" stroke="#00F0FF" strokeWidth="2" />
            <text
              textAnchor="middle"
              dy="5"
              fill="#00F0FF"
              fontSize="12"
              fontWeight="900"
              fontFamily="monospace"
            >
              {recommendedSize}
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Summary Pill */}
      <div className="relative z-10 w-full mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between font-mono text-[11px]">
        <div className="flex flex-col">
          <span className="text-zinc-400">POIDS / TAILLE</span>
          <span className="text-white font-bold">{weightKg} kg · {heightCm} cm</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-zinc-400">COUPE CHOISIE</span>
          <span className={`font-bold uppercase ${fitPreference === 'oversize' ? 'text-yellow-400' : 'text-cyan-400'}`}>
            {fitPreference === 'fitted' ? 'Ajustée' : fitPreference === 'oversize' ? 'Oversize 🔥' : 'Standard'}
          </span>
        </div>
      </div>
    </div>
  );
}
