import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const assetRoot = path.join(root, 'outputs', 'fournisseur-yaounde', 'perfumes-web');
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
    slug: 'smart-collection-387-100ml', title: 'Smart Collection Nº 387 — 100 ml', cost: 2000, price: 5500,
    affiliate: false, commission: 0, sources: [46, 47],
    sourcePage: 'https://bagallery.com/products/smart-collection-no-387-la-vie-est-belle-100ml',
    description: "Une senteur féminine florale et gourmande dans un grand format accessible. Smart Collection Nº 387 associe des accents fruités, floraux et vanillés pour une signature douce mais présente. Flacon de 100 ml ; disponibilité confirmée au magasin avant livraison.",
    variants: [{ size: '100 ml', color: 'Nº 387', stock: 10 }],
  },
  {
    slug: 'smart-collection-boss-orange-332-100ml', title: 'Smart Collection Boss Orange Nº 332 — 100 ml', cost: 2000, price: 5500,
    affiliate: false, commission: 0, sources: [46, 47],
    sourcePage: 'https://vafypharmacy.com/products/smart-perfume-boss-orange',
    description: "Un parfum masculin chaleureux et facile à porter, avec un profil fruité, boisé et légèrement épicé. Le Nº 332 convient au bureau comme aux sorties sans être trop lourd. Flacon de 100 ml ; stock confirmé avant livraison.",
    variants: [{ size: '100 ml', color: 'Nº 332', stock: 10 }],
  },
  {
    slug: 'aventos-blue-for-him-100ml', title: 'Aventos Blue For Him — 100 ml', cost: 2000, price: 6500,
    affiliate: false, commission: 0, sources: [46, 47],
    sourcePage: 'https://perfumeheaven.co.uk/products/aventos-blue-for-him-eau-de-parfum-100ml-fragrance-world',
    description: "Une eau de parfum masculine fraîche et affirmée. Aventos Blue mêle une ouverture fruitée et citronnée à un fond boisé, ambré et vanillé. Son flacon bleu et or en fait aussi un cadeau qui présente bien. Format 100 ml.",
    variants: [{ size: '100 ml', color: 'Bleu', stock: 10 }],
  },
  {
    slug: 'emaan-eau-de-parfum-100ml', title: 'Emaan Eau de Parfum — 100 ml', cost: 6000, price: 12500,
    affiliate: true, commission: 2500, sources: [38],
    sourcePage: 'https://silkperfumes.cl/products/lattafa-emaan-edp-100-ml',
    description: "Emaan compose un sillage floral élégant autour des agrumes, des fleurs blanches, de la vanille et des bois. Son flacon bleu profond aux détails dorés en fait une belle idée cadeau. Eau de parfum 100 ml ; référence exacte contrôlée avant expédition.",
    variants: [{ size: '100 ml', color: 'Bleu', stock: 6 }],
  },
  {
    slug: 'sakeena-eau-de-parfum-100ml', title: 'Sakeena Eau de Parfum — 100 ml', cost: 6000, price: 12500,
    affiliate: true, commission: 2500, sources: [38],
    sourcePage: 'https://www.shop-apotheke.at/beauty/upmGTZ7EX/mystical-eau-de-parfum-sakeenaa.htm',
    description: "Une fragrance féminine fruitée, florale et gourmande, présentée dans un flacon rouge et or remarquable. Sakeena évolue vers un fond doux de vanille, musc et accords pralinés. Format 100 ml avec présentation cadeau.",
    variants: [{ size: '100 ml', color: 'Rouge', stock: 6 }],
  },
  {
    slug: 'trio-smart-collection-15ml', title: 'Trio Smart Collection — 3 × 15 ml', cost: 1500, price: 5000,
    affiliate: false, commission: 0, sources: [45],
    sourcePage: 'https://hollaenteprise.com.ng/products/15ml-smart-collection-perfume/2063967',
    description: "Trois mini-parfums de 15 ml à choisir parmi les senteurs disponibles. Le format compact permet de varier les parfums, de les garder dans un sac ou de composer un petit cadeau. Les trois numéros sont confirmés en photo avant livraison.",
    variants: [{ size: '3 × 15 ml', color: 'Assorti', stock: 15 }],
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
    try {
      return await nativeFetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}
const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithRetry },
});

const { data: category, error: categoryError } = await supabase.from('categories').upsert({ name: 'Parfums & brumes', slug: 'parfums-brumes' }, { onConflict: 'slug' }).select('id').single();
if (categoryError) throw categoryError;
const { data: supplier, error: supplierError } = await supabase.from('suppliers').upsert({
  name: 'Fournisseur local Yaoundé — magasin', source_slug: 'fournisseur-local-yaounde', whatsapp_phone: null, is_active: true,
  notes: 'Magasin physique visité à Yaoundé. Achat possible pièce par pièce. Stock et authenticité de la référence à contrôler avant encaissement.',
}, { onConflict: 'source_slug' }).select('id').single();
if (supplierError) throw supplierError;

for (const product of products) {
  const { data: row, error: productError } = await supabase.from('products').upsert({
    category_id: category.id, title: product.title, slug: product.slug, description: product.description,
    supplier_price: product.cost, sale_price: product.price, promo_price: null, badge: 'PARFUMS YAOUNDÉ',
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
    const storagePath = `yaounde/perfumes/${product.slug}/${version}-${image}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(storagePath, body, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(storagePath);
    const { error: imageError } = await supabase.from('product_images').insert({ product_id: row.id, url: publicUrl.publicUrl, position });
    if (imageError) throw imageError;
  }
  const { error: linkError } = await supabase.from('supplier_products').upsert({
    supplier_id: supplier.id, product_id: row.id, source_product_id: `yaounde-perfume-${product.slug}`,
    supplier_price: product.cost, availability: 'TO_CONFIRM', last_confirmed_at: null,
    source_metadata: { campaign: 'parfums-yaounde-2026-11-23', source_photo_indices: product.sources, clean_packshot_source: product.sourcePage, sales_channel: product.affiliate ? 'AFFILIATE' : 'DIRECT', seller_commission_target: product.commission },
  }, { onConflict: 'supplier_id,source_product_id' });
  if (linkError) throw linkError;
  console.log(`${activate ? 'Activé' : 'Préparé'}: ${product.title}`);
}

console.log(`Sélection parfums publiée: ${products.length} fiches, ${products.length * 2} images WebP.`);
