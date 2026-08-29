'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Kribi', 'Bamenda', 'Limbé'];
const FIRST_NAMES = ['Jean-Marc', 'Paul', 'Marie', 'Franck', 'Cédric', 'Arnaud', 'Célia', 'Loïc', 'Yvan', 'Dimitri'];
const PRODUCTS = [
  'T-shirt Graphic 1977',
  'Sweat à Capuche Zip Navy',
  'Ensemble Jacquard Floral',
  'Jean Slim Classique',
  'Salopette Homme',
  'Doudoune Balenciaga'
];

export default function LivePurchasePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [purchaseData, setPurchaseData] = useState({ name: '', city: '', product: '', time: '' });

  useEffect(() => {
    // Show first popup after 15 seconds
    const initialTimer = setTimeout(() => {
      triggerPopup();
    }, 15000);

    // Then random intervals between 45s and 90s
    const intervalTimer = setInterval(() => {
      if (!isVisible && Math.random() > 0.3) {
        triggerPopup();
      }
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const triggerPopup = () => {
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
    const randomName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const randomMinutes = Math.floor(Math.random() * 59) + 1;

    setPurchaseData({
      name: randomName,
      city: randomCity,
      product: randomProduct,
      time: `Il y a ${randomMinutes} min`
    });

    setIsVisible(true);

    // Hide after 6 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 z-50 bg-surface border border-outline-variant rounded-lg p-3 flex items-center gap-3 shadow-brutalist-hover max-w-[300px]"
        >
          <div className="w-10 h-10 bg-surface-container-high rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden relative">
            <span className="material-symbols-outlined text-outline">checkroom</span>
            <div className="absolute inset-0 bg-[#00F0FF] opacity-10 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wider">
              <span className="font-bold text-primary">{purchaseData.name}</span> de {purchaseData.city}
            </p>
            <p className="font-label-sm text-[11px] font-bold text-primary leading-tight mt-0.5 truncate w-full">
              a acheté {purchaseData.product}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse" />
              <span className="font-label-sm text-[9px] text-outline">{purchaseData.time}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 bg-surface border border-outline-variant w-5 h-5 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
