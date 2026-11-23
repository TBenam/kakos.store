import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const assetRoot = path.join(root, 'outputs', 'fresh-week-2026-11-23', 'catalog');
const apply = process.argv.includes('--apply');
const activate = process.argv.includes('--activate');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
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
    slug: 'trio-bijoux-inox-noir-or',
    title: 'Trio bijoux inox — Noir & or',
    category: ['Bijoux & accessoires', 'bijoux-accessoires'],
    supplier: ['Nina Brillance — TikTok', 'tiktok-ninamathilde07', '658297720'],
    sourceId: '7710376251583630612', sourceUrl: 'https://www.tiktok.com/@ninamathilde07/video/7710376251583630612',
    cost: 2750, price: 9000, sellerCommission: 2000, sponsorPool: 500,
    description: "Trois touches fortes, un seul look. Ce coffret assorti réunit trois bijoux en acier inoxydable aux finitions noir et or : bracelet, bague et pièce de main selon l’arrivage. Leur contraste habille immédiatement une tenue de ville comme une sortie. Les modèles exacts peuvent varier, mais l’esprit noir, doré et minimal reste le même. Disponibilité et composition du trio confirmées avant livraison.",
    variants: [{ size: 'Trio', color: 'Noir & or', stock: 20 }],
  },
  {
    slug: 'sandales-tressees-boucle',
    title: 'Sandales tressées à boucle',
    category: ['Chaussures femmes', 'chaussures-femmes'],
    supplier: ['Christ vente en gros — TikTok', 'tiktok-christventeengros', '656430992'],
    sourceId: '7707863805639789825', sourceUrl: 'https://www.tiktok.com/@christventeengros/video/7707863805639789825',
    cost: 1500, price: 6500, sellerCommission: 2000, sponsorPool: 500,
    description: "La paire facile qui finit le look sans effort. Ces sandales plates associent brides tressées, bout carré et grande boucle dorée pour une silhouette nette du matin au soir. Légères et simples à enfiler, elles accompagnent robes, jeans et ensembles. Couleur souhaitée confirmée après la commande selon l’arrivage fournisseur.",
    variants: [37, 38, 39, 40, 41, 42].map((size) => ({ size: String(size), color: 'Assorti', stock: 6 })),
  },
  {
    slug: 'tops-femme-seconde-peau',
    title: 'Top femme seconde peau',
    category: ['T-shirts', 't-shirts'],
    supplier: ['Sun Fashion — TikTok', 'tiktok-sunfashion237', '697983162'],
    sourceId: '7699866317335039233', sourceUrl: 'https://www.tiktok.com/@sunfashion237/video/7699866317335039233',
    cost: 2000, price: 6500, sellerCommission: 2000, sponsorPool: 500,
    description: "Le basique qui change toute une garde-robe. Coupe près du corps, col rond propre et matière extensible : ce top se porte seul, sous une veste ou avec une jupe taille haute. Une pièce nette, confortable et facile à multiplier en plusieurs couleurs. La teinte choisie est confirmée selon le stock du nouvel arrivage.",
    variants: ['S', 'M', 'L', 'XL'].flatMap((size) => ['Jaune', 'Rose', 'Noir', 'Blanc', 'Bleu ciel'].map((color) => ({ size, color, stock: 4 }))),
  },
  {
    slug: 'sacs-structures-anse-spirale',
    title: 'Sac structuré à anse spirale',
    category: ['Sacs à main', 'sacs'],
    supplier: ['Seydou Shop — TikTok', 'tiktok-sai68306', '670936307'],
    sourceId: '7698824691854658837', sourceUrl: 'https://www.tiktok.com/@sai68306/video/7698824691854658837',
    cost: 5000, price: 11000, sellerCommission: 2000, sponsorPool: 500,
    description: "Une silhouette nette qui attire le regard sans crier. Ce sac structuré combine une anse spirale confortable, un rabat graphique et des détails dorés sobres. Son format accompagne le quotidien tout en gardant une allure habillée. Livré selon les coloris disponibles du nouvel arrivage, sans revendication de marque de luxe.",
    variants: ['Noir', 'Vert forêt', 'Fuchsia'].map((color) => ({ size: 'Unique', color, stock: 6 })),
  },
  {
    slug: 'ensemble-enfant-blanc-premium',
    title: 'Ensemble enfant blanc premium',
    category: ['Vêtements enfants', 'vetements-enfants'],
    supplier: ['Donald Gros — TikTok', 'tiktok-vilarione-donal', '678556373'],
    sourceId: '7707934065923509522', sourceUrl: 'https://www.tiktok.com/@vilarione.by.donal/video/7707934065923509522',
    cost: 8000, price: 15000, sellerCommission: 2500, sponsorPool: 500,
    description: "Une tenue claire, moderne et prête pour les grands jours. L’ensemble associe un gilet sans manches boutonné à un pantalon décontracté avec taille souple et poches pratiques. Le blanc intégral donne une allure habillée tout en restant facile à porter pour les fêtes, anniversaires et sorties en famille. Taille confirmée avant livraison.",
    variants: ['6-8 ans', '9-10 ans', '11-12 ans'].map((size) => ({ size, color: 'Blanc', stock: 4 })),
  },
  {
    slug: 'trio-mini-parfums-decouverte',
    title: 'Trio découverte de mini-parfums',
    category: ['Parfums', 'parfums'],
    supplier: ['Issah Parfum Gros — TikTok', 'tiktok-issahparfumgros', '694116513'],
    sourceId: '7708333210647776530', sourceUrl: 'https://www.tiktok.com/@issahparfumgros/video/7708333210647776530',
    cost: 2250, price: 8500, sellerCommission: 2000, sponsorPool: 500,
    description: "Trois senteurs, trois humeurs, un seul coffret découverte. Ce trio de mini-parfums permet d’alterner entre accords frais, floraux et chaleureux sans transporter un grand flacon. Idéal à glisser dans un sac ou à offrir. Les fragrances, formes de flacon et emballages sont assortis et varient selon l’arrivage ; la sélection disponible est confirmée avant livraison.",
    variants: [{ size: 'Trio miniature', color: 'Assorti', stock: 20 }],
  },
  {
    slug: 'trio-parfums-50ml-assortis',
    title: 'Trio de parfums 50 ml assortis',
    category: ['Parfums', 'parfums'],
    supplier: ['Abdelito Afrique — TikTok', 'tiktok-abdelito-afrique', '699012625'],
    sourceId: '7702404717070208277', sourceUrl: 'https://www.tiktok.com/@abdelito.s.afriqu/video/7702404717070208277',
    cost: 975, price: 6000, sellerCommission: 2000, sponsorPool: 500,
    description: "Un trio généreux pour changer de parfum au fil de la semaine. Trois flacons de 50 ml assortis réunissent des profils olfactifs variés à partager, offrir ou garder pour soi. Le contenu exact et le design des flacons dépendent du lot fournisseur : KAKOS confirme les senteurs et les emballages disponibles avant la livraison.",
    variants: [{ size: '3 × 50 ml', color: 'Assorti', stock: 25 }],
  },
];

for (const product of products) {
  const contribution = product.price - product.cost - product.sellerCommission - product.sponsorPool;
  if (contribution < 2000) throw new Error(`Contribution KAKOS trop faible pour ${product.slug}: ${contribution}`);
  for (const image of ['01-principal.webp', '02-detail.webp']) {
    if (!fs.existsSync(path.join(assetRoot, product.slug, image))) throw new Error(`Image manquante: ${product.slug}/${image}`);
  }
}

console.table(products.map((p) => ({
  produit: p.title,
  fournisseur: p.cost,
  vente: p.price,
  vendeur: p.sellerCommission,
  parrainage: p.sponsorPool,
  contributionKakos: p.price - p.cost - p.sellerCommission - p.sponsorPool,
})));

if (!apply) {
  console.log(`Simulation validée. Relancez avec --apply${activate ? ' --activate' : ''} pour écrire dans Supabase.`);
  process.exit(0);
}

loadEnv(path.join(root, '.env.local'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error('Configuration Supabase absente de .env.local');
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

for (const product of products) {
  const [categoryName, categorySlug] = product.category;
  const { data: category, error: categoryError } = await supabase.from('categories')
    .upsert({ name: categoryName, slug: categorySlug }, { onConflict: 'slug' }).select('id').single();
  if (categoryError) throw categoryError;

  const [supplierName, supplierSlug, supplierPhone] = product.supplier;
  const { data: supplier, error: supplierError } = await supabase.from('suppliers')
    .upsert({ name: supplierName, source_slug: supplierSlug, whatsapp_phone: supplierPhone, is_active: true, notes: 'Repéré par le Radar Fresh Week TikTok. Prix et stock à reconfirmer avant exécution de la commande.' }, { onConflict: 'source_slug' })
    .select('id').single();
  if (supplierError) throw supplierError;

  const { data: row, error: productError } = await supabase.from('products').upsert({
    category_id: category.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    supplier_price: product.cost,
    sale_price: product.price,
    is_active: activate,
    is_new: true,
    is_featured: true,
    badge: 'FRESH WEEK',
    promo_price: null,
  }, { onConflict: 'slug' }).select('id').single();
  if (productError) throw productError;

  const { error: variantDeleteError } = await supabase.from('product_variants').delete().eq('product_id', row.id);
  if (variantDeleteError) throw variantDeleteError;
  const { error: variantError } = await supabase.from('product_variants').insert(product.variants.map((variant) => ({ product_id: row.id, ...variant })));
  if (variantError) throw variantError;

  const { error: imageDeleteError } = await supabase.from('product_images').delete().eq('product_id', row.id);
  if (imageDeleteError) throw imageDeleteError;
  for (const [position, image] of ['01-principal.webp', '02-detail.webp'].entries()) {
    const body = fs.readFileSync(path.join(assetRoot, product.slug, image));
    const version = crypto.createHash('sha256').update(body).digest('hex').slice(0, 12);
    const storagePath = `fresh-week/2026-11-23/${product.slug}/${version}-${image}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(storagePath, body, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(storagePath);
    const { error: imageError } = await supabase.from('product_images').insert({ product_id: row.id, url: publicUrl.publicUrl, position });
    if (imageError) throw imageError;
  }

  const { error: linkError } = await supabase.from('supplier_products').upsert({
    supplier_id: supplier.id,
    product_id: row.id,
    source_product_id: product.sourceId,
    supplier_price: product.cost,
    availability: 'TO_CONFIRM',
    last_confirmed_at: null,
    source_metadata: {
      campaign: 'fresh-week-2026-11-23',
      source_url: product.sourceUrl,
      seller_commission_target: product.sellerCommission,
      sponsor_pool_target: product.sponsorPool,
      availability_note: 'Annonce publique récente; confirmation fournisseur requise avant livraison.',
    },
  }, { onConflict: 'supplier_id,source_product_id' });
  if (linkError) throw linkError;

  console.log(`${activate ? 'Activé' : 'Préparé'}: ${product.title}`);
}

console.log(`Fresh Week publiée: ${products.length} fiches, ${products.length * 2} images, statut ${activate ? 'ACTIF' : 'INACTIF'}.`);
