import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = './public';

async function compressAll() {
  console.log('🚀 Starting image compression in ./public...\n');
  const files = fs.readdirSync(PUBLIC_DIR);

  let initialTotalBytes = 0;
  let finalTotalBytes = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const filePath = path.join(PUBLIC_DIR, file);
    const stat = fs.statSync(filePath);
    const initialSize = stat.size;
    initialTotalBytes += initialSize;

    const fileBuffer = fs.readFileSync(filePath);
    const baseName = path.basename(file, ext);

    // 1. Generate WebP version (maxWidth 1400, quality 80)
    let webpPipeline = sharp(fileBuffer);
    const metadata = await webpPipeline.metadata();
    
    if (metadata.width && metadata.width > 1400) {
      webpPipeline = webpPipeline.resize({ width: 1400, withoutEnlargement: true });
    }

    const webpBuffer = await webpPipeline
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    const webpPath = path.join(PUBLIC_DIR, `${baseName}.webp`);
    fs.writeFileSync(webpPath, webpBuffer);

    // 2. Also compress the original file in-place so fallback / existing paths are also ultra-light
    let origPipeline = sharp(fileBuffer);
    if (metadata.width && metadata.width > 1400) {
      origPipeline = origPipeline.resize({ width: 1400, withoutEnlargement: true });
    }

    let compressedOrigBuffer;
    if (ext === '.png') {
      compressedOrigBuffer = await origPipeline
        .png({ quality: 80, compressionLevel: 9, effort: 7 })
        .toBuffer();
    } else {
      compressedOrigBuffer = await origPipeline
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    }

    fs.writeFileSync(filePath, compressedOrigBuffer);
    const newStat = fs.statSync(filePath);
    finalTotalBytes += newStat.size;

    console.log(`✅ ${file}: ${(initialSize / 1024).toFixed(1)} KB -> ${(newStat.size / 1024).toFixed(1)} KB [WebP: ${(webpBuffer.length / 1024).toFixed(1)} KB] (-${((1 - webpBuffer.length / initialSize) * 100).toFixed(0)}%)`);
  }

  console.log('\n----------------------------------------');
  console.log(`🎉 Total Public Assets: ${(initialTotalBytes / (1024 * 1024)).toFixed(2)} MB -> ${(finalTotalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`⚡ Savings: -${((1 - finalTotalBytes / initialTotalBytes) * 100).toFixed(1)}%`);
}

compressAll().catch(console.error);
