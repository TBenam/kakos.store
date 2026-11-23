"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ui/ProductCard';

export interface HomeProduct {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  originalPrice?: number;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  badge?: string;
}

export interface HomeCampaign {
  title: string;
  bannerUrl: string;
}

interface HomeClientProps {
  flashDeals: HomeProduct[];
  bestSellers: HomeProduct[];
  newArrivals: HomeProduct[];
  perfumes: HomeProduct[];
  bagFeature?: HomeProduct;
  campaign?: HomeCampaign;
}

function ProductRail({ title, eyebrow, products, accent = false }: { title: string; eyebrow: string; products: HomeProduct[]; accent?: boolean }) {
  if (products.length === 0) return null;
  return (
    <section className={`mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-container-margin ${accent ? 'rounded-2xl bg-primary py-8 text-white' : ''}`}>
      <div className={`border-b pb-3 ${accent ? 'border-white/20' : 'border-outline-variant'}`}>
        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${accent ? 'text-accent' : 'text-outline'}`}>{eyebrow}</span>
        <h2 className={`font-display text-3xl font-black uppercase tracking-tighter sm:text-5xl ${accent ? 'text-white' : 'text-primary'}`}>{title}</h2>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-width:thin]">
        {products.map((product) => (
          <div key={product.id} className="w-[66vw] max-w-[260px] shrink-0 snap-start sm:w-[240px]">
            <ProductCard id={product.id} title={product.title} slug={product.slug} salePrice={product.salePrice} originalPrice={product.originalPrice} categoryName={product.categoryName} imageUrl={product.imageUrl} badge={product.badge} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomeClient({ flashDeals, bestSellers, newArrivals, perfumes, bagFeature, campaign }: HomeClientProps) {
  return (
    <div className="flex min-h-screen w-full flex-col gap-xl bg-background pb-xl text-on-background selection:bg-accent selection:text-primary">
      <section className="relative flex h-[78vh] min-h-[560px] w-full flex-col justify-end overflow-hidden border-b-4 border-accent px-container-margin py-xl">
        <motion.div className="absolute inset-0" initial={{ scale: 1.06, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.1 }}>
          <Image src="/kakos-home-hero-mobile-v4.webp" alt="Mannequins KAKOS Cameroun" fill priority sizes="100vw" className="object-cover object-center sm:hidden" />
          <Image src="/kakos-home-hero-v3.webp" alt="Mannequins KAKOS Cameroun" fill priority sizes="100vw" className="hidden object-cover object-center sm:block" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <motion.div className="relative z-10 flex max-w-[820px] flex-col items-start gap-5" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.65 }}>
          <span className="bg-black px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.28em] text-accent">The new KAKOS edit</span>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.84] tracking-tighter text-white sm:text-7xl md:text-8xl">
            Le style qui<br /><span className="text-accent">se remarque.</span>
          </h1>
          <p className="max-w-xl text-sm font-bold uppercase tracking-wider text-gray-200 sm:text-base">
            Les arrivages de nos fournisseurs réunis dans un catalogue simple, actuel et livré au Cameroun.
          </p>
          <Link href="/products" className="flex items-center gap-2 rounded-lg bg-accent px-7 py-4 font-display text-lg font-black uppercase text-primary shadow-brutalist transition hover:bg-white">
            Explorer le catalogue <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </motion.div>
        <div className="absolute bottom-8 right-5 z-20 hidden rotate-2 bg-white px-4 py-3 text-black shadow-[6px_6px_0_#D9A441] sm:bottom-14 sm:right-[8%] sm:block">
          <span className="block text-[9px] font-black uppercase tracking-widest">Sacs structurés</span><strong className="font-display text-2xl font-black">6 500 F</strong>
        </div>
        <div className="absolute right-[28%] top-24 z-20 -rotate-3 bg-accent px-4 py-3 text-primary shadow-[5px_5px_0_#111] max-sm:hidden">
          <span className="block text-[9px] font-black uppercase tracking-widest">Chaussures</span><strong className="font-display text-2xl font-black">dès 8 000 F</strong>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1280px] gap-4 px-container-margin md:grid-cols-2">
        <Link href="/products?category=t-shirts" className="group relative min-h-[620px] overflow-hidden bg-primary">
          <Image src="/kakos-poster-homme-v3.webp" alt="Mode homme KAKOS" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10"><span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">Le vestiaire homme</span><h2 className="font-display text-5xl font-black uppercase leading-none">Street & sharp</h2><span className="mt-3 block text-xs font-black uppercase">Voir le rayon →</span></div>
          <div className="absolute right-5 top-6 rotate-3 bg-white px-4 py-3 text-black shadow-[5px_5px_0_#D9A441]"><span className="block text-[9px] font-black uppercase">T-shirts</span><strong className="font-display text-2xl">5 000 F</strong></div>
        </Link>
        <Link href="/products?category=chaussures-femmes" className="group relative min-h-[620px] overflow-hidden bg-primary">
          <Image src="/kakos-poster-femme-v3.webp" alt="Mode femme KAKOS" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10"><span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">La sélection femme</span><h2 className="font-display text-5xl font-black uppercase leading-none">Power dressing</h2><span className="mt-3 block text-xs font-black uppercase">Voir le rayon →</span></div>
          <div className="absolute left-5 top-6 -rotate-2 bg-accent px-4 py-3 text-primary shadow-[5px_5px_0_#111]"><span className="block text-[9px] font-black uppercase">Talons & sacs</span><strong className="font-display text-2xl">dès 6 500 F</strong></div>
        </Link>
      </section>

      {bagFeature?.imageUrl && (
        <section className="mx-auto w-full max-w-[1280px] px-container-margin">
          <Link href="/collections/sacs" className="group relative block min-h-[360px] overflow-hidden rounded-2xl bg-primary sm:min-h-[460px]">
            <Image src={bagFeature.imageUrl} alt={bagFeature.title} fill sizes="100vw" className="object-cover object-center transition duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-end p-7 text-white sm:p-12">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">L’édit accessoires</span>
              <h2 className="mt-2 font-display text-4xl font-black uppercase leading-none sm:text-6xl">Sacs à main</h2>
              <p className="mt-3 max-w-sm text-xs font-bold uppercase tracking-wider text-gray-200">Des modèles structurés sélectionnés pour le quotidien et les sorties.</p>
              <span className="mt-5 w-fit rounded-lg bg-accent px-5 py-3 text-xs font-black uppercase text-primary">Découvrir la sélection →</span>
            </div>
            <div className="absolute right-5 top-5 rotate-2 bg-white px-4 py-3 text-primary shadow-[5px_5px_0_#D9A441]">
              <span className="block text-[9px] font-black uppercase">À partir de</span>
              <strong className="font-display text-2xl">{bagFeature.salePrice.toLocaleString('fr-FR')} F</strong>
            </div>
          </Link>
        </section>
      )}

      {campaign && (
        <section className="mx-auto w-full max-w-[1280px] px-container-margin">
          <Link href="/products?promos=1" className="group relative block h-[230px] overflow-hidden rounded-xl border-2 border-accent sm:h-[320px]">
            <Image src={campaign.bannerUrl} alt={campaign.title} fill sizes="100vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex max-w-xl flex-col justify-end p-6 sm:p-10">
              <span className="mb-2 w-fit bg-accent px-2 py-1 text-[10px] font-black uppercase text-primary">Campagne en cours</span>
              <h2 className="font-display text-3xl font-black uppercase leading-none text-white sm:text-5xl">{campaign.title}</h2>
              <span className="mt-3 text-xs font-bold uppercase text-white">Découvrir l’offre →</span>
            </div>
          </Link>
        </section>
      )}

      <ProductRail title="Parfums de la semaine" eyebrow="La sélection Yaoundé" products={perfumes} />
      <ProductRail title="Ventes flash" eyebrow="Prix réellement réduits" products={flashDeals} accent />
      <ProductRail title="Best sellers" eyebrow="Les favoris KAKOS" products={bestSellers} />
      <ProductRail title="Nouveaux arrivages" eyebrow="Fraîchement ajoutés" products={newArrivals} />

      <section className="mx-auto grid w-full max-w-[1280px] gap-4 px-container-margin md:grid-cols-2">
        <Link href="/products?sort=newest" className="group relative min-h-[260px] overflow-hidden rounded-xl border border-outline-variant bg-primary p-7 sm:p-10">
          <Image src="/lookbook_campaign-v2.png" alt="Nouveaux arrivages KAKOS" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-55 transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="relative flex h-full flex-col justify-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Fraîchement ajoutés</span>
            <h2 className="font-display text-4xl font-black uppercase text-white">Nouveaux arrivages</h2>
            <span className="mt-2 text-xs font-bold uppercase text-white">Découvrir →</span>
          </div>
        </Link>
        <Link href="/products" className="flex min-h-[260px] flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-low p-7 transition hover:border-accent sm:p-10">
          <span className="material-symbols-outlined text-5xl text-accent">storefront</span>
          <div>
            <h2 className="font-display text-4xl font-black uppercase text-primary">Tout KAKOS</h2>
            <p className="mt-2 max-w-md text-sm font-bold uppercase tracking-wide text-secondary">Parcourez le catalogue complet, filtrez par rayon et avancez page par page.</p>
            <span className="mt-4 block text-xs font-black uppercase text-accent">Ouvrir le catalogue →</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
