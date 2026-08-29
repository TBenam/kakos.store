import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(path.join(__dirname, '../../.env.local'));
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  console.log('--- CATEGORIES ---');
  console.table(cats);

  const { data: prods, error: prodErr } = await supabase.from('products').select(`
    id,
    title,
    slug,
    category_id,
    is_active,
    sale_price,
    categories (name, slug),
    product_images (url, position)
  `);
  
  console.log('--- PRODUCTS IN DB ---');
  const formatted = prods.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.categories?.name,
    catSlug: p.categories?.slug,
    salePrice: p.sale_price,
    isActive: p.is_active,
    imageCount: p.product_images?.length || 0,
    firstImage: p.product_images?.[0]?.url || 'NONE'
  }));
  console.table(formatted);

  // Check which products folders exist on disk in images/
  const imgDir = path.resolve(path.join(__dirname, '../../images'));
  const dirs = fs.readdirSync(imgDir).filter(d => fs.statSync(path.join(imgDir, d)).isDirectory());
  console.log('--- LOCAL FOLDERS in images/ ---');
  for (const d of dirs) {
    const p = path.join(imgDir, d, 'product.json');
    const hasJson = fs.existsSync(p);
    let status = 'NO JSON';
    let cat = '';
    let name = '';
    if (hasJson) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      status = data.status;
      cat = data.category;
      name = data.name;
    }
    console.log(`[${status}] Folder: "${d}" | Name: "${name}" | Category: "${cat}"`);
  }
}

main().catch(console.error);
