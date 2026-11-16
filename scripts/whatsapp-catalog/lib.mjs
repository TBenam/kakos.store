import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const CATEGORY_RULES = [
  ['Chaussures femmes', /talon|escarpin|sandale|babouche|mule|ballerine|chaussure.{0,12}(femme|dame)/i],
  ['Chaussures hommes', /mocassin|soulier|basket|sneaker|chaussure.{0,12}(homme|monsieur)/i],
  ['Sacs', /\bsacs?\b|sacoche|portefeuille|pochette/i],
  ['Parfums', /parfum|eau de (toilette|parfum)|fragrance|déodorant|deodorant/i],
  ['Vêtements femmes', /robe|jupe|legging|brassière|lingerie|chemise.{0,8}femme|ensemble.{0,8}femme/i],
  ['Vêtements hommes', /t-?shirt|polo|jean|pantalon|chemise|hoodie|pull|veste|doudoune|culotte|short|salopette/i],
  ['Beauté', /maquillage|rouge à lèvres|fond de teint|perruque|mèche|crème|serum|sérum/i],
  ['Montres & accessoires', /montre|lunette|ceinture|bijou|bracelet|collier|casquette/i],
  ['Maison', /drap|rideau|cuisine|marmite|thermos|tapis|lampe/i],
  ['Électronique', /écouteur|ecouteur|chargeur|téléphone|telephone|power ?bank|enceinte|bluetooth/i],
];

const SYSTEM_MESSAGE = /messages and calls are end-to-end encrypted|a créé le groupe|a ajouté|a quitté|a changé/i;
const ATTACHMENT_PATTERNS = [
  /<attached:\s*([^>]+)>/gi,
  /([^\n<>]+?\.(?:jpe?g|png|webp|gif|avif))\s*\(file attached\)/gi,
  /\b([\w ()\[\].-]+\.(?:jpe?g|png|webp|gif|avif))\b/gi,
];

export function parseWhatsAppText(text) {
  const messages = [];
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const linePattern = /^\[?(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*[ap]m)?\]?\s*(?:-|–)?\s*([^:]+):\s?(.*)$/i;

  for (const line of lines) {
    const match = line.match(linePattern);
    if (match) {
      const [, date, time, sender, body] = match;
      if (!SYSTEM_MESSAGE.test(body)) {
        messages.push({ date, time, sender: sender.trim(), text: body.trim(), index: messages.length });
      }
    } else if (/^\[?\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}[,\s]+\d{1,2}:\d{2}/.test(line)) {
      // System event with a timestamp but without a sender: do not attach it to a product message.
      continue;
    } else if (messages.length > 0 && line.trim()) {
      messages.at(-1).text += `\n${line.trim()}`;
    }
  }
  return messages;
}

export function findMediaNames(text, availableMedia) {
  const found = new Set();
  for (const pattern of ATTACHMENT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = path.basename(match[1].trim());
      const canonical = availableMedia.get(raw.toLowerCase());
      if (canonical) found.add(canonical);
    }
  }
  return [...found];
}

export function extractPrices(text) {
  const results = [];
  const pattern = /(?:prix\s*(?:gros|revendeur|fournisseur)?\s*[:=\-]?\s*)?(\d{1,3}(?:[ .]\d{3})+|\d{3,6})(?:\s*(?:f\s*cfa|fcfa|frs?|xaf|f))\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const value = Number(match[1].replace(/[ .]/g, ''));
    if (value >= 100 && value <= 10000000) {
      const context = text.slice(Math.max(0, match.index - 25), match.index + match[0].length).toLowerCase();
      results.push({ value, supplierHint: /gros|revendeur|fournisseur|achat/.test(context) });
    }
  }
  return results;
}

function minuteStamp(message) {
  const dateBits = message.date.split(/[/.\-]/).map(Number);
  const timeBits = message.time.split(':').map(Number);
  let [day, month, year] = dateBits;
  if (year < 100) year += 2000;
  return Date.UTC(year, month - 1, day, timeBits[0], timeBits[1], timeBits[2] || 0) / 60000;
}

function cleanTitle(text) {
  const cleaned = text
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\[(?:transféré|transfere)\]/gi, ' ')
    .replace(/\((?:fichier joint|file attached)\)/gi, ' ')
    .replace(/<(?:image|vidéo|video|médias?|medias?)\s+omis(?:e|es)?>/gi, ' ')
    .replace(/<attached:[^>]+>/gi, ' ')
    .replace(/[^\n]+?\.(?:jpe?g|png|webp|gif|avif|mp4|mov|m4v)\s*(?:\((?:file attached|fichier joint)\))?/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/(?:prix\s*)?(?:gros|revendeur|fournisseur)?\s*[:=\-]?\s*\d[\d .]*(?:f\s*cfa|fcfa|frs?|xaf|f)\b/gi, ' ')
    .replace(/[✨🔥✅📌🚨💥💯😍🛍️🛒]/gu, ' ')
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .find((line) => line.length >= 3 && !/^(disponible|arrivage|nouveau|promo|stock)$/i.test(line));
  return cleaned ? cleaned.slice(0, 100) : '';
}

function detectCategory(text) {
  return CATEGORY_RULES.find(([, rule]) => rule.test(text))?.[0] || 'Autres';
}

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function buildCandidates(messages, availableMedia, mediaRoot, options = {}) {
  const gapMinutes = options.gapMinutes || 12;
  const blocks = [];
  let current = null;

  for (const message of messages) {
    const media = findMediaNames(message.text, availableMedia);
    const omittedMediaCount = (message.text.match(/<(?:image|vidéo|video|médias?|medias?)\s+omis(?:e|es)?>/gi) || []).length;
    const prices = extractPrices(message.text);
    const hasMediaEvent = media.length > 0 || omittedMediaCount > 0;
    const relevant = hasMediaEvent || prices.length > 0 || current;
    if (!relevant) continue;

    const gap = current ? minuteStamp(message) - current.lastMinute : Infinity;
    const startsNew = !current || message.sender !== current.sender || gap > gapMinutes ||
      (hasMediaEvent && (current.media.length > 0 || current.omittedMediaCount > 0) && current.prices.length > 0);

    if (startsNew) {
      if (current && (current.media.length > 0 || current.prices.length > 0)) blocks.push(current);
      current = { sender: message.sender, messages: [], media: [], omittedMediaCount: 0, prices: [], firstMinute: minuteStamp(message), lastMinute: minuteStamp(message) };
    }

    current.messages.push(message);
    current.media.push(...media.filter((name) => !current.media.includes(name)));
    current.omittedMediaCount += omittedMediaCount;
    current.prices.push(...prices);
    current.lastMinute = minuteStamp(message);
  }
  if (current && (current.media.length > 0 || current.prices.length > 0)) blocks.push(current);

  const seenImageHashes = new Map();

  return blocks.map((block, index) => {
    const sourceText = block.messages.map((message) => message.text).join('\n').trim();
    const hinted = block.prices.find((price) => price.supplierHint);
    const supplierPrice = hinted?.value ?? block.prices[0]?.value ?? null;
    const title = cleanTitle(sourceText) || `Article WhatsApp ${String(index + 1).padStart(3, '0')}`;
    const detectedCategory = detectCategory(sourceText);
    const category = detectedCategory === 'Autres' && options.defaultCategory ? options.defaultCategory : detectedCategory;
    const media = block.media.filter((name) => fs.existsSync(path.join(mediaRoot, name)));
    const hashes = media.map((name) => sha256File(path.join(mediaRoot, name)));
    const fingerprint = crypto.createHash('sha256').update(`${normalize(title)}|${category}|${supplierPrice || ''}`).digest('hex');
    // Only identical image bytes are treated as blocking duplicates. Repeated captions and
    // prices are common among wholesalers and are not sufficient evidence by themselves.
    const duplicateOf = hashes.map((hash) => seenImageHashes.get(hash)).find(Boolean) || null;
    const id = `wa-${String(index + 1).padStart(4, '0')}`;
    if (!duplicateOf) {
      hashes.forEach((hash) => seenImageHashes.set(hash, id));
    }

    const uncertainties = [];
    if (!supplierPrice) uncertainties.push('Prix fournisseur introuvable');
    if (media.length === 0) uncertainties.push('Aucune photo associée');
    if (block.omittedMediaCount > 0) uncertainties.push(`${block.omittedMediaCount} média(s) omis de l’export`);
    if (category === 'Autres' || (options.defaultCategory && detectedCategory === 'Autres')) uncertainties.push('Catégorie proposée à confirmer');
    if (title.startsWith('Article WhatsApp')) uncertainties.push('Nom du produit à renseigner');
    if (duplicateOf) uncertainties.push(`Doublon probable de ${duplicateOf}`);

    return {
      id,
      status: 'REVIEW_REQUIRED',
      publish: false,
      duplicateOf,
      title,
      description: sourceText.replace(/<attached:[^>]+>/gi, '').trim(),
      category,
      supplier: options.supplier || block.sender,
      supplierPrice,
      salePrice: null,
      currency: 'XAF',
      sizes: [],
      colors: [],
      availability: 'TO_CONFIRM',
      media,
      omittedMediaCount: block.omittedMediaCount,
      mediaHashes: hashes,
      source: {
        sender: block.sender,
        firstMessage: `${block.messages[0].date} ${block.messages[0].time}`,
        messageIndexes: block.messages.map((message) => message.index),
      },
      uncertainties,
      fingerprint,
    };
  });
}

export function validateDraft(draft) {
  const errors = [];
  const warnings = [];
  if (draft?.version !== 1 || !Array.isArray(draft.products)) errors.push('Format de brouillon non reconnu.');
  for (const product of draft?.products || []) {
    if (product.status === 'APPROVED') {
      if (!product.publish) errors.push(`${product.id}: APPROVED exige publish=true.`);
      if (!product.title?.trim()) errors.push(`${product.id}: nom manquant.`);
      if (!product.category || product.category === 'Autres') errors.push(`${product.id}: catégorie à confirmer.`);
      if (!Number.isFinite(product.supplierPrice) || product.supplierPrice <= 0) errors.push(`${product.id}: prix fournisseur invalide.`);
      if (!Number.isFinite(product.salePrice) || product.salePrice <= 0) errors.push(`${product.id}: prix de vente invalide.`);
      if (!product.media?.length) errors.push(`${product.id}: photo manquante.`);
      if (product.duplicateOf) errors.push(`${product.id}: doublon non résolu (${product.duplicateOf}).`);
      if (product.availability === 'TO_CONFIRM') errors.push(`${product.id}: disponibilité fournisseur à confirmer.`);
    } else if (product.publish) {
      errors.push(`${product.id}: publish=true est réservé aux produits APPROVED.`);
    }
    if (product.uncertainties?.length) warnings.push(`${product.id}: ${product.uncertainties.join('; ')}`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function csvCell(value) {
  const text = value == null ? '' : Array.isArray(value) ? value.join(' | ') : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
