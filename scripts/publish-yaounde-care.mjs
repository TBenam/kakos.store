import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const assetRoot = path.join(root, 'outputs', 'fournisseur-yaounde', 'care-web');
const apply = process.argv.includes('--apply');
const activate = process.argv.includes('--activate');

function loadEnv(file) {
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const split = line.indexOf('=');
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    let value = line.slice(split + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const products = [
  {
    slug: 'roushun-gel-douche-exfoliant-1000ml', title: 'Roushun Gel douche exfoliant — 1000 ml', category: ['Soins du corps', 'soins-du-corps'],
    cost: 3500, price: 8500, affiliate: true, commission: 2000, sources: [23],
    sourcePage: 'https://fr.made-in-china.com/co_cnstbaojie/product_Roushun-Scrub-Shower-Gel-Whitening-Super-Glowing-Deep-Cleansing-Exfoliating-Hydrating-1000ml_yuougggysg.html',
    description: "Un grand format de 1000 ml qui nettoie la peau et aide à éliminer les cellules mortes grâce à sa texture exfoliante. Plusieurs formules Roushun sont disponibles selon l'arrivage : papaye-carotte, vitamine C, beurre de karité-coco et autres. La variante exacte est confirmée en photo avant livraison. Usage externe ; éviter le contact avec les yeux.",
    variants: [{ size: '1000 ml', color: 'Formule assortie', stock: 10 }],
  },
  {
    slug: 'wellice-24k-gold-shampoo-500ml', title: 'Wellice 24K Gold Keratin Shampoo — 500 ml', category: ['Soins capillaires', 'soins-capillaires'],
    cost: 2000, price: 6000, affiliate: false, commission: 0, sources: [18, 19],
    sourcePage: 'https://missbeauty.com.pk/products/welice-24k-gold-keratin-serum-shampoo-500ml',
    description: "Un shampooing grand format enrichi en kératine, conçu pour nettoyer les cheveux tout en améliorant leur toucher et leur aspect brillant. Sa formule 24K Gold convient particulièrement aux cheveux secs, ternes ou difficiles à discipliner. Appliquer sur cheveux mouillés, masser puis rincer soigneusement.",
    variants: [{ size: '500 ml', color: '24K Gold', stock: 8 }],
  },
  {
    slug: 'roushun-olive-oil-hair-treatment-1000ml', title: 'Roushun Olive Oil Hair Treatment — 1000 ml', category: ['Soins capillaires', 'soins-capillaires'],
    cost: 1500, price: 5000, affiliate: false, commission: 0, sources: [21, 22],
    sourcePage: 'https://www.st-baojie.com/roushun-natural-olive-oil-hair-treatment_p919.html',
    description: "Un masque capillaire à l'huile d'olive en format familial de 1000 ml. Il s'utilise après le shampooing pour assouplir les longueurs, faciliter le démêlage et nourrir les cheveux secs. Répartir sur cheveux propres, laisser agir quelques minutes puis rincer.",
    variants: [{ size: '1000 ml', color: 'Olive Oil', stock: 10 }],
  },
  {
    slug: 'beckon-hair-mayonnaise-500g', title: 'Beckon Hair Mayonnaise — 500 g', category: ['Soins capillaires', 'soins-capillaires'],
    cost: 1500, price: 5000, affiliate: false, commission: 0, sources: [21, 22],
    sourcePage: 'https://xd21.co.za/products/hair-mayonnaise-500g-deep-conditioning-repair-treatment',
    description: "Un soin profond à base d'huile d'olive et de protéines, pensé pour les cheveux fragilisés, secs ou traités. Sa texture riche enrobe les longueurs et aide à retrouver des cheveux plus souples et faciles à coiffer. Utiliser après le shampooing puis rincer abondamment.",
    variants: [{ size: '500 g', color: 'Olive & protéines', stock: 10 }],
  },
  {
    slug: 'cqk-masques-visage-lot-5', title: 'CQK Masques visage assortis — lot de 5', category: ['Soins du visage', 'soins-du-visage'],
    cost: 834, price: 3500, affiliate: false, commission: 0, sources: [31, 32],
    sourcePage: 'https://pontecoquetta.tiendanegocio.com/producto/p2522306/caja-x30-uni-mascarilla-facial-cqk-surtidas',
    description: "Un lot découverte de cinq masques en tissu CQK aux extraits assortis : fruits, riz, miel, lait ou avocat selon disponibilité. Chaque sachet s'applique sur une peau propre pendant le temps indiqué sur l'emballage. Les cinq variantes sont choisies dans l'arrivage disponible.",
    variants: [{ size: '5 × 30 ml', color: 'Assorti', stock: 12 }],
  },
  {
    slug: 'miss-wendy-huile-corps-200ml', title: 'Miss Wendy Huile corps — 200 ml', category: ['Soins du corps', 'soins-du-corps'],
    cost: 1500, price: 5000, affiliate: false, commission: 0, sources: [29, 30],
    sourcePage: 'https://tampms-corner.buyam.cm/shop/34572/huile-miss-wendy',
    description: "Une huile légère de 200 ml pour nourrir la peau et compléter la routine après la douche. Les formules disponibles varient selon l'arrivage : vitamine E, curcuma, avocat, olive ou autres huiles végétales. Appliquer en petite quantité sur peau légèrement humide ; variante confirmée avant livraison.",
    variants: [{ size: '200 ml', color: 'Formule assortie', stock: 10 }],
  },
  {
    slug: 'dr-davey-cocoa-butter-shower-oil-200ml', title: 'Dr Davey Cocoa Butter Shower Oil — 200 ml', category: ['Soins du corps', 'soins-du-corps'],
    cost: 1500, price: 4500, affiliate: false, commission: 0, sources: [25],
    sourcePage: 'https://shop.tiktok.com/us/pdp/dr-davey-2pcs-200ml-rich-shine-cocoa-butter-shower-oil/1732301050103501177',
    description: "Une huile de douche au beurre de cacao qui nettoie sans laisser la peau inconfortable. Son petit format de 200 ml est pratique au quotidien et laisse un toucher souple après rinçage. Verser une petite quantité sur peau humide, faire mousser délicatement puis rincer. Usage externe uniquement.",
    variants: [{ size: '200 ml', color: 'Cocoa Butter', stock: 10 }],
  },
];

for (const product of products) {
  const margin = product.price - product.cost - product.commission - (product.affiliate ? 500 : 0);
  if (margin < 2500) throw new Error(`Marge insuffisante: ${product.slug}`);
  for (const image of ['01-principal.webp', '02-detail.webp']) {
    if (!fs.existsSync(path.join(assetRoot, product.slug, image))) throw new Error(`Image manquante: ${product.slug}/${image}`);
  }
}

console.table(products.map((p) => ({ produit: p.title, fournisseur: p.cost, vente: p.price, circuit: p.affiliate ? 'REVENDEURS' : 'DIRECT', commission: p.commission, margeKakos: p.price - p.cost - p.commission - (p.affiliate ? 500 : 0) })));
if (!apply) process.exit(0);

loadEnv(path.join(root, '.env.local'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error('Configuration Supabase absente');
const nativeFetch = globalThis.fetch;
async function fetchWithRetry(input, init) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try { return await nativeFetch(input, init); } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchWithRetry } });

const { data: supplier, error: supplierError } = await supabase.from('suppliers').upsert({
  name: 'Fournisseur local Yaoundé — magasin', source_slug: 'fournisseur-local-yaounde', whatsapp_phone: null, is_active: true,
  notes: 'Magasin physique visité à Yaoundé. Achat possible pièce par pièce. Stock et référence exacte à contrôler avant encaissement.',
}, { onConflict: 'source_slug' }).select('id').single();
if (supplierError) throw supplierError;

const categoryIds = new Map();
for (const product of products) {
  const [name, slug] = product.category;
  if (!categoryIds.has(slug)) {
    const { data: existing, error: lookupError } = await supabase.from('categories').select('id').eq('name', name).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      categoryIds.set(slug, existing.id);
    } else {
      const { data, error } = await supabase.from('categories').upsert({ name, slug }, { onConflict: 'slug' }).select('id').single();
      if (error) throw error;
      categoryIds.set(slug, data.id);
    }
  }
  const { data: row, error: productError } = await supabase.from('products').upsert({
    category_id: categoryIds.get(slug), title: product.title, slug: product.slug, description: product.description,
    supplier_price: product.cost, sale_price: product.price, promo_price: null, badge: 'SOINS YAOUNDÉ',
    is_active: activate, is_new: true, is_bestseller: false, is_featured: true,
    affiliate_eligible: product.affiliate, affiliate_commission_amount: product.commission,
  }, { onConflict: 'slug' }).select('id').single();
  if (productError) throw productError;

  await supabase.from('product_variants').delete().eq('product_id', row.id);
  const { error: variantError } = await supabase.from('product_variants').insert(product.variants.map((variant) => ({ product_id: row.id, ...variant })));
  if (variantError) throw variantError;
  await supabase.from('product_images').delete().eq('product_id', row.id);
  for (const [position, image] of ['01-principal.webp', '02-detail.webp'].entries()) {
    const body = fs.readFileSync(path.join(assetRoot, product.slug, image));
    const version = crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);
    const storagePath = `yaounde/care/${product.slug}/${version}-${image}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(storagePath, body, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(storagePath);
    const { error: imageError } = await supabase.from('product_images').insert({ product_id: row.id, url: publicUrl.publicUrl, position });
    if (imageError) throw imageError;
  }
  const { error: linkError } = await supabase.from('supplier_products').upsert({
    supplier_id: supplier.id, product_id: row.id, source_product_id: `yaounde-care-${product.slug}`,
    supplier_price: product.cost, availability: 'TO_CONFIRM', last_confirmed_at: null,
    source_metadata: { campaign: 'soins-yaounde-2026-11-23', source_photo_indices: product.sources, clean_packshot_source: product.sourcePage, sales_channel: product.affiliate ? 'AFFILIATE' : 'DIRECT', seller_commission_target: product.commission },
  }, { onConflict: 'supplier_id,source_product_id' });
  if (linkError) throw linkError;
  console.log(`${activate ? 'Activé' : 'Préparé'}: ${product.title}`);
}

console.log(`Sélection soins publiée: ${products.length} fiches, ${products.length * 2} images WebP.`);
