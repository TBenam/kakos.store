#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { buildCandidates, csvCell, IMAGE_EXTENSIONS, parseWhatsAppText, validateDraft } from './lib.mjs';

function argValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

export function writeReviewCsv(draft, target) {
  const headers = ['id', 'status', 'publish', 'duplicateOf', 'title', 'category', 'supplier', 'supplierPrice', 'salePrice', 'availability', 'media', 'uncertainties'];
  const rows = draft.products.map((product) => headers.map((header) => csvCell(product[header])).join(','));
  fs.writeFileSync(target, `\uFEFF${headers.join(',')}\n${rows.join('\n')}\n`, 'utf8');
}

export function writeReviewHtml(draft, target) {
  const payload = JSON.stringify(draft).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Validation catalogue KAKOS</title><style>
  :root{font-family:Arial,sans-serif;color:#171717;background:#f5f3ef}body{margin:0}.head{position:sticky;top:0;background:#111;color:#fff;padding:16px;z-index:2;display:flex;gap:12px;align-items:center;justify-content:space-between}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px;padding:16px}.card{background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 12px #0001}.photos{display:flex;gap:6px;overflow:auto}.photos img{width:100px;height:100px;object-fit:cover;border-radius:8px}label{display:block;font-size:12px;font-weight:bold;margin-top:10px}input,select,textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid #bbb;border-radius:7px}textarea{min-height:90px}.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.warn{font-size:12px;color:#9b2c2c}.dup{border:2px solid #e53e3e}.approve{display:flex;align-items:center;gap:8px;margin-top:12px}.approve input{width:auto}button{background:#f5b700;border:0;padding:10px 14px;border-radius:8px;font-weight:bold;cursor:pointer}</style></head><body>
  <div class="head"><div><strong>KAKOS · Validation WhatsApp</strong><div id="count"></div></div><button id="download">Télécharger le JSON validé</button></div><main class="grid" id="grid"></main>
  <script>const draft=${payload};const categories=['Chaussures','Chaussures femmes','Chaussures hommes','T-shirts','Jeans','Pantalons','Shorts','Maillots','Lot mixte','Sacs','Parfums','Vêtements femmes','Vêtements hommes','Beauté','Montres & accessoires','Maison','Électronique','Autres'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){document.querySelector('#count').textContent=draft.products.length+' brouillons';document.querySelector('#grid').innerHTML=draft.products.map((p,i)=>\`<article class="card \${p.duplicateOf?'dup':''}"><div class="photos">\${p.media.map(m=>\`<img src="products/\${p.id}/\${encodeURIComponent(m)}">\`).join('')}</div><label>Nom</label><input data-i="\${i}" data-k="title" value="\${esc(p.title)}"><div class="row"><div><label>Catégorie</label><select data-i="\${i}" data-k="category">\${categories.map(c=>\`<option \${c===p.category?'selected':''}>\${c}</option>\`).join('')}</select></div><div><label>Disponibilité</label><select data-i="\${i}" data-k="availability"><option>TO_CONFIRM</option><option>AVAILABLE</option><option>UNAVAILABLE</option></select></div></div><div class="row"><div><label>Prix fournisseur</label><input type="number" data-i="\${i}" data-k="supplierPrice" value="\${p.supplierPrice??''}"></div><div><label>Prix de vente</label><input type="number" data-i="\${i}" data-k="salePrice" value="\${p.salePrice??''}"></div></div><label>Description</label><textarea data-i="\${i}" data-k="description">\${esc(p.description)}</textarea><p class="warn">\${esc(p.uncertainties.join(' · '))}</p><label class="approve"><input type="checkbox" data-i="\${i}" data-k="approved"> Approuver pour publication</label></article>\`).join('')}
  document.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('change',()=>{const p=draft.products[Number(el.dataset.i)],k=el.dataset.k;if(k==='approved'){p.publish=el.checked;p.status=el.checked?'APPROVED':'REVIEW_REQUIRED';if(el.checked)p.uncertainties=[]}else if(['supplierPrice','salePrice'].includes(k)){p[k]=el.value?Number(el.value):null}else p[k]=el.value}))}
  render();document.querySelector('#download').onclick=()=>{const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='catalog-reviewed.json';a.click();URL.revokeObjectURL(a.href)};</script></body></html>`;
  fs.writeFileSync(target, html, 'utf8');
}

export function extractArchive(archivePath, outputDir, supplier) {
  const zip = new AdmZip(archivePath);
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const txtEntries = entries.filter((entry) => path.extname(entry.entryName).toLowerCase() === '.txt');
  if (!txtEntries.length) throw new Error('Aucun fichier de discussion .txt trouvé dans le ZIP.');
  const chatEntry = txtEntries.sort((a, b) => b.header.size - a.header.size)[0];

  fs.mkdirSync(outputDir, { recursive: true });
  const rawMediaDir = path.join(outputDir, '_media');
  fs.mkdirSync(rawMediaDir, { recursive: true });
  const availableMedia = new Map();
  for (const entry of entries) {
    const ext = path.extname(entry.entryName).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const original = path.basename(entry.entryName);
    let targetName = original;
    let counter = 2;
    while (availableMedia.has(targetName.toLowerCase())) targetName = `${path.parse(original).name}-${counter++}${ext}`;
    fs.writeFileSync(path.join(rawMediaDir, targetName), entry.getData());
    availableMedia.set(original.toLowerCase(), targetName);
  }

  const messages = parseWhatsAppText(chatEntry.getData().toString('utf8'));
  let products = buildCandidates(messages, availableMedia, rawMediaDir, {
    supplier,
    defaultCategory: argValue(process.argv.slice(2), '--category'),
  });
  if (process.argv.includes('--only-with-photos')) products = products.filter((product) => product.media.length > 0);
  for (const product of products) {
    const productDir = path.join(outputDir, 'products', safeName(product.id));
    fs.mkdirSync(productDir, { recursive: true });
    for (const mediaName of product.media) fs.copyFileSync(path.join(rawMediaDir, mediaName), path.join(productDir, mediaName));
  }

  const draft = {
    version: 1,
    batchId: `wa-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    createdAt: new Date().toISOString(),
    source: { archive: path.basename(archivePath), chatFile: chatEntry.entryName, messageCount: messages.length, mediaCount: availableMedia.size },
    safeguards: { requiresHumanApproval: true, supabasePublished: false },
    products,
  };
  fs.rmSync(rawMediaDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(outputDir, 'catalog-draft.json'), JSON.stringify(draft, null, 2), 'utf8');
  writeReviewCsv(draft, path.join(outputDir, 'review.csv'));
  writeReviewHtml(draft, path.join(outputDir, 'review.html'));
  return draft;
}

function printHelp() {
  console.log(`KAKOS WhatsApp Catalog\n\nCommandes:\n  extract <export.zip> [--output dossier] [--supplier nom] [--category catégorie] [--only-with-photos]\n  validate <catalog-reviewed.json>\n\nL'extraction ne publie jamais dans Supabase.`);
}

export function main(args = process.argv.slice(2)) {
 const command = args[0];
 try {
  if (command === 'extract') {
    const archive = args[1];
    if (!archive) throw new Error('Chemin du ZIP manquant.');
    const output = path.resolve(argValue(args, '--output', `whatsapp-import-${Date.now()}`));
    const draft = extractArchive(path.resolve(archive), output, argValue(args, '--supplier'));
    const duplicates = draft.products.filter((product) => product.duplicateOf).length;
    console.log(`Extraction terminée: ${draft.products.length} brouillons, ${duplicates} doublons probables.`);
    console.log(`Validation humaine: ${path.join(output, 'review.html')}`);
    console.log(`Données: ${path.join(output, 'catalog-draft.json')}`);
  } else if (command === 'validate') {
    const file = args[1];
    if (!file) throw new Error('Chemin du JSON manquant.');
    const report = validateDraft(JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')));
    report.warnings.forEach((warning) => console.warn(`AVERTISSEMENT: ${warning}`));
    report.errors.forEach((error) => console.error(`ERREUR: ${error}`));
    console.log(report.valid ? 'Catalogue valide pour la prochaine étape de publication.' : 'Catalogue non publiable. Corrigez les erreurs ci-dessus.');
    process.exitCode = report.valid ? 0 : 1;
  } else {
    printHelp();
    process.exitCode = command ? 1 : 0;
  }
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
