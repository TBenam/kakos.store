import test from 'node:test';
import assert from 'node:assert/strict';
import { getBlockingReasons, slugify } from './publish-to-supabase.mjs';

test('bloque une fiche WhatsApp incomplète avant publication', () => {
  const blockers = getBlockingReasons({
    supplierPrice: null, pricing: null, media: [], splitRequired: true,
    availability: 'TO_CONFIRM', sizes: [], colors: [],
  });
  assert.equal(blockers.length, 7);
  assert.match(blockers.join(' '), /Coût fournisseur/);
});

test('accepte une fiche complète prête pour validation humaine', () => {
  const blockers = getBlockingReasons({
    supplierPrice: 2500,
    pricing: { recommendedRetailPrice: 5000 },
    media: ['photo.jpg'],
    splitRequired: false,
    availability: 'AVAILABLE',
    sizes: ['M', 'L'],
    colors: ['Noir'],
  });
  assert.deepEqual(blockers, []);
  assert.equal(slugify('Chaussures Femmes – Dorées'), 'chaussures-femmes-dorees');
});

