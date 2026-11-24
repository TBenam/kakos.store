import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.join(root, 'outputs', 'fournisseur-yaounde', 'care-web');

const products = [
  {
    slug: 'roushun-gel-douche-exfoliant-1000ml',
    title: 'ROUSHUN EXFOLIANT 1 L',
    sourceUrl: 'https://image.made-in-china.com/365f3j00YTwsLlVrCZqW/Gel-douche-exfoliant-claircissant-Roushun-Scrub-super-clatant-hydratant-nettoyant-en-profondeur-1000ml.webp',
    sourcePage: 'https://fr.made-in-china.com/co_cnstbaojie/product_Roushun-Scrub-Shower-Gel-Whitening-Super-Glowing-Deep-Cleansing-Exfoliating-Hydrating-1000ml_yuougggysg.html',
  },
  {
    slug: 'wellice-24k-gold-shampoo-500ml',
    title: 'WELLICE 24K GOLD 500 ML',
    sourceUrl: 'https://missbeauty.com.pk/cdn/shop/files/Black.jpg?v=1741166574&width=1200',
    sourcePage: 'https://missbeauty.com.pk/products/welice-24k-gold-keratin-serum-shampoo-500ml',
  },
  {
    slug: 'roushun-olive-oil-hair-treatment-1000ml',
    title: 'ROUSHUN OLIVE OIL 1 L',
    sourceUrl: 'https://www.st-baojie.com/uploadfile/202104/26/91f7aadb71275414c307cd4b45d7e970_medium.jpg',
    sourcePage: 'https://www.st-baojie.com/roushun-natural-olive-oil-hair-treatment_p919.html',
  },
  {
    slug: 'beckon-hair-mayonnaise-500g',
    title: 'BECKON HAIR MAYONNAISE 500 G',
    sourceUrl: 'https://xd21.co.za/cdn/shop/files/20250901-131813.jpg?v=1757627828&width=1600',
    sourcePage: 'https://xd21.co.za/products/hair-mayonnaise-500g-deep-conditioning-repair-treatment',
  },
  {
    slug: 'cqk-masques-visage-lot-5',
    title: 'CQK • LOT DE 5 MASQUES',
    sourceUrl: 'https://cdn.v2.tiendanegocio.com/gallery/32075/img_32075_dpkuzfnmmgsq5n9r.jpeg',
    sourcePage: 'https://pontecoquetta.tiendanegocio.com/producto/p2522306/caja-x30-uni-mascarilla-facial-cqk-surtidas',
  },
  {
    slug: 'miss-wendy-huile-corps-200ml',
    title: 'MISS WENDY BODY OIL 200 ML',
    sourceUrl: 'https://buyam.co/storage/products/original_c49c629a-a532-4746-804a-4735bb17a0c1.png',
    sourcePage: 'https://tampms-corner.buyam.cm/shop/34572/huile-miss-wendy',
  },
  {
    slug: 'dr-davey-cocoa-butter-shower-oil-200ml',
    title: 'DR DAVEY SHOWER OIL 200 ML',
    sourceUrl: 'https://p16-oec-general-useast5.ttcdn-us.com/tos-useast5-i-omjb5zjo8w-tx/f5cc784a3bf042198a367eae7f73f2d9~tplv-fhlh96nyum-crop-webp%3A2048%3A2048.webp?dr=12190&from=2378011839&idc=useast5&ps=933b5bde&shcp=948674b7&shp=8dbd94bf&t=555f072d',
    sourcePage: 'https://shop.tiktok.com/us/pdp/dr-davey-2pcs-200ml-rich-shine-cocoa-butter-shower-oil/1732301050103501177',
  },
];

const width = 1200;
const height = 1500;

async function download(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KAKOSCatalog/1.0)', Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      await sharp(body).metadata();
      return body;
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
    <rect width="1200" height="145" fill="#0A0A0A"/>
    <rect y="1320" width="1200" height="180" fill="#0A0A0A"/>
    <rect width="12" height="1500" fill="#59E1ED"/>
    <text x="54" y="88" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="#59E1ED">SOINS &amp; BEAUTÉ • ARRIVAGE YAOUNDÉ</text>
    <text x="54" y="1382" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#D6AE55">${detail ? 'RÉFÉRENCE AUTHENTIQUE' : 'PACKSHOT PRODUIT'}</text>
    <text x="54" y="1442" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF">KAKOS</text>
    <text x="1146" y="1438" font-family="Arial, sans-serif" font-size="24" font-weight="800" text-anchor="end" fill="#FFFFFF">${title}</text>
  </svg>`);
}

async function render(product, source, detail) {
  const directory = path.join(outputRoot, product.slug);
  fs.mkdirSync(directory, { recursive: true });
  const productImage = await sharp(source)
    .rotate()
    .trim({ background: '#ffffff', threshold: 8 })
    .resize(detail ? 940 : 1010, detail ? 1030 : 1110, { fit: 'contain', withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const metadata = await sharp(productImage).metadata();
  const left = Math.round((width - (metadata.width || 1000)) / 2);
  const top = 160 + Math.round((1140 - (metadata.height || 1050)) / 2);
  await sharp({ create: { width, height, channels: 4, background: detail ? '#E1EEF0' : '#F5F0E7' } })
    .composite([{ input: productImage, left, top }, { input: frameSvg(product.title, detail), left: 0, top: 0 }])
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
console.log(`Sélection soins créée: ${products.length} produits, ${products.length * 2} WebP.`);
