'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Banknote, 
  Smartphone, 
  Check, 
  AlertTriangle, 
  Flame,
  ArrowRight,
  Ruler,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useSizing } from '@/context/SizingContext';
import { getRecommendedSize } from '@/lib/sizing/sizing-engine';
import SizeRecommenderModal from '@/components/ui/SizeRecommenderModal';
import SizeGuideModal from '@/components/ui/SizeGuideModal';
import ProductDescriptionSection from '@/components/ui/ProductDescriptionSection';
import { getColorSwatchStyle } from '@/lib/color-swatches';
import BundleUpsell from '@/components/ui/BundleUpsell';
import { trackAnalyticsEvent } from '@/lib/analytics';

const SHOW_SIZING_SIMULATOR = false;

interface Variant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  position: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sale_price: string;
  promo_price: string | null;
  badge: string | null;
  category_name: string;
}

interface ProductDetailClientProps {
  product: Product;
  variants: Variant[];
  images: ProductImage[];
  categoryId?: string;
}

export default function ProductDetailClient({
  product,
  variants,
  images,
  categoryId,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { heightCm, weightKg, fitPreference, hasSavedProfile } = useSizing();

  // Find all unique sizes and colors in variants
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));
  const uniqueColors = Array.from(new Set(variants.map((v) => v.color)));

  // State for selections
  const [selectedSize, setSelectedSize] = useState(uniqueSizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(uniqueColors[0] || '');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizerOpen, setIsSizerOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    trackAnalyticsEvent({
      event: 'product_view',
      productId: product.id,
      categorySlug: product.category_name,
      value: Number(product.promo_price) || Number(product.sale_price),
      properties: { slug: product.slug, title: product.title },
    });
  }, [product.id, product.slug, product.title, product.category_name, product.promo_price, product.sale_price]);

  // Calculate recommended size if profile exists
  const recommendedSize = hasSavedProfile
    ? getRecommendedSize({
        heightCm,
        weightKg,
        fitPreference,
        category: product.category_name,
        availableSizes: uniqueSizes,
      }).recommendedSize
    : null;

  // Automatically select recommended size on initial load if available
  useEffect(() => {
    if (SHOW_SIZING_SIMULATOR && recommendedSize && uniqueSizes.includes(recommendedSize)) {
      setSelectedSize(recommendedSize);
    }
  }, [recommendedSize]);

  // Check stock per size for the currently selected color
  const getSizeStockForColor = (size: string, color: string) => {
    const v = variants.find((item) => item.size === size && item.color === color);
    return v ? v.stock : 0;
  };

  // Find the selected variant to get stock level
  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const regularPrice = Number(product.sale_price);
  const promoPrice = Number(product.promo_price) || 0;
  const hasRealPromo = promoPrice > 0 && promoPrice < regularPrice;
  const price = hasRealPromo ? promoPrice : regularPrice;
  const stock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = stock <= 0;

  // Image slider elements
  const currentImages =
    images.length > 0
      ? images
      : [
          {
            id: 'default',
            url: '/fallback_product.jpg',
            position: 0,
          },
        ];

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);
    addToCart(
      {
        id: selectedVariant.id,
        productId: product.id,
        title: product.title,
        slug: product.slug,
        size: selectedSize,
        color: selectedColor,
        price: price,
        imageUrl: currentImages[0].url,
        maxStock: stock,
      },
      1
    );

    // Simulate feedback delay
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  };

  const handleDirectOrder = () => {
    if (!selectedVariant || isOutOfStock) return;
    const directItem = {
      id: selectedVariant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      size: selectedSize,
      color: selectedColor,
      price: price,
      quantity: 1,
      imageUrl: currentImages[0].url,
      maxStock: stock,
    };
    sessionStorage.setItem('kakos_direct_item', JSON.stringify(directItem));
    router.push('/checkout?mode=direct');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-container-margin py-lg pb-28 md:pb-lg grid grid-cols-1 md:grid-cols-2 gap-lg lg:gap-xl">
      {/* 1. Images Gallery Column */}
      <div className="flex flex-col gap-sm">
        {/* Main image */}
        <div className="w-full aspect-[3/4] bg-surface-container-low border border-outline-variant relative overflow-hidden rounded-lg shadow-sm">
          <Image
            src={currentImages[activeImageIndex]?.url || currentImages[0]?.url || '/fallback_product.webp'}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover w-full h-full absolute inset-0 transition-opacity duration-300"
          />
          {/* Badge Bestseller/Trend on image */}
          <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm z-10">
            {product.category_name}
          </div>
        </div>

        {/* Thumbnail row */}
        {currentImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {currentImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 aspect-[3/4] bg-surface-container-low border-2 overflow-hidden rounded-lg flex-shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-primary ring-2 ring-primary/20 scale-95'
                    : 'border-outline-variant opacity-75 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="80px"
                  loading="lazy"
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Details Column */}
      <div className="flex flex-col gap-md sm:gap-lg justify-start">
        {/* Title, Category & Price */}
        <div className="flex flex-col gap-xs border-b border-outline-variant pb-sm">
          <span className="font-label-sm text-[10px] uppercase font-bold text-outline tracking-wider">
            {product.category_name} • KAKOS STREETWEAR
          </span>
          <h1 className="font-display text-headline-md sm:text-headline-lg font-bold tracking-tighter uppercase text-primary leading-tight">
            {product.title}
          </h1>
          <div className="flex flex-wrap items-baseline gap-2 mt-xs">
            <span className={`font-display text-2xl sm:text-3xl font-bold ${hasRealPromo ? 'text-accent' : 'text-primary'}`}>
              {price.toLocaleString('fr-FR')}
            </span>
            <span className="font-sans text-xs sm:text-sm text-secondary font-bold">
              FCFA
            </span>
            {hasRealPromo && (
              <>
                <span className="text-sm font-bold text-outline line-through">{regularPrice.toLocaleString('fr-FR')} FCFA</span>
                <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-black uppercase text-primary">{product.badge || 'PROMO'}</span>
              </>
            )}
          </div>
        </div>

        {/* Variants Selector */}
        <div className="flex flex-col gap-md">
          {/* Colors with Color Swatches */}
          {uniqueColors.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs uppercase font-bold text-primary flex items-center gap-1.5">
                  <span>Couleur :</span>
                  <span className="text-primary font-black uppercase underline decoration-accent decoration-2 underline-offset-4">
                    {selectedColor}
                  </span>
                </span>
                <span className="text-[11px] text-outline font-medium">
                  {uniqueColors.length} {uniqueColors.length > 1 ? 'coloris' : 'coloris'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {uniqueColors.map((color) => {
                  const swatch = getColorSwatchStyle(color);
                  const isSelected = selectedColor === color;
                  // check if color has any stock
                  const hasColorStock = variants
                    .filter((v) => v.color === color)
                    .some((v) => v.stock > 0);

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        // If current size has no stock for this new color, pick first available size
                        const currentSizeStock = getSizeStockForColor(selectedSize, color);
                        if (currentSizeStock <= 0) {
                          const firstAvail = uniqueSizes.find(
                            (s) => getSizeStockForColor(s, color) > 0
                          );
                          if (firstAvail) setSelectedSize(firstAvail);
                        }
                      }}
                      className={`group relative flex items-center gap-2 px-3 py-2 border rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-brutalist'
                          : 'border-outline-variant hover:border-primary bg-surface-container-lowest text-primary'
                      } ${!hasColorStock ? 'opacity-60' : ''}`}
                    >
                      {/* Color Swatch Circle */}
                      <span
                        className={`w-4 h-4 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 ${
                          swatch.hasBorder ? 'border border-outline-variant' : ''
                        }`}
                        style={{ background: swatch.background }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {color}
                      </span>

                      {/* Selected checkmark badge */}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {uniqueSizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-xs uppercase font-bold text-primary flex items-center gap-1.5">
                  <span>Taille :</span>
                  <span className="font-black text-primary uppercase underline decoration-accent decoration-2 underline-offset-4">
                    {selectedSize}
                  </span>
                </span>

                {/* Size Guide Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase text-primary hover:text-outline underline transition-colors cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5 text-primary" />
                  <span>Guide des tailles</span>
                </button>
              </div>

              {/* Sizing Interactive Banner / Trigger (if enabled) */}
              {SHOW_SIZING_SIMULATOR && (
                <div className="flex flex-col gap-2 p-3 bg-zinc-950 border-2 border-cyan-400 text-white rounded-lg shadow-brutalist-cyan my-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-display text-xs font-black uppercase tracking-wider text-cyan-400">
                        KAKOS SMART SIZER 3D
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 rounded-lg">
                      MORPHO SCAN
                    </span>
                  </div>
                  <p className="font-sans text-xs text-zinc-300">
                    {hasSavedProfile
                      ? `Silhouette mémorisée (${heightCm} cm / ${weightKg} kg) — Coupe ${fitPreference === 'oversize' ? 'Oversize' : fitPreference === 'fitted' ? 'Ajustée' : 'Standard'}`
                      : "Tu hésites sur ta taille ? Visualise ta silhouette sur notre mannequin interactif en 2 clics."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSizerOpen(true)}
                    className="w-full bg-cyan-400 hover:bg-white text-black font-display text-xs uppercase font-black py-2 px-3 flex items-center justify-center gap-2 transition-all rounded-lg shadow-brutalist-hover hover:shadow-brutalist active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">straighten</span>
                    <span>{hasSavedProfile ? "MODIFIER MES MENSURATIONS (3D)" : "TROUVER MA TAILLE PARFAITE (3D)"}</span>
                  </button>
                </div>
              )}

              {/* Size Buttons Grid */}
              <div className="flex flex-wrap gap-2 mt-1">
                {uniqueSizes.map((size) => {
                  const sizeStock = getSizeStockForColor(size, selectedColor);
                  const isSizeOutOfStock = sizeStock <= 0;
                  const isSelected = selectedSize === size;
                  const isRecommended = SHOW_SIZING_SIMULATOR && recommendedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`relative min-w-[54px] px-3.5 py-2.5 font-body-md text-xs rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-2 border-primary bg-primary text-white font-bold shadow-brutalist scale-100'
                          : isSizeOutOfStock
                          ? 'border border-outline-variant bg-surface-container-high text-outline opacity-60'
                          : isRecommended
                          ? 'border-2 border-cyan-500 bg-cyan-50 text-primary font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                          : 'border border-outline-variant hover:border-primary bg-surface-container-lowest text-primary'
                      }`}
                    >
                      {/* Slashed indicator for out of stock size */}
                      {isSizeOutOfStock && !isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-full h-0.5 bg-outline/40 rotate-[-25deg]" />
                        </span>
                      )}

                      <span className="font-bold tracking-wider">{size}</span>

                      {/* Out of stock label */}
                      {isSizeOutOfStock && (
                        <span className="text-[8px] uppercase tracking-tight text-error font-semibold mt-0.5">
                          Épuisé
                        </span>
                      )}

                      {isRecommended && (
                        <span className="absolute -top-2.5 -right-1 bg-cyan-400 text-black text-[8px] font-black uppercase px-1 py-0.2 shadow-sm">
                          MATCH
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stock Level Message */}
        <div className="flex items-center gap-2 font-body-md text-xs py-1">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 p-2 bg-error-container/40 text-on-error-container border border-error/30 rounded-lg w-full">
              <span className="w-2.5 h-2.5 bg-error inline-block rounded-full flex-shrink-0" />
              <span className="font-bold uppercase text-[11px]">
                Rupture temporaire pour la taille {selectedSize} en {selectedColor}
              </span>
            </div>
          ) : stock <= 3 ? (
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="w-2.5 h-2.5 bg-[#FFBF00] inline-block rounded-full animate-pulse flex-shrink-0" />
              <span className="text-xs uppercase tracking-wide">
                ⚠️ Dernières pièces : plus que <strong>{stock}</strong> en stock !
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="w-2.5 h-2.5 bg-accent inline-block rounded-full animate-pulse flex-shrink-0" />
              <span className="text-xs uppercase tracking-wide">
                🔥 En stock — Expédition immédiate garantie
              </span>
            </div>
          )}
        </div>

        {/* CTA Actions - Sticky Fixed Bottom Bar on Mobile & Clean Desktop Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md p-3 border-t border-outline-variant md:relative md:p-0 md:border-none md:bg-transparent flex flex-col sm:flex-row gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-none">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`flex-1 font-label-sm text-xs sm:text-sm uppercase font-bold py-3.5 px-4 flex justify-center items-center gap-2 active:scale-95 transition-all rounded-lg shadow-brutalist hover:shadow-brutalist-hover ${
              isOutOfStock
                ? 'bg-surface-container-high text-outline cursor-not-allowed shadow-none border border-outline-variant'
                : 'bg-surface-container-highest text-primary border border-outline-variant hover:bg-surface-container-high cursor-pointer'
            }`}
          >
            {isAdding ? 'AJOUT EN COURS...' : isOutOfStock ? 'RUPTURE DE STOCK' : 'AJOUTER AU PANIER'}
            {!isAdding && !isOutOfStock && (
              <ShoppingBag className="w-4 h-4 text-primary" />
            )}
          </button>

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleDirectOrder}
              className="flex-1 relative overflow-hidden bg-accent text-primary font-label-sm text-xs sm:text-sm uppercase font-black py-3.5 px-4 flex justify-center items-center gap-2 border-2 border-primary transition-all rounded-lg shadow-brutalist hover:shadow-brutalist-hover active:scale-95 duration-75 cursor-pointer"
            >
              {/* Periodic Shimmer Effect */}
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-12 animate-shimmer-btn pointer-events-none" />
              <span>COMMANDER MAINTENANT</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="flex flex-col items-center text-center p-2.5 bg-surface-container-low rounded-lg border border-outline-variant">
            <Truck className="w-5 h-5 text-primary mb-1" />
            <span className="text-[9px] font-bold uppercase leading-tight">Livraison Offerte dès 20 000 F</span>
          </div>
          <div className="flex flex-col items-center text-center p-2.5 bg-surface-container-low rounded-lg border border-outline-variant">
            <Banknote className="w-5 h-5 text-primary mb-1" />
            <span className="text-[9px] font-bold uppercase leading-tight">Paiement à la Livraison</span>
          </div>
          <div className="flex flex-col items-center text-center p-2.5 bg-surface-container-low rounded-lg border border-outline-variant">
            <Smartphone className="w-5 h-5 text-primary mb-1" />
            <span className="text-[9px] font-bold uppercase leading-tight">Orange & MTN MoMo</span>
          </div>
        </div>

        {/* Reassurance Guarantee */}
        {SHOW_SIZING_SIMULATOR && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-mono mt-1">
            <span className="material-symbols-outlined text-xs text-cyan-600">verified</span>
            <span>Garantie coupe & taille par le KAKOS Smart Sizer 3D</span>
          </div>
        )}

        {/* ENRICHED PRODUCT DESCRIPTION SECTION */}
        <ProductDescriptionSection
          description={product.description}
          categoryName={product.category_name}
          title={product.title}
        />

        {/* UPSELL — Souvent porté avec */}
        {categoryId && (
          <BundleUpsell
            categoryId={categoryId}
            currentSlug={product.slug}
          />
        )}
      </div>

      {/* Size Guide Interactive Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        categoryName={product.category_name}
      />

      {/* Smart Sizer Interactive Modal */}
      {SHOW_SIZING_SIMULATOR && (
        <SizeRecommenderModal
          isOpen={isSizerOpen}
          onClose={() => setIsSizerOpen(false)}
          categoryName={product.category_name}
          availableSizes={uniqueSizes}
          currentSelectedSize={selectedSize}
          onApplySize={(newSize) => setSelectedSize(newSize)}
        />
      )}
    </div>
  );
}
