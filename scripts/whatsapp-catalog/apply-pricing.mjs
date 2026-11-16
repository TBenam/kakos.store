#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { writeReviewCsv, writeReviewHtml } from './cli.mjs';

const root = path.resolve(process.argv[2] || 'outputs/kakos-catalogue-final-a-valider');
const roundUp500 = (value) => Math.ceil(value / 500) * 500;

const assumptions = {
  affiliateRate: 0.10,
  failedOrderReserveRate: 0.06,
  platformAndContentRate: 0.03,
  fixedOperationsPerOrder: 300,
  targetContributionRate: 0.24,
  deliveryChargedSeparately: true,
};

const grossisteLongueurOverrides = {
  'wa-0123': { title: 'Collection T-shirts – modèles assortis (lot 1)', category: 'T-shirts', supplierPrice: 2500, splitRequired: true },
  'wa-0125': { title: 'Collection T-shirts graphiques (lot 2)', category: 'T-shirts', supplierPrice: 2500, splitRequired: true },
  'wa-0126': { title: 'Collection T-shirts premium (lot 3)', category: 'T-shirts', supplierPrice: 2500, splitRequired: true },
  'wa-0127': { title: 'Lot mixte T-shirts et jeans', category: 'Lot mixte', splitRequired: true },
  'wa-0128': { title: 'Collection jeans homme', category: 'Jeans' },
  'wa-0129': { title: 'Collection pantalons et joggers', category: 'Pantalons' },
  'wa-0130': { title: 'Collection shorts homme (lot 1)', category: 'Shorts' },
  'wa-0131': { title: 'Collection shorts homme (lot 2)', category: 'Shorts' },
  'wa-0132': { title: 'Short homme imprimé', category: 'Shorts' },
  'wa-0133': { title: 'Collection shorts premium', category: 'Shorts' },
  'wa-0134': { title: 'Collection maillots de basketball', category: 'Maillots', supplierPrice: 1500, splitRequired: true },
};

function calculatePricing(product) {
  const cost = Number(product.supplierPrice);
  if (!Number.isFinite(cost) || cost <= 0) return null;

  const variableRates = assumptions.affiliateRate + assumptions.failedOrderReserveRate + assumptions.platformAndContentRate + assumptions.targetContributionRate;
  let retail = roundUp500((cost + assumptions.fixedOperationsPerOrder) / (1 - variableRates));
  if (product.category === 'T-shirts') retail = Math.max(retail, 5000);
  if (product.category === 'Sacs') retail = Math.max(retail, 6500);
  if (/Chaussures/i.test(product.category)) retail = Math.max(retail, 7500);
  if (product.category === 'Maillots') retail = Math.max(retail, 3500);

  const affiliateCommission = Math.round(retail * assumptions.affiliateRate / 100) * 100;
  const failedOrderReserve = Math.round(retail * assumptions.failedOrderReserveRate / 100) * 100;
  const platformAndContentReserve = Math.round(retail * assumptions.platformAndContentRate / 100) * 100;
  const kakosContribution = retail - cost - affiliateCommission - failedOrderReserve - platformAndContentReserve - assumptions.fixedOperationsPerOrder;
  const resellerPrice = roundUp500(Math.max(cost * 1.4, retail * 0.75));
  const resellerMinimumQuantity = /Chaussures|Sacs/i.test(product.category) ? 2 : 3;

  return {
    currency: 'XAF',
    recommendedRetailPrice: retail,
    affiliateCommission,
    failedOrderReserve,
    platformAndContentReserve,
    fixedOperations: assumptions.fixedOperationsPerOrder,
    estimatedKakosContribution: kakosContribution,
    estimatedKakosContributionRate: Number((kakosContribution / retail).toFixed(3)),
    resellerPrice,
    resellerMinimumQuantity,
    deliveryIncluded: false,
    requiresSupplierUnitAvailability: true,
  };
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const rows = [];
for (const supplierDir of fs.readdirSync(root)) {
  const supplierPath = path.join(root, supplierDir);
  const draftPath = path.join(supplierPath, 'catalog-draft.json');
  if (!fs.existsSync(draftPath)) continue;
  const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

  for (const product of draft.products) {
    if (supplierDir === 'grossiste-longueur' && grossisteLongueurOverrides[product.id]) {
      Object.assign(product, grossisteLongueurOverrides[product.id]);
      if (grossisteLongueurOverrides[product.id].splitRequired) {
        product.uncertainties = [...new Set([...(product.uncertainties || []), 'Séparer les photos en fiches par modèle avant publication'])];
      }
    }
    product.pricing = calculatePricing(product);
    product.salePrice = product.pricing?.recommendedRetailPrice ?? null;
    if (Number(product.supplierPrice) > 0) {
      product.uncertainties = (product.uncertainties || []).filter((item) => !/Prix fournisseur introuvable/i.test(item));
    }
    if (product.category && product.category !== 'Autres') {
      product.uncertainties = (product.uncertainties || []).filter((item) => !/Catégorie .*confirmer/i.test(item));
    }
    if (product.pricing) {
      product.uncertainties = (product.uncertainties || []).filter((item) => item !== 'Prix de vente à définir');
    }
    rows.push({ supplier: supplierDir, ...product });
  }

  draft.pricingPolicy = { version: 1, appliedAt: new Date().toISOString(), assumptions };
  fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), 'utf8');
  writeReviewCsv(draft, path.join(supplierPath, 'review.csv'));
  writeReviewHtml(draft, path.join(supplierPath, 'review.html'));
}

const header = ['supplier', 'id', 'title', 'category', 'supplierPrice', 'recommendedRetailPrice', 'affiliateCommission', 'estimatedKakosContribution', 'resellerPrice', 'resellerMinimumQuantity', 'photos', 'status'];
const csv = [header.join(',')];
for (const product of rows) {
  csv.push([
    product.supplier,
    product.id,
    product.title,
    product.category,
    product.supplierPrice,
    product.pricing?.recommendedRetailPrice,
    product.pricing?.affiliateCommission,
    product.pricing?.estimatedKakosContribution,
    product.pricing?.resellerPrice,
    product.pricing?.resellerMinimumQuantity,
    product.media?.length || 0,
    product.status,
  ].map(csvCell).join(','));
}
fs.writeFileSync(path.join(root, 'pricing-calculator.csv'), `\uFEFF${csv.join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'pricing-policy.json'), JSON.stringify({ version: 1, assumptions }, null, 2), 'utf8');

console.log(`Tarification appliquée à ${rows.filter((product) => product.pricing).length}/${rows.length} fiches.`);
