import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const campaignRoot = path.join(root, 'outputs', 'fresh-week-2026-11-23');
const sourceRoot = path.join(campaignRoot, 'generated');
const outputRoot = path.join(campaignRoot, 'catalog');

const products = [
  ['trio-bijoux-inox-noir-or', 'bijoux-inox.png'],
  ['sandales-tressees-boucle', 'sandales-tressees.png'],
  ['tops-femme-seconde-peau', 'tops-femmes.png'],
  ['sacs-structures-anse-spirale', 'sacs-structures.png'],
  ['ensemble-enfant-blanc-premium', 'ensemble-enfant.png'],
  ['trio-mini-parfums-decouverte', 'parfums-miniatures.png'],
  ['trio-parfums-50ml-assortis', 'parfums-50ml.png'],
];

const frameSvg = Buffer.from(`
  <svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1500" fill="none" stroke="#111313" stroke-width="28"/>
    <rect x="28" y="28" width="10" height="1444" fill="#62ddeb"/>
    <rect x="38" y="28" width="6" height="1444" fill="#d2a63b"/>
  </svg>
`);

async function render(slug, filename) {
  const source = path.join(sourceRoot, filename);
  if (!fs.existsSync(source)) throw new Error(`Source manquante: ${source}`);

  const dir = path.join(outputRoot, slug);
  fs.mkdirSync(dir, { recursive: true });

  const main = await sharp(source)
    .resize(1200, 1500, { fit: 'cover', position: 'attention' })
    .composite([{ input: frameSvg }])
    .webp({ quality: 91 })
    .toFile(path.join(dir, '01-principal.webp'));

  await sharp(source)
    .resize(1200, 1500, { fit: 'cover', position: 'centre' })
    .composite([
      {
        input: Buffer.from('<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg"><rect y="1430" width="1200" height="70" fill="#111313"/><rect y="1430" width="260" height="70" fill="#62ddeb"/><rect x="260" y="1430" width="14" height="70" fill="#d2a63b"/></svg>'),
      },
    ])
    .webp({ quality: 91 })
    .toFile(path.join(dir, '02-detail.webp'));

  console.log(`${slug}: ${main.width}x${main.height}`);
}

for (const [slug, filename] of products) await render(slug, filename);
console.log(`Fresh Week: ${products.length * 2} visuels créés dans ${outputRoot}`);
