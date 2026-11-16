import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourcePath = process.argv[2];
if (!sourcePath || !fs.existsSync(sourcePath)) {
  throw new Error('Utilisation: node scripts/build-social-preview.mjs <image-source>');
}

const overlay = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#080808" stop-opacity="0.88"/>
        <stop offset="0.46" stop-color="#080808" stop-opacity="0.35"/>
        <stop offset="0.64" stop-color="#080808" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <rect x="58" y="61" width="5" height="76" rx="2" fill="#D9A441"/>
    <text x="82" y="125" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" letter-spacing="-4">KAKOS</text>
    <text x="60" y="204" fill="#62E1EE" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="3">MODE  •  CHAUSSURES  •  SACS  •  PARFUMS</text>
    <text x="58" y="293" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900">LE STYLE ACTUEL,</text>
    <text x="58" y="350" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900">AU JUSTE PRIX.</text>
    <rect x="58" y="403" width="318" height="48" rx="6" fill="#62E1EE"/>
    <text x="78" y="434" fill="#0A0A0A" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="1.1">LIVRAISON AU CAMEROUN</text>
    <text x="60" y="510" fill="#D8D3CA" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600">Une sélection chic pour elle, lui et chaque style.</text>
    <text x="60" y="557" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" letter-spacing="1.5">KAKOS.STORE</text>
  </svg>
`);

const outputPaths = [
  path.join('public', 'og-image-kakos-v2.jpg'),
  path.join('public', 'og-image.jpg'),
  path.join('src', 'app', 'opengraph-image.jpg'),
  path.join('src', 'app', 'twitter-image.jpg'),
];

const image = await sharp(sourcePath)
  .resize(1200, 630, { fit: 'cover', position: 'center' })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
  .toBuffer();

for (const outputPath of outputPaths) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, image);
  console.log(`${outputPath}: ${image.length} octets`);
}
