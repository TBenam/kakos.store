import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import AdmZip from 'adm-zip';
import { extractArchive } from './cli.mjs';
import { buildCandidates, extractPrices, parseWhatsAppText, validateDraft } from './lib.mjs';

test('parse les formats Android et iOS, y compris les lignes continuées', () => {
  const messages = parseWhatsAppText(`[14/11/2026, 09:12:04] Alice: Sac dame\nPrix gros 8 500 FCFA\n14/11/2026 09:13 - Alice: IMG-001.jpg (file attached)`);
  assert.equal(messages.length, 2);
  assert.match(messages[0].text, /8 500/);
});

test('extrait un prix fournisseur en FCFA', () => {
  assert.deepEqual(extractPrices('Prix gros: 12 500 FCFA')[0], { value: 12500, supplierHint: true });
});

test('génère un brouillon et détecte un doublon photo', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kakos-wa-'));
  fs.writeFileSync(path.join(root, 'IMG-001.jpg'), 'same-image');
  const media = new Map([['img-001.jpg', 'IMG-001.jpg']]);
  const messages = parseWhatsAppText(`[14/11/2026, 09:12:04] Alice: Sac dame 8500 FCFA <attached: IMG-001.jpg>\n[14/11/2026, 09:20:04] Alice: Sac dame 8500 FCFA <attached: IMG-001.jpg>`);
  const products = buildCandidates(messages, media, root, { gapMinutes: 2 });
  assert.equal(products[0].category, 'Sacs');
  assert.equal(products[0].supplierPrice, 8500);
  assert.equal(products[1].duplicateOf, products[0].id);
  fs.rmSync(root, { recursive: true, force: true });
});

test('sépare les lots de médias omis après chaque prix', () => {
  const messages = parseWhatsAppText(`[11/15/26, 12:43:02 PM] Wanko: <image omise>\n[11/15/26, 12:43:03 PM] Wanko: <image omise>\n[11/15/26, 12:44:10 PM] Wanko: Nouveau stock 37/42 5500f\n[11/15/26, 12:44:52 PM] Wanko: <image omise>\n[11/15/26, 12:45:32 PM] Wanko: Nouveau stock 37/42 4000f avec carton`);
  const products = buildCandidates(messages, new Map(), '', {});
  assert.equal(products.length, 2);
  assert.equal(products[0].supplierPrice, 5500);
  assert.equal(products[0].omittedMediaCount, 2);
  assert.equal(products[1].supplierPrice, 4000);
});

test('bloque un produit approuvé incomplet', () => {
  const result = validateDraft({ version: 1, products: [{ id: 'wa-1', status: 'APPROVED', publish: true, title: 'Sac', category: 'Sacs', supplierPrice: 5000, salePrice: null, media: ['a.jpg'], availability: 'AVAILABLE' }] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /prix de vente/);
});

test('extrait un ZIP WhatsApp en brouillon, CSV et page de validation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kakos-wa-zip-'));
  const archive = path.join(root, 'fournisseur.zip');
  const output = path.join(root, 'sortie');
  const zip = new AdmZip();
  zip.addFile('_chat.txt', Buffer.from('[14/11/2026, 09:12:04] Alice: Sac dame 8 500 FCFA <attached: IMG-001.jpg>'));
  zip.addFile('IMG-001.jpg', Buffer.from('fake-image'));
  zip.writeZip(archive);
  const draft = extractArchive(archive, output, 'Alice Grossiste');
  assert.equal(draft.products.length, 1);
  assert.equal(draft.products[0].supplier, 'Alice Grossiste');
  assert.equal(fs.existsSync(path.join(output, 'catalog-draft.json')), true);
  assert.equal(fs.existsSync(path.join(output, 'review.csv')), true);
  assert.equal(fs.existsSync(path.join(output, 'review.html')), true);
  assert.equal(fs.existsSync(path.join(output, 'products', 'wa-0001', 'IMG-001.jpg')), true);
  fs.rmSync(root, { recursive: true, force: true });
});
