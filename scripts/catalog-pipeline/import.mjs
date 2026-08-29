import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to slugify strings
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, '');       // remove leading/trailing hyphens
}

// Load env variables manually from .env.local
function loadEnv() {
  // We look in the root folder (two levels up from scripts/catalog-pipeline)
  const envPath = path.resolve(path.join(__dirname, '../../.env.local'));
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let val = trimmed.slice(equalsIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}

// Load env vars
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log(`\n\x1b[1m=== KAKOS CATALOG IMPORT PIPELINE ===\x1b[0m`);
  console.log(`Mode: ${isDryRun ? '\x1b[33mDRY-RUN (Simulation)\x1b[0m' : '\x1b[32mREAL IMPORT\x1b[0m'}`);
  
  let supabase = null;
  if (!isDryRun) {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error(`\x1b[31mError: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local for real import.\x1b[0m`);
      console.log(`Please restore your Supabase project and provide the service role key, or run with --dry-run.`);
      process.exit(1);
    }
    supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  }

  // Scan products in ../../images
  const catalogDir = path.resolve(path.join(__dirname, '../../images'));
  if (!fs.existsSync(catalogDir)) {
    console.error(`\x1b[31mError: Catalog directory not found at ${catalogDir}\x1b[0m`);
    process.exit(1);
  }

  const items = fs.readdirSync(catalogDir);
  const productDirs = items.filter(item => {
    const fullPath = path.join(catalogDir, item);
    return fs.statSync(fullPath).isDirectory();
  }).sort();

  console.log(`Found ${productDirs.length} folders in catalog.\n`);

  const report = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  for (const dirName of productDirs) {
    const productPath = path.join(catalogDir, dirName);
    const jsonPath = path.join(productPath, 'product.json');

    if (!fs.existsSync(jsonPath)) {
      report.skipped++;
      console.log(`- \x1b[90mSkipped '${dirName}': No product.json found\x1b[0m`);
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      report.failed++;
      report.errors.push({ product: dirName, error: `Invalid JSON format: ${e.message}` });
      console.log(`- \x1b[31mFailed '${dirName}': Invalid product.json\x1b[0m`);
      continue;
    }

    // Check status
    if (data.status !== 'APPROVED') {
      report.skipped++;
      console.log(`- \x1b[90mSkipped '${dirName}': Status is '${data.status || 'DRAFT'}' (only APPROVED can be imported)\x1b[0m`);
      continue;
    }

    // Validation
    const validationErrors = validateProductSchema(data, productPath);
    if (validationErrors.length > 0) {
      report.failed++;
      report.errors.push({ product: dirName, error: `Schema validation failed: ${validationErrors.join(', ')}` });
      console.log(`- \x1b[31mFailed '${dirName}': Schema validation failed\x1b[0m`);
      continue;
    }

    // Process import
    try {
      console.log(`Processing \x1b[36m'${data.name}'\x1b[0m...`);
      const result = await importProduct(supabase, data, productPath, isDryRun);
      if (result.type === 'create') {
        report.imported++;
        console.log(`  \x1b[32m✔ Imported successfully as new product (Slug: ${result.slug})\x1b[0m`);
      } else {
        report.updated++;
        console.log(`  \x1b[32m✔ Updated successfully (Slug: ${result.slug})\x1b[0m`);
      }
    } catch (err) {
      report.failed++;
      report.errors.push({ product: data.name || dirName, error: err.message });
      console.log(`  \x1b[31m✘ Failed: ${err.message}\x1b[0m`);
    }
  }

  // Print Report
  console.log(`\n\x1b[1m=== IMPORT REPORT ===\x1b[0m`);
  console.log(`Imported: \x1b[32m${report.imported}\x1b[0m`);
  console.log(`Updated:  \x1b[36m${report.updated}\x1b[0m`);
  console.log(`Skipped:  \x1b[90m${report.skipped}\x1b[0m`);
  console.log(`Failed:   \x1b[31m${report.failed}\x1b[0m`);
  
  if (report.errors.length > 0) {
    console.log(`\n\x1b[31mErrors (${report.errors.length}):\x1b[0m`);
    report.errors.forEach(e => {
      console.log(`  - \x1b[31m[${e.product}]\x1b[0m ${e.error}`);
    });
  }
}

function validateProductSchema(data, folderPath) {
  const errors = [];
  if (!data.name || typeof data.name !== 'string') errors.push("Missing or invalid name");
  if (!data.category || typeof data.category !== 'string') errors.push("Missing or invalid category");
  if (typeof data.supplierPrice !== 'number' || data.supplierPrice < 0) errors.push("Invalid supplierPrice");
  if (typeof data.salePrice !== 'number' || data.salePrice < 0) errors.push("Invalid salePrice");
  if (!Array.isArray(data.images) || data.images.length === 0) errors.push("Missing or empty images array");
  if (!Array.isArray(data.variants) || data.variants.length === 0) errors.push("Missing or empty variants array");

  // Validate image file existence
  if (Array.isArray(data.images)) {
    data.images.forEach(img => {
      const imgPath = path.join(folderPath, img);
      if (!fs.existsSync(imgPath)) {
        errors.push(`Declared image file not found: '${img}'`);
      }
    });
  }

  return errors;
}

async function importProduct(supabase, data, folderPath, isDryRun) {
  const categorySlug = slugify(data.category);
  const productSlug = slugify(data.name);

  if (isDryRun) {
    // Simulating imports without database connection
    console.log(`    [Dry-run] Would ensure category: "${data.category}" (slug: ${categorySlug})`);
    console.log(`    [Dry-run] Would upsert product: "${data.name}" (slug: ${productSlug})`);
    console.log(`    [Dry-run] Would sync ${data.variants.length} variants`);
    console.log(`    [Dry-run] Would upload ${data.images.length} images to Supabase Storage products bucket`);
    return { type: 'create', slug: productSlug };
  }

  // 1. Ensure category exists
  let categoryId = null;
  const { data: categoryRow, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (catError) throw new Error(`Category check failed: ${catError.message}`);

  if (categoryRow) {
    categoryId = categoryRow.id;
  } else {
    const { data: newCat, error: insertCatError } = await supabase
      .from('categories')
      .insert({ name: data.category, slug: categorySlug })
      .select('id')
      .single();

    if (insertCatError) throw new Error(`Category creation failed: ${insertCatError.message}`);
    categoryId = newCat.id;
  }

  // 2. Ensure product exists
  let productId = null;
  let importType = 'create';
  
  const { data: productRow, error: prodError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', productSlug)
    .maybeSingle();

  if (prodError) throw new Error(`Product check failed: ${prodError.message}`);

  const productPayload = {
    title: data.name,
    slug: productSlug,
    description: data.description || '',
    supplier_price: data.supplierPrice,
    sale_price: data.salePrice,
    category_id: categoryId,
    is_active: true
  };

  if (productRow) {
    productId = productRow.id;
    importType = 'update';
    const { error: updateError } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', productId);

    if (updateError) throw new Error(`Product update failed: ${updateError.message}`);
  } else {
    const { data: newProd, error: insertError } = await supabase
      .from('products')
      .insert(productPayload)
      .select('id')
      .single();

    if (insertError) throw new Error(`Product creation failed: ${insertError.message}`);
    productId = newProd.id;
  }

  // 3. Import Variants
  // Delete all existing variants to avoid stale records, then insert new ones
  const { error: deleteVariantsError } = await supabase
    .from('product_variants')
    .delete()
    .eq('product_id', productId);

  if (deleteVariantsError) throw new Error(`Failed to clean old variants: ${deleteVariantsError.message}`);

  const variantInserts = data.variants.map(v => ({
    product_id: productId,
    size: v.size,
    color: v.color,
    stock: v.stock
  }));

  const { error: insertVariantsError } = await supabase
    .from('product_variants')
    .insert(variantInserts);

  if (insertVariantsError) throw new Error(`Failed to insert variants: ${insertVariantsError.message}`);

  // 4. Import Images and Upload to Storage
  // Delete existing image records in DB
  const { error: deleteImagesError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (deleteImagesError) throw new Error(`Failed to clean old image records: ${deleteImagesError.message}`);

  for (let idx = 0; idx < data.images.length; idx++) {
    const fileName = data.images[idx];
    const localFilePath = path.join(folderPath, fileName);
    const fileBuffer = fs.readFileSync(localFilePath);
    
    // Determine content type
    let contentType = 'image/jpeg';
    if (fileName.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (fileName.toLowerCase().endsWith('.webp')) contentType = 'image/webp';
    else if (fileName.toLowerCase().endsWith('.avif')) contentType = 'image/avif';

    // Storage path: products/[product_slug]/[fileName]
    const storagePath = `products/${productSlug}/${fileName}`;

    // Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) throw new Error(`Failed to upload image ${fileName}: ${uploadError.message}`);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error(`Failed to get public URL for image ${fileName}`);
    }

    // Insert into DB
    const { error: insertImageError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrlData.publicUrl,
        position: idx
      });

    if (insertImageError) throw new Error(`Failed to register image ${fileName} in DB: ${insertImageError.message}`);
  }

  return { type: importType, slug: productSlug };
}

main();
