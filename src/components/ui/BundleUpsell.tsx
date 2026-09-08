'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import UpsellProductRow from './UpsellProductRow';

interface BundleUpsellProps {
  categoryId: string;
  currentSlug: string;
  /** Variant IDs already in cart to avoid re-suggesting them */
  excludeIds?: string[];
}

export default function BundleUpsell({ categoryId, currentSlug, excludeIds = [] }: BundleUpsellProps) {
  return (
    <div className="relative border-2 border-accent rounded-xl p-4 bg-surface-container-lowest shadow-brutalist overflow-hidden">
      {/* Accent corner badge */}
      <div className="absolute top-0 right-0 bg-accent text-primary text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-bl-xl rounded-tr-xl z-10">
        <span className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" />
          Look Complet
        </span>
      </div>

      <UpsellProductRow
        title="Souvent porté avec"
        categoryId={categoryId}
        excludeSlug={currentSlug}
        excludeIds={excludeIds}
        limit={4}
        compact={false}
      />
    </div>
  );
}
