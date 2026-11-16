import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

export function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getBlockingReasons(product) {
  const reasons = [];
  if (!Number(product.supplierPrice)) reasons.push('Coût fournisseur manquant');
  if (!product.pricing?.recommendedRetailPrice) reasons.push('Prix KAKOS manquant');
  if (!Array.isArray(product.media) || product.media.length === 0) reasons.push('Photo produit manquante');
  if (product.splitRequired) reasons.push('Séparer les modèles en fiches individuelles');
  if (product.availability !== 'AVAILABLE') reasons.push('Disponibilité fournisseur à confirmer');
  if (!Array.isArray(product.sizes) || product.sizes.length === 0) reasons.push('Tailles à renseigner');
  if (!Array.isArray(product.colors) || product.colors.length === 0) reasons.push('Couleurs à renseigner');
  return reasons;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function csv(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function readCatalog(catalogRoot) {
  const entries = [];
  for (const supplierDir of fs.readdirSync(catalogRoot)) {
    const supplierPath = path.join(catalogRoot, supplierDir);
    if (!fs.statSync(supplierPath).isDirectory()) continue;
    const draftPath = path.join(supplierPath, 'catalog-draft.json');
    if (!fs.existsSync(draftPath)) continue;
    const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
    for (const product of draft.products || []) {
      entries.push({ supplierDir, supplierPath, product });
    }
  }
  return entries;
}

async function ensureSupplier(supabase, entry) {
  const supplierName = entry.product.supplier || entry.supplierDir;
  const payload = { name: supplierName, source_slug: entry.supplierDir, is_active: true };
  const { data, error } = await supabase.from('suppliers').upsert(payload, { onConflict: 'source_slug' }).select('id').single();
  if (error) throw new Error(`Fournisseur ${supplierName}: ${error.message}`);
  return data.id;
}

async function syncCandidate(supabase, entry, supplierId) {
  const blockers = getBlockingReasons(entry.product);
  const candidatePayload = {
    supplier_id: supplierId,
    source_product_id: entry.product.id,
    title: entry.product.title,
    category: entry.product.category || null,
    supplier_price: entry.product.supplierPrice || null,
    recommended_retail_price: entry.product.pricing?.recommendedRetailPrice || null,
    media_count: entry.product.media?.length || 0,
    availability: entry.product.availability || 'TO_CONFIRM',
    split_required: Boolean(entry.product.splitRequired),
    blocking_reasons: blockers,
    source_fingerprint: entry.product.fingerprint || null,
    source_payload: entry.product,
  };

  const { data: existing } = await supabase
    .from('catalog_candidates').select('id, review_status, publish_requested, blocking_reasons, source_payload')
    .eq('supplier_id', supplierId).eq('source_product_id', entry.product.id).maybeSingle();

  if (existing) {
    if (existing.review_status === 'APPROVED' || existing.review_status === 'PUBLISHED') {
      return { ...existing, blockers: existing.blocking_reasons || [] };
    }
    const { error } = await supabase.from('catalog_candidates').update(candidatePayload).eq('id', existing.id);
    if (error) throw new Error(`Candidat ${entry.product.id}: ${error.message}`);
    return { ...existing, source_payload: entry.product, blockers };
  }

  const { data, error } = await supabase.from('catalog_candidates').insert({
    ...candidatePayload,
    review_status: 'REVIEW_REQUIRED',
    publish_requested: false,
  }).select('id, review_status, publish_requested').single();
  if (error) throw new Error(`Candidat ${entry.product.id}: ${error.message}`);
  return { ...data, blockers };
}

async function publishProduct(supabase, entry, supplierId, candidateId, maxImages) {
  const product = entry.product;
  const categorySlug = slugify(product.category);
  const productSlug = `${slugify(product.title)}-${entry.supplierDir}-${product.id}`;

  const { data: category, error: categoryError } = await supabase
    .from('categories').upsert({ name: product.category, slug: categorySlug }, { onConflict: 'slug' }).select('id').single();
  if (categoryError) throw new Error(`Catégorie ${product.category}: ${categoryError.message}`);

  const { data: productRow, error: productError } = await supabase.from('products').upsert({
    category_id: category.id,
    title: product.title,
    slug: productSlug,
    description: product.description || '',
    supplier_price: product.supplierPrice,
    sale_price: product.pricing.recommendedRetailPrice,
    is_active: true,
  }, { onConflict: 'slug' }).select('id').single();
  if (productError) throw new Error(`Produit ${product.id}: ${productError.message}`);

  await supabase.from('product_variants').delete().eq('product_id', productRow.id);
  const variantStock = Number(product.stockPerVariant || 1);
  const variants = product.sizes.flatMap((size) => product.colors.map((color) => ({
    product_id: productRow.id, size, color, stock: variantStock,
  })));
  const { error: variantsError } = await supabase.from('product_variants').insert(variants);
  if (variantsError) throw new Error(`Variantes ${product.id}: ${variantsError.message}`);

  await supabase.from('product_images').delete().eq('product_id', productRow.id);
  const media = product.media.slice(0, maxImages);
  for (let index = 0; index < media.length; index += 1) {
    const fileName = media[index];
    const localPath = path.join(entry.supplierPath, 'products', product.id, fileName);
    if (!fs.existsSync(localPath)) throw new Error(`Image introuvable: ${localPath}`);
    const storagePath = `whatsapp/${entry.supplierDir}/${product.id}/${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const extension = path.extname(fileName).toLowerCase();
    const contentType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
    const { error: uploadError } = await supabase.storage.from('products').upload(storagePath, fs.readFileSync(localPath), { contentType, upsert: true });
    if (uploadError) throw new Error(`Upload ${fileName}: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(storagePath);
    const { error: imageError } = await supabase.from('product_images').insert({ product_id: productRow.id, url: urlData.publicUrl, position: index });
    if (imageError) throw new Error(`Image DB ${fileName}: ${imageError.message}`);
  }

  const { error: supplierProductError } = await supabase.from('supplier_products').upsert({
    supplier_id: supplierId,
    product_id: productRow.id,
    source_product_id: product.id,
    supplier_price: product.supplierPrice,
    availability: product.availability,
    last_confirmed_at: new Date().toISOString(),
    source_fingerprint: product.fingerprint || null,
    source_metadata: { pricing: product.pricing, source: product.source },
  }, { onConflict: 'supplier_id,source_product_id' });
  if (supplierProductError) throw new Error(`Lien fournisseur ${product.id}: ${supplierProductError.message}`);

  const { error: candidateError } = await supabase.from('catalog_candidates').update({
    review_status: 'PUBLISHED', published_product_id: productRow.id, published_at: new Date().toISOString(),
  }).eq('id', candidateId);
  if (candidateError) throw new Error(`Publication candidat ${product.id}: ${candidateError.message}`);
  return productRow.id;
}

async function main() {
  loadEnvFile(path.join(repoRoot, '.env.local'));
  const args = process.argv.slice(2);
  const catalogRootInput = argValue(args, '--root') || process.env.KAKOS_CATALOG_ROOT;
  const apply = args.includes('--apply');
  const approveAll = args.includes('--approve-all');
  const publishApproved = args.includes('--publish-approved');
  const maxImages = Number(argValue(args, '--max-images') || 8);

  if (!catalogRootInput) {
    throw new Error('Catalogue manquant. Utilisez --root <dossier-kakos-catalogue-final-a-valider>.');
  }

  const catalogRoot = path.resolve(catalogRootInput);
  if (!fs.existsSync(catalogRoot)) {
    throw new Error('Catalogue introuvable. Utilisez --root <dossier-kakos-catalogue-final-a-valider>.');
  }

  const entries = readCatalog(catalogRoot);
  const readinessRows = entries.map((entry) => ({
    supplier: entry.product.supplier,
    id: entry.product.id,
    title: entry.product.title,
    blockers: getBlockingReasons(entry.product),
  }));
  const csvRows = [['supplier', 'id', 'title', 'ready', 'blocking_reasons'].map(csv).join(',')];
  for (const row of readinessRows) csvRows.push([row.supplier, row.id, row.title, row.blockers.length === 0, row.blockers.join(' | ')].map(csv).join(','));
  fs.writeFileSync(path.join(catalogRoot, 'catalog-publication-readiness.csv'), `\uFEFF${csvRows.join('\n')}\n`, 'utf8');

  console.log(`Catalogue analysé: ${entries.length} fiches.`);
  console.log(`Prêtes techniquement: ${readinessRows.filter((row) => row.blockers.length === 0).length}.`);
  console.log(`Bloquées pour validation: ${readinessRows.filter((row) => row.blockers.length > 0).length}.`);

  if (!apply) {
    console.log('Simulation terminée. Ajoutez --apply après configuration de SUPABASE_SECRET_KEY.');
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquante dans .env.local.');
  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  let published = 0;
  for (const entry of entries) {
    const supplierId = await ensureSupplier(supabase, entry);
    let candidate = await syncCandidate(supabase, entry, supplierId);
    if (approveAll && candidate.blockers.length === 0 && candidate.review_status !== 'PUBLISHED') {
      const { error: approvalError } = await supabase.from('catalog_candidates').update({
        review_status: 'APPROVED',
        publish_requested: true,
        reviewed_at: new Date().toISOString(),
      }).eq('id', candidate.id);
      if (approvalError) throw new Error(`Validation candidat ${entry.product.id}: ${approvalError.message}`);
      candidate = { ...candidate, review_status: 'APPROVED', publish_requested: true };
    }
    if (publishApproved && candidate.review_status === 'APPROVED' && candidate.publish_requested && candidate.blockers.length === 0) {
      const reviewedEntry = { ...entry, product: candidate.source_payload || entry.product };
      await publishProduct(supabase, reviewedEntry, supplierId, candidate.id, maxImages);
      published += 1;
    }
  }
  console.log(`Synchronisation terminée. Produits publiés: ${published}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

