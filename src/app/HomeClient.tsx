"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';
import SizeRecommenderModal from '@/components/ui/SizeRecommenderModal';

const SHOW_SIZING_SIMULATOR = false;

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  categoryName: string;
  imageUrl?: string;
}

export default function HomeClient({ products }: { products: DbProduct[] }) {
  const [isHomeSizerOpen, setIsHomeSizerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) return prev;
        let h = prev.hours, m = prev.minutes, s = prev.seconds - 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring" as const, stiffness: 100 } 
    }
  };

  return (
    <div className="flex flex-col w-full gap-xl pb-xl bg-background text-on-background selection:bg-accent selection:text-primary min-h-screen">
      {/* 1. Hyper-Aggressive Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex flex-col justify-end px-container-margin py-xl overflow-hidden border-b-4 border-accent">
        {/* Gritty urban hero background (using the generated streetwear image placeholder) */}
        <motion.div 
          className="absolute inset-0 w-full h-full"
          initial={{ scale: 1.1, filter: 'grayscale(100%) blur(10px)' }}
          animate={{ scale: 1, filter: 'grayscale(0%) blur(0px)' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Image
            src="/hero.webp"
            alt="KAKOS Streetwear Drop"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-top opacity-70 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
          />
        </motion.div>
        
        {/* Aggressive Glitch/Noise Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <motion.div 
          className="relative z-10 max-w-[896px] flex flex-col gap-sm items-start"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="flex items-center gap-xs mb-4">
            <span className="w-3 h-3 bg-accent animate-ping" />
            <span className="font-display text-sm sm:text-base uppercase font-black tracking-[0.3em] text-accent">
              NEW DROP // OUT NOW
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants} 
            className="font-display text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85]"
            style={{ textShadow: '4px 4px 0px #000' }}
          >
            L'ÉLÉGANCE<br/><span className="text-accent italic">BRUTE.</span>
          </motion.h1>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="bg-accent text-primary font-display text-lg uppercase font-black py-4 px-8 rounded-lg border-2 border-transparent hover:bg-primary hover:text-accent hover:border-accent transition-all duration-300 shadow-brutalist hover:shadow-brutalist-hover flex items-center gap-2"
            >
              <span>SHOP NOW</span>
              <span className="material-symbols-outlined font-black text-xl">arrow_forward</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Banner */}
      <div className="w-full bg-accent text-primary font-display font-black text-2xl sm:text-4xl uppercase overflow-hidden whitespace-nowrap py-4 border-b-4 border-primary">
        <motion.div 
          className="inline-block"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 10 }}
        >
          <span className="mx-4">🔥 KAKOS STREETWEAR 🔥</span>
          <span className="mx-4">FAST FASHION DE LUXE</span>
          <span className="mx-4">🔥 KAKOS STREETWEAR 🔥</span>
          <span className="mx-4">FAST FASHION DE LUXE</span>
          <span className="mx-4">🔥 KAKOS STREETWEAR 🔥</span>
          <span className="mx-4">FAST FASHION DE LUXE</span>
        </motion.div>
      </div>

      {/* 2. Categories Quick Links (Aggressive Grid) */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full flex flex-col gap-md pt-xl">
        <div className="flex justify-between items-end mb-4 border-b border-outline-variant pb-2">
          <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tighter uppercase text-primary">COLLECTIONS // RAYONS</h2>
          <span className="font-mono text-xs uppercase font-bold text-accent hidden sm:inline-block">8 RAYONS DISPONIBLES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { name: 'T-shirts', slug: 't-shirts', img: '/cat_tshirts_real.webp' },
            { name: 'Hoodies', slug: 'sweats-hoodies', img: '/cat_hoodies.webp' },
            { name: 'Jeans', slug: 'jeans', img: '/cat_jeans.webp' },
            { name: 'Ensembles', slug: 'ensembles', img: '/cat_ensembles.webp' },
            { name: 'Shorts', slug: 'culottes-shorts', img: '/cat_shorts.webp' },
            { name: 'Vestes', slug: 'vestes-doudounes', img: '/cat_vestes.webp' },
            { name: 'Pantalons', slug: 'pantalons', img: '/cat_pantalons.webp' },
            { name: 'Salopettes', slug: 'salopettes', img: '/cat_salopettes.webp' },
          ].map((cat, i) => (
            <motion.div 
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/collections/${cat.slug}`}
                className="group relative block aspect-square bg-[#0A0A0A] border border-outline-variant rounded-lg overflow-hidden hover:border-accent hover:shadow-brutalist transition-all duration-300"
              >
                <Image
                  src={cat.img}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                  <h3 className="font-display text-lg sm:text-2xl text-white uppercase font-black tracking-tighter">
                    {cat.name}
                  </h3>
                  <span className="material-symbols-outlined text-accent opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-lg">
                    arrow_forward
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flash Promo Banner with Countdown */}
      <section className="w-full bg-primary py-lg px-container-margin flex flex-col items-center justify-center text-center my-md border-y border-outline-variant relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==')] animate-[pulse_4s_ease-in-out_infinite]" />
        
        <h2 className="font-display text-4xl sm:text-5xl text-accent uppercase tracking-tighter font-black mb-2 relative z-10">
          OFFRE FLASH <span className="animate-pulse inline-block">⏳</span>
        </h2>
        
        <div className="flex gap-2 mb-4 font-mono text-2xl font-black text-white relative z-10">
          <div className="flex flex-col items-center"><span className="bg-[#0A0A0A] p-2 rounded border border-outline">{String(timeLeft.hours).padStart(2, '0')}</span><span className="text-[10px] text-gray-400 mt-1">HEURES</span></div><span className="pt-2">:</span>
          <div className="flex flex-col items-center"><span className="bg-[#0A0A0A] p-2 rounded border border-outline">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="text-[10px] text-gray-400 mt-1">MINS</span></div><span className="pt-2">:</span>
          <div className="flex flex-col items-center"><span className="bg-[#0A0A0A] p-2 rounded border border-outline text-accent animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="text-[10px] text-gray-400 mt-1">SECS</span></div>
        </div>

        <p className="font-body-md text-xs sm:text-sm text-white uppercase tracking-widest mb-md font-bold relative z-10">
          -30% SUR TOUTE LA COLLECTION BASICS
        </p>
        <Link
          href="/products"
          className="bg-surface text-primary font-label-sm text-xs sm:text-sm uppercase px-md py-sm rounded-lg font-black border-2 border-accent shadow-brutalist hover:shadow-brutalist-hover hover:bg-accent hover:text-primary transition-all relative z-10"
        >
          CODE: KAKOS30 · J'EN PROFITE
        </Link>
      </section>

      {/* 3. Featured Drops Grid */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full flex flex-col gap-md pt-xl">
        <div className="flex justify-between items-end mb-8 border-b border-outline-variant pb-2">
          <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tighter uppercase text-primary">LATEST DROPS</h2>
          <Link
            href="/products"
            className="font-display text-lg text-accent hover:text-primary uppercase font-black tracking-widest flex items-center gap-2"
          >
            VOIR TOUT <span className="material-symbols-outlined font-black">arrow_forward</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="w-full text-center py-xl border border-dashed border-outline-variant">
            <p className="text-primary font-display text-2xl uppercase font-black tracking-widest">Aucun produit actif pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  salePrice={product.salePrice}
                  categoryName={product.categoryName}
                  imageUrl={product.imageUrl}
                  badge={product.salePrice < 15000 ? 'HOT' : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Interactive 3D Smart Sizer Showcase Section */}
      {SHOW_SIZING_SIMULATOR && (
        <section className="px-container-margin max-w-[1280px] mx-auto w-full pt-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-zinc-950 border-2 border-accent p-8 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 rounded-lg shadow-brutalist"
          >
            {/* Cyberpunk background accents */}
            <div className="absolute inset-0 bg-[radial-gradient(#00F0FF_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4 max-w-[576px] text-left">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                <span className="font-mono text-xs uppercase font-black tracking-widest text-cyan-400">
                  EXCLUSIVITÉ KAKOS // SCAN MORPHOLOGIQUE
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                TU NE CONNAIS PAS TA TAILLE ?
              </h2>
              <p className="font-body-md text-sm sm:text-base text-gray-300 font-bold uppercase tracking-wider leading-relaxed">
                Pas de panique. Entre ta taille en centimètres et ton poids en kilogrammes. Notre moteur calcule instantanément ta corpulence et ajuste notre mannequin 3D en direct pour te donner la taille exacte.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHomeSizerOpen(true)}
                  className="bg-cyan-400 hover:bg-white text-black font-display text-lg uppercase font-black py-4 px-8 rounded-lg shadow-brutalist hover:shadow-brutalist-hover active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined font-black">straighten</span>
                  <span>TESTER MON MANNEQUIN 3D</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center bg-[#0A0A0A] border border-zinc-800 p-6 rounded-lg text-center max-w-[320px] w-full">
              <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-2">
                0 RETOUR · 100% COUPE PARFAITE
              </span>
              <div className="text-6xl font-black font-display text-white mb-1">
                98<span className="text-cyan-400">%</span>
              </div>
              <span className="font-sans text-xs text-gray-400 uppercase font-bold tracking-wider">
                de précision sur les coupes T-shirt, Hoodie et Denim
              </span>
            </div>
          </motion.div>
        </section>
      )}

      {/* 5. Secondary Editorial Section */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full pt-xl">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 border border-outline-variant bg-[#0A0A0A] overflow-hidden rounded-lg shadow-brutalist"
        >
          <div className="aspect-[4/3] md:aspect-auto min-h-[420px] relative">
            <Image
              src="/lookbook_campaign.webp"
              alt="KAKOS Streetwear Douala Squad"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-all duration-700"
            />
          </div>
          <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center gap-6 items-start bg-[#0A0A0A]">
            <span className="font-display text-xl uppercase font-black text-black bg-accent px-4 py-2 tracking-widest rounded-lg">
              QUALITÉ SUPÉRIEURE
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase leading-none">
              DES MATÉRIAUX LOURDS POUR DURER.
            </h2>
            <p className="font-body-md text-base sm:text-lg text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
              Nos hoodies de 450g et nos t-shirts en coton de 240g sont conçus pour résister au quotidien tout en conservant leur coupe boxy structurée. KAKOS allie le minimalisme architectural de Douala à la coupe brute de la culture urbaine.
            </p>
            <Link
              href="/collections/sweats-hoodies"
              className="mt-4 bg-accent text-primary border-2 border-transparent font-display text-lg uppercase font-black py-3 px-6 hover:bg-white hover:text-primary transition-all duration-300 rounded-lg shadow-brutalist hover:shadow-brutalist-hover"
            >
              SHOP HOODIES
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 6. Lookbook Campaign Banner Section */}
      <section className="px-container-margin max-w-[1280px] mx-auto w-full pt-xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative w-full h-[420px] sm:h-[520px] rounded-lg overflow-hidden border-2 border-outline-variant hover:border-accent transition-colors group shadow-brutalist"
        >
          <Image
            src="/editorial_heavy.webp"
            alt="DOUALA NIGHTS // LOOKBOOK VOL. 1"
            fill
            sizes="100vw"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-12 max-w-[700px] items-start gap-3">
            <span className="font-mono text-xs uppercase font-black tracking-widest text-accent bg-black/80 px-3 py-1 border border-accent">
              EDITORIAL // VOL. 01
            </span>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
              DOUALA NIGHTS // URBAN DROP
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-200 font-bold uppercase tracking-wider">
              Conçu pour l'asphalte et le climat tropical. Une collection capsule pensée pour ceux qui dictent les règles.
            </p>
            <Link
              href="/products"
              className="mt-2 bg-white text-black hover:bg-accent hover:text-primary font-display text-base uppercase font-black py-3 px-6 rounded-lg transition-all shadow-brutalist"
            >
              EXPLORER LA COLLECTION
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Global Sizing Modal from Homepage */}
      {SHOW_SIZING_SIMULATOR && (
        <SizeRecommenderModal
          isOpen={isHomeSizerOpen}
          onClose={() => setIsHomeSizerOpen(false)}
          categoryName="T-shirts"
          availableSizes={['S', 'M', 'L', 'XL', '2XL']}
          onApplySize={() => {}}
        />
      )}
    </div>
  );
}
