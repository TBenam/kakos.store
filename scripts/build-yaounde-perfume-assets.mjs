import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.join(root, 'outputs', 'fournisseur-yaounde', 'perfumes-web');

const products = [
  {
    slug: 'smart-collection-387-100ml',
    title: 'SMART COLLECTION 387',
    sourceUrl: 'https://bagallery.com/cdn/shop/products/17-2-scaled.jpg?v=1680518875',
    sourcePage: 'https://bagallery.com/products/smart-collection-no-387-la-vie-est-belle-100ml',
  },
  {
    slug: 'smart-collection-boss-orange-332-100ml',
    title: 'BOSS ORANGE 332',
    sourceUrl: 'https://vafypharmacy.com/cdn/shop/files/UU.webp?v=1713465652&width=1445',
    sourcePage: 'https://vafypharmacy.com/products/smart-perfume-boss-orange',
  },
  {
    slug: 'aventos-blue-for-him-100ml',
    title: 'AVENTOS BLUE FOR HIM',
    sourceUrl: 'https://perfumeheaven.co.uk/cdn/shop/files/Untitleddesign_10_81d6ff32-db8c-4e87-adf1-ef0526cd36ed_1.png?v=1761377677&width=1080',
    sourcePage: 'https://perfumeheaven.co.uk/products/aventos-blue-for-him-eau-de-parfum-100ml-fragrance-world',
  },
  {
    slug: 'emaan-eau-de-parfum-100ml',
    title: 'EMAAN 100 ML',
    sourceUrl: 'https://silkperfumes.cl/cdn/shop/files/lattafa-emaan-edp-100-ml-silk-perfumes.png?crop=center&height=1000&v=1784064074&width=1000',
    sourcePage: 'https://silkperfumes.cl/products/lattafa-emaan-edp-100-ml',
  },
  {
    slug: 'sakeena-eau-de-parfum-100ml',
    title: 'SAKEENA 100 ML',
    sourceUrl: 'https://cdn.shop-apotheke.at/images/mp/prod/c96b69011dc841dca2774cb95405b341',
    sourcePage: 'https://www.shop-apotheke.at/beauty/upmGTZ7EX/mystical-eau-de-parfum-sakeenaa.htm',
  },
  {
    slug: 'trio-smart-collection-15ml',
    title: 'TRIO SMART 15 ML',
    sourceUrl: 'https://dodptt9f4zk9h.cloudfront.net/stores/194829/products/1adef01420000c4317e0aca87b0c4239c1f5855e.jpeg',
    sourcePage: 'https://hollaenteprise.com.ng/products/15ml-smart-collection-perfume/2063967',
  },
];

const width = 1200;
const height = 1500;

async function download(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(25000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KAKOSCatalog/1.0)',
          Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw new Error(`Téléchargement impossible: ${url}`, { cause: lastError });
}

function frameSvg(title, detail) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1500" fill="none" stroke="#0A0A0A" stroke-width="12"/>
    <rect x="0" y="0" width="1200" height="145" fill="#0A0A0A"/>
    <rect x="0" y="1320" width="1200" height="180" fill="#0A0A0A"/>
    <rect x="0" y="0" width="12" height="1500" fill="#59E1ED"/>
    <text x="54" y="88" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="#59E1ED">PARFUMS • NOUVEL ARRIVAGE YAOUNDÉ</text>
    <text x="54" y="1382" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#D6AE55">${detail ? 'DÉTAIL PRODUIT' : 'PACKSHOT PRODUIT'}</text>
    <text x="54" y="1442" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF">KAKOS</text>
    <text x="1146" y="1438" font-family="Arial, sans-serif" font-size="24" font-weight="800" text-anchor="end" fill="#FFFFFF">${title}</text>
  </svg>`);
}

async function render(product, source, detail) {
  const directory = path.join(outputRoot, product.slug);
  fs.mkdirSync(directory, { recursive: true });
  const background = detail ? '#DDEDF0' : '#F4F0E8';
  const productImage = await sharp(source)
    .rotate()
    .trim({ background: '#ffffff', threshold: 10 })
    .resize(detail ? 930 : 1010, detail ? 1040 : 1110, { fit: 'contain', withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const metadata = await sharp(productImage).metadata();
  const left = Math.round((width - (metadata.width || 1000)) / 2);
  const top = 160 + Math.round((1140 - (metadata.height || 1050)) / 2);
  await sharp({ create: { width, height, channels: 4, background } })
    .composite([
      { input: productImage, left, top },
      { input: frameSvg(product.title, detail), left: 0, top: 0 },
    ])
    .webp({ quality: 92, effort: 5 })
    .toFile(path.join(directory, `${detail ? '02-detail' : '01-principal'}.webp`));
}

for (const product of products) {
  const source = await download(product.sourceUrl);
  await render(product, source, false);
  await render(product, source, true);
  console.log(`Packshots créés: ${product.title}`);
}

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, 'sources.json'), JSON.stringify(products, null, 2), 'utf8');
console.log(`Sélection parfums créée: ${products.length} produits, ${products.length * 2} WebP.`);
