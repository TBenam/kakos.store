import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const catalogRoot = process.argv[2];
if (!catalogRoot || !fs.existsSync(catalogRoot)) {
  throw new Error('Indiquez le dossier du catalogue à préparer.');
}

const titleOverrides = {
  'super-gros-carton/wa-0002': 'Sacs à main élégants – Collection festive',
  'super-gros-carton/wa-0008': 'Mocassins premium – Collection urbaine',
  'super-gros-carton/wa-0009': 'Sandales multicolores – Série élégance',
  'super-gros-carton/wa-0010': 'Chaussures femme – Série limitée',
  'super-gros-carton/wa-0011': 'Baskets famille – Enfants et adultes',
  'super-gros-carton/wa-0012': 'Chaussures tendance – Nouvel arrivage',
  'super-gros-carton/wa-0013': 'Talons femme style Mango',
  'super-gros-carton/wa-0014': 'Babouches femme style Aquazzura',
  'super-gros-carton/wa-0015': 'Baskets enfants style New Balance',
  'watt-international/wa-0001': 'Chaussures style Zara – Deux couleurs',
  'watt-international/wa-0002': 'Baskets style Samba – Collection classique',
  'watt-international/wa-0003': 'Talons femme élégants – Collection 1',
  'watt-international/wa-0004': 'Chaussures femme style EGO',
  'watt-international/wa-0005': 'Talons femme élégants – Collection 2',
  'watt-international/wa-0006': 'Talons femme premium – Collection 3',
  'watt-international/wa-0007': 'Chaussures femme tendance – Collection 1',
  'watt-international/wa-0008': 'Chaussures femme tendance – Collection 2',
  'watt-international/wa-0009': 'Chaussures femme tendance – Collection 3',
  'watt-international/wa-0010': 'Chaussures style Zara – Collection 2',
  'watt-international/wa-0011': 'Chaussures tendance – Série limitée 1',
  'watt-international/wa-0012': 'Chaussures tendance – Collection Faya',
  'watt-international/wa-0013': 'Chaussures urbaines – Modèle classique',
  'watt-international/wa-0014': 'Chaussures tendance – Série limitée 2',
  'watt-international/wa-0015': 'Mocassins style Loro Piana',
  'watt-international/wa-0016': 'Chaussures style Zara – Collection 3',
  'watt-international/wa-0017': 'Chaussures tendance – Série limitée 3',
  'watt-international/wa-0018': 'Chaussures tendance – Collection boutique',
  'watt-international/wa-0019': 'Chaussures premium – Collection 4',
  'watt-international/wa-0020': 'Chaussures urbaines – Collection 5',
  'watt-international/wa-0021': 'Chaussures style Zara – Collection 6',
  'watt-international/wa-0022': 'Chaussures style Zara – Collection 7',
  'watt-international/wa-0023': 'Baskets enfants style Puma',
  'watt-international/wa-0024': 'Baskets enfants style Samba',
  'watt-international/wa-0025': 'Chaussures enfants – Collection 31–36',
  'watt-international/wa-0026': 'Chaussures femme – Collection 37–42',
  'watt-international/wa-0027': 'Chaussures femme – Nouvelle collection',
  'grossiste-longueur/wa-0127': 'Ensemble streetwear – T-shirt et jean',
};

const priceDefaults = {
  'Lot mixte': [3500, 7000],
  Jeans: [4500, 8500],
  Pantalons: [4000, 8000],
  Shorts: [2500, 5000],
  'Chaussures enfants': [4500, 8500],
  Chaussures: [4500, 8500],
  'Chaussures femmes': [4500, 8500],
};

function normalizedCategory(product, supplierDir) {
  if (product.id === 'wa-0015' && supplierDir === 'super-gros-carton') return 'Chaussures enfants';
  if (supplierDir === 'watt-international' && ['wa-0023', 'wa-0024', 'wa-0025'].includes(product.id)) return 'Chaussures enfants';
  if (product.category === 'Chaussures' && /femme|talon|babouche/i.test(titleOverrides[`${supplierDir}/${product.id}`] || product.title)) return 'Chaussures femmes';
  return product.category || 'Nouveautés';
}

function sizesFor(product, supplierDir) {
  const key = `${supplierDir}/${product.id}`;
  if (key === 'super-gros-carton/wa-0015') return ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'];
  if (key === 'super-gros-carton/wa-0011') return ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];
  if (key === 'watt-international/wa-0023' || key === 'watt-international/wa-0025') return ['31', '32', '33', '34', '35', '36'];
  if (key === 'watt-international/wa-0024') return ['25', '26', '27', '28', '29', '30'];
  if (product.category === 'Sacs') return ['Unique'];
  if (['T-shirts', 'Maillots'].includes(product.category)) return ['S', 'M', 'L', 'XL', 'XXL'];
  if (['Jeans', 'Pantalons', 'Shorts', 'Lot mixte'].includes(product.category)) return ['28', '30', '32', '34', '36', '38'];
  return ['37', '38', '39', '40', '41', '42'];
}

function chooseMedia(media, limit = 8) {
  if (media.length <= limit) return media;
  const selected = [];
  for (let index = 0; index < limit; index += 1) {
    selected.push(media[Math.round(index * (media.length - 1) / (limit - 1))]);
  }
  return [...new Set(selected)];
}

function escapeXml(value) {
  return String(value).replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}

async function normalizeImage(sourcePath, destinationPath, title) {
  const label = escapeXml(title.length > 55 ? `${title.slice(0, 52)}…` : title);
  const branding = Buffer.from(`
    <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="1390" width="1200" height="110" fill="#171713" fill-opacity="0.94"/>
      <rect x="52" y="1417" width="5" height="56" fill="#D9A441"/>
      <text x="82" y="1445" fill="#F7F2E8" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="5">KAKOS</text>
      <text x="82" y="1474" fill="#CFC8BA" font-family="Arial, sans-serif" font-size="18">${label}</text>
    </svg>
  `);

  await sharp(sourcePath)
    .rotate()
    .resize({ width: 1200, height: 1500, fit: 'contain', background: '#F3EFE7' })
    .composite([{ input: branding, top: 0, left: 0 }])
    .webp({ quality: 84, effort: 4 })
    .toFile(destinationPath);
}

let productCount = 0;
let imageCount = 0;
for (const supplierDir of fs.readdirSync(catalogRoot)) {
  const supplierPath = path.join(catalogRoot, supplierDir);
  const draftPath = path.join(supplierPath, 'catalog-draft.json');
  if (!fs.existsSync(draftPath)) continue;

  const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  const backupPath = path.join(supplierPath, 'catalog-draft.before-publication.json');
  if (!fs.existsSync(backupPath)) fs.copyFileSync(draftPath, backupPath);

  for (const product of draft.products || []) {
    const key = `${supplierDir}/${product.id}`;
    product.title = titleOverrides[key] || product.title.replace(/[👇🔥❤️🥰😍😘⚠👍👌🏃🏽‍♂️🏃🏽‍♂]+/gu, '').replace(/\s+/g, ' ').trim();
    product.category = normalizedCategory(product, supplierDir);
    const [defaultCost, defaultRetail] = priceDefaults[product.category] || [product.supplierPrice || 3500, product.pricing?.recommendedRetailPrice || 7000];
    product.supplierPrice = Number(product.supplierPrice || defaultCost);
    product.pricing = {
      ...(product.pricing || {}),
      recommendedRetailPrice: Number(product.pricing?.recommendedRetailPrice || defaultRetail),
      currency: 'XAF',
      strategy: 'Marge KAKOS avec commission affilié et réserve opérationnelle',
    };
    product.availability = 'AVAILABLE';
    product.splitRequired = false;
    product.sizes = sizesFor(product, supplierDir);
    product.colors = ['Assorti'];
    product.stockPerVariant = 3;
    product.publish = false;
    product.status = 'REVIEW_REQUIRED';
    product.visualReviewPassed = false;
    product.description = `${product.title}. Sélection KAKOS issue de notre réseau de fournisseurs partenaires au Cameroun. Prix affiché à l’unité. Choisissez votre taille; la couleur ou le modèle exact est confirmé avec vous sur WhatsApp avant expédition. Paiement à la livraison selon la zone.`;

    const originalMedia = chooseMedia((product.media || []).filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName)));
    const normalizedDir = path.join(supplierPath, 'products', product.id, 'kakos-media');
    fs.mkdirSync(normalizedDir, { recursive: true });
    const normalizedMedia = [];
    for (let index = 0; index < originalMedia.length; index += 1) {
      const sourcePath = path.join(supplierPath, 'products', product.id, originalMedia[index]);
      if (!fs.existsSync(sourcePath)) continue;
      const relativePath = `kakos-media/${String(index + 1).padStart(2, '0')}.webp`;
      await normalizeImage(sourcePath, path.join(supplierPath, 'products', product.id, relativePath), product.title);
      normalizedMedia.push(relativePath);
      imageCount += 1;
    }
    product.media = normalizedMedia;
    productCount += 1;
  }

  fs.writeFileSync(draftPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
}

console.log(`Produits préparés: ${productCount}`);
console.log(`Images KAKOS créées: ${imageCount}`);
