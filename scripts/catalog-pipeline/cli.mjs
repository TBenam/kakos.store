#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const VALID_CATEGORIES = [
  'T-shirts',
  'Sweats / Hoodies',
  'Jeans',
  'Ensembles',
  'Culottes / Shorts',
  'Vestes / Doudounes',
  'Pantalons',
  'Salopettes'
];

const VALID_STATUSES = ['DRAFT', 'REVIEW_REQUIRED', 'APPROVED'];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Pricing Rule Recommendation
function recommendSalePrice(supplierPrice) {
  if (!supplierPrice || supplierPrice <= 0) return 0;
  let recommended = 0;
  if (supplierPrice <= 3000) {
    recommended = 8900;
  } else if (supplierPrice <= 5000) {
    recommended = 12900;
  } else if (supplierPrice <= 8000) {
    recommended = 14900;
  } else if (supplierPrice <= 10000) {
    recommended = 24900;
  } else {
    // Standard fast-fashion high-end markup rounded to nearest 900
    const raw = supplierPrice * 2.2;
    recommended = Math.round(raw / 1000) * 1000 - 100;
    if (recommended < supplierPrice) {
      recommended = supplierPrice * 2;
    }
  }
  return recommended;
}

// Clean text formatting
function cleanProductName(dirName) {
  // e.g. "Culottes 3500 FRS" -> "Culottes"
  // "ensemble culotte 8000FRS" -> "Ensemble Culotte"
  let name = dirName
    .replace(/\d+[\s\-_]*(?:FRS|FCFA|F)/gi, '') // strip price tag
    .replace(/[\s\-_]+/g, ' ')                  // normalize spaces
    .trim();
  
  // Capitalize words
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Extract information from directory and brief.txt
function parseDirectory(dirPath) {
  const absolutePath = path.resolve(dirPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  const dirName = path.basename(absolutePath);
  const files = fs.readdirSync(absolutePath);
  
  // Find images
  const images = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  }).sort();

  // Read brief.txt
  let briefText = '';
  const briefFile = files.find(f => f.toLowerCase() === 'brief.txt' || f.toLowerCase() === 'description.txt');
  if (briefFile) {
    briefText = fs.readFileSync(path.join(absolutePath, briefFile), 'utf-8');
  }

  // Heuristic extraction
  // 1. Supplier Price
  let supplierPrice = 0;
  // Try matching from folder name first
  const folderPriceMatch = dirName.match(/(\d+[\s\d]*)\s*(?:FRS|FCFA|F)/i);
  if (folderPriceMatch) {
    supplierPrice = parseInt(folderPriceMatch[1].replace(/\s+/g, ''), 10);
  } else if (briefText) {
    // Try matching from brief.txt
    const briefPriceMatch = briefText.match(/(?:prix|price|spécial|cout|coût)?\s*:\s*(\d+[\s\d]*)\s*(?:FRS|FCFA|F)/i) || 
                            briefText.match(/(\d+[\s\d]*)\s*(?:FRS|FCFA|F)/i);
    if (briefPriceMatch) {
      supplierPrice = parseInt(briefPriceMatch[1].replace(/\s+/g, ''), 10);
    }
  }

  // 2. Category
  let category = '';
  const cleanName = cleanProductName(dirName).toLowerCase();
  const fullSearchText = (dirName + ' ' + briefText).toLowerCase();

  if (fullSearchText.includes('tshirt') || fullSearchText.includes('t-shirt')) {
    category = 'T-shirts';
  } else if (fullSearchText.includes('pull') || fullSearchText.includes('hoodie') || fullSearchText.includes('sweat')) {
    category = 'Sweats / Hoodies';
  } else if (fullSearchText.includes('jeans') || fullSearchText.includes('jean ')) {
    category = 'Jeans';
  } else if (fullSearchText.includes('ensemble culotte') || fullSearchText.includes('ensemble lv') || fullSearchText.includes('ensembles')) {
    category = 'Ensembles';
  } else if (fullSearchText.includes('culotte') || fullSearchText.includes('short')) {
    category = 'Culottes / Shorts';
  } else if (fullSearchText.includes('doudoune') || fullSearchText.includes('veste') || fullSearchText.includes('blouson')) {
    category = 'Vestes / Doudounes';
  } else if (fullSearchText.includes('pantalon') || fullSearchText.includes('pant ')) {
    category = 'Pantalons';
  } else if (fullSearchText.includes('salopette')) {
    category = 'Salopettes';
  }

  // 3. Sizes & Colors (DO NOT INVENT!)
  const sizes = [];
  const colors = [];

  // Parse sizes from briefText (e.g., "tailles: S, M, L" or "taille disponible: XL")
  if (briefText) {
    const sizePatterns = [
      /tailles?\s*disponibles?\s*[:\-=]?\s*([a-z0-9,\s/\-]+)/i,
      /tailles?\s*[:\-=]?\s*([a-z0-9,\s/\-]+)/i
    ];
    let sizesFoundText = '';
    for (const pattern of sizePatterns) {
      const match = briefText.match(pattern);
      if (match) {
        // Double check it's not a generic sentence
        sizesFoundText = match[1].trim();
        break;
      }
    }
    
    // Standard size vocabulary
    const validSizeTokens = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '30', '32', '34', '36', '38', '40', '42', '44', '46'];
    if (sizesFoundText) {
      // Split and clean tokens
      const tokens = sizesFoundText.split(/[\s,/\-]+/);
      for (const token of tokens) {
        const cleanedToken = token.trim().toUpperCase();
        if (validSizeTokens.includes(cleanedToken) && !sizes.includes(cleanedToken)) {
          sizes.push(cleanedToken);
        }
      }
    }
  }

  // Parse colors (e.g. "couleurs: Noir, Blanc" or "couleur unique")
  if (briefText) {
    const colorPatterns = [
      /couleurs?\s*disponibles?\s*[:\-=]?\s*([a-z\u00C0-\u00FF,\s/\-]+)/i,
      /couleurs?\s*[:\-=]?\s*([a-z\u00C0-\u00FF,\s/\-]+)/i
    ];
    let colorsFoundText = '';
    for (const pattern of colorPatterns) {
      const match = briefText.match(pattern);
      if (match) {
        colorsFoundText = match[1].trim();
        break;
      }
    }

    const commonColors = ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Gris', 'Multicolore', 'Marron', 'Beige', 'Cyan', 'Rose', 'Orange', 'Kaki', 'Bordeaux'];
    if (colorsFoundText) {
      // Split and clean tokens
      const tokens = colorsFoundText.split(/[\s,/\-]+/);
      for (const token of tokens) {
        const cleaned = token.trim();
        // Capitalize first letter
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
        if (commonColors.includes(capitalized) && !colors.includes(capitalized)) {
          colors.push(capitalized);
        }
      }
    }
  }

  // 4. Description HTML framing
  let description = '';
  if (briefText) {
    // Keep brief text clean, strip emojis or format as paragraph
    const cleanedBrief = briefText.trim().replace(/\n+/g, '<br/>');
    description = `<p>${cleanedBrief}</p>`;
  } else {
    description = `<p><strong>${cleanProductName(dirName)} KAKOS</strong> — Une pièce maîtresse de notre vestiaire urbain.</p>`;
  }

  // 5. Tags
  const tags = ['kakos', 'streetwear', 'premium'];
  if (category) {
    tags.push(category.toLowerCase().replace(/\s*\/\s*/g, '-'));
  }

  return {
    name: cleanProductName(dirName),
    description,
    category: category || '',
    tags,
    supplierPrice,
    salePrice: supplierPrice,
    salePriceApprovedByHuman: true,
    sizes,
    colors,
    variants: [],
    stock: 0,
    images,
    needs_review: true,
    uncertainties: [],
    status: 'DRAFT',
    supplierReference: ''
  };
}

// Validation logic matching the JSON schema
function validateProductData(data, dirPath) {
  const errors = [];
  const warnings = [];

  // Required Fields Presence & Basic Types
  const required = [
    'name', 'description', 'category', 'tags', 'supplierPrice', 'salePrice',
    'salePriceApprovedByHuman', 'sizes', 'colors', 'variants', 'stock',
    'images', 'needs_review', 'uncertainties', 'status'
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: '${field}'`);
    }
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  // Validate types and constraints
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push("Field 'name' must be a non-empty string.");
  }

  if (typeof data.description !== 'string') {
    errors.push("Field 'description' must be a string.");
  }

  if (!VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Field 'category' must be one of: ${VALID_CATEGORIES.join(', ')}. Got: '${data.category}'`);
  }

  if (!Array.isArray(data.tags)) {
    errors.push("Field 'tags' must be an array.");
  }

  if (typeof data.supplierPrice !== 'number' || data.supplierPrice < 0) {
    errors.push("Field 'supplierPrice' must be a number >= 0.");
  }

  if (typeof data.salePrice !== 'number' || data.salePrice < 0) {
    errors.push("Field 'salePrice' must be a number >= 0.");
  }

  if (typeof data.salePriceApprovedByHuman !== 'boolean') {
    errors.push("Field 'salePriceApprovedByHuman' must be a boolean.");
  }

  if (!Array.isArray(data.sizes)) {
    errors.push("Field 'sizes' must be an array.");
  }

  if (!Array.isArray(data.colors)) {
    errors.push("Field 'colors' must be an array.");
  }

  if (!Array.isArray(data.images)) {
    errors.push("Field 'images' must be an array.");
  }

  if (!Array.isArray(data.uncertainties)) {
    errors.push("Field 'uncertainties' must be an array.");
  }

  if (!VALID_STATUSES.includes(data.status)) {
    errors.push(`Field 'status' must be one of: ${VALID_STATUSES.join(', ')}. Got: '${data.status}'`);
  }

  if (typeof data.needs_review !== 'boolean') {
    errors.push("Field 'needs_review' must be a boolean.");
  }

  // Validate Variants
  if (!Array.isArray(data.variants)) {
    errors.push("Field 'variants' must be an array.");
  } else {
    let variantsStockSum = 0;
    const variantKeys = new Set();
    const uniqueSizesInVariants = new Set();
    const uniqueColorsInVariants = new Set();

    data.variants.forEach((v, idx) => {
      if (typeof v !== 'object' || v === null) {
        errors.push(`Variant at index ${idx} is not an object.`);
        return;
      }
      if (typeof v.size !== 'string' || v.size.trim() === '') {
        errors.push(`Variant at index ${idx} is missing a valid 'size'.`);
      } else {
        uniqueSizesInVariants.add(v.size);
      }

      if (typeof v.color !== 'string' || v.color.trim() === '') {
        errors.push(`Variant at index ${idx} is missing a valid 'color'.`);
      } else {
        uniqueColorsInVariants.add(v.color);
      }

      if (typeof v.stock !== 'number' || v.stock < 0 || !Number.isInteger(v.stock)) {
        errors.push(`Variant at index ${idx} stock must be an integer >= 0.`);
      } else {
        variantsStockSum += v.stock;
      }

      const key = `${v.size}-${v.color}`;
      if (variantKeys.has(key)) {
        errors.push(`Duplicate variant combination: ${key}`);
      }
      variantKeys.add(key);
    });

    // Stock check
    if (data.stock !== variantsStockSum) {
      errors.push(`Field 'stock' (${data.stock}) does not match sum of variants' stock (${variantsStockSum}).`);
    }

    // Coherence of sizes and colors lists vs variants list
    data.sizes.forEach(s => {
      if (data.variants.length > 0 && !uniqueSizesInVariants.has(s)) {
        warnings.push(`Size '${s}' is defined in sizes list but has no active variants.`);
      }
    });

    data.colors.forEach(c => {
      if (data.variants.length > 0 && !uniqueColorsInVariants.has(c)) {
        warnings.push(`Color '${c}' is defined in colors list but has no active variants.`);
      }
    });

    uniqueSizesInVariants.forEach(s => {
      if (!data.sizes.includes(s)) {
        errors.push(`Variant contains size '${s}', but it's not declared in global 'sizes' list.`);
      }
    });

    uniqueColorsInVariants.forEach(c => {
      if (!data.colors.includes(c)) {
        errors.push(`Variant contains color '${c}', but it's not declared in global 'colors' list.`);
      }
    });
  }

  // Validate Images physically in directory
  if (dirPath) {
    const absolutePath = path.resolve(dirPath);
    data.images.forEach(img => {
      const imgPath = path.join(absolutePath, img);
      if (!fs.existsSync(imgPath)) {
        errors.push(`Image file declared but missing physically in folder: '${img}'`);
      }
    });
  }

  // Rules validations
  if (data.status === 'APPROVED') {
    if (data.needs_review) {
      errors.push("Product cannot be 'APPROVED' while 'needs_review' is true.");
    }
    if (!data.salePriceApprovedByHuman) {
      errors.push("Product cannot be 'APPROVED' without human approval of 'salePrice'.");
    }
    if (data.uncertainties.length > 0) {
      errors.push(`Product cannot be 'APPROVED' with active uncertainties: ${data.uncertainties.join(', ')}`);
    }
    if (data.sizes.length === 0) {
      errors.push("Product cannot be 'APPROVED' with an empty sizes list.");
    }
    if (data.colors.length === 0) {
      errors.push("Product cannot be 'APPROVED' with an empty colors list.");
    }
    if (data.variants.length === 0) {
      errors.push("Product cannot be 'APPROVED' with no variants.");
    }
  }

  if (data.needs_review === false && (data.status !== 'APPROVED' || data.uncertainties.length > 0 || !data.salePriceApprovedByHuman)) {
    errors.push("State mismatch: 'needs_review' is false, but conditions for approval (no uncertainties, status=APPROVED, human approved price) are not met.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Compute needs_review and uncertainties dynamically
function checkUncertainties(data) {
  const uncertainties = [];

  if (!data.name || data.name.trim() === '') {
    uncertainties.push('Product name is empty');
  }
  if (!data.category || data.category.trim() === '') {
    uncertainties.push('Product category is empty');
  }
  if (!data.supplierPrice || data.supplierPrice <= 0) {
    uncertainties.push('Supplier price is not specified or is zero');
  }
  if (!data.salePrice || data.salePrice <= 0) {
    uncertainties.push('Sale price is not specified or is zero');
  }
  if (!data.salePriceApprovedByHuman) {
    uncertainties.push('Sale price has not been approved by a human');
  }
  if (!data.sizes || data.sizes.length === 0) {
    uncertainties.push('Sizes list is empty');
  }
  if (!data.colors || data.colors.length === 0) {
    uncertainties.push('Colors list is empty');
  }
  if (!data.variants || data.variants.length === 0) {
    uncertainties.push('Variants array is empty');
  } else {
    const hasZeroStock = data.variants.some(v => v.stock === 0);
    if (hasZeroStock) {
      uncertainties.push('Some variants have 0 stock');
    }
  }

  data.uncertainties = uncertainties;
  data.needs_review = uncertainties.length > 0;

  if (data.needs_review) {
    if (data.status === 'APPROVED') {
      data.status = 'REVIEW_REQUIRED';
    }
  } else {
    data.status = 'APPROVED';
  }

  return data;
}

// CLI Logic
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetPath = args[1];

  if (!command || !targetPath) {
    printHelp();
    process.exit(1);
  }

  const isForce = args.includes('--force');

  try {
    switch (command) {
      case 'parse':
        await handleParse(targetPath, isForce);
        break;
      case 'process':
        await handleProcess(targetPath);
        break;
      case 'validate':
        await handleValidate(targetPath);
        break;
      case 'batch':
        await handleBatch(targetPath, isForce);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
\x1b[1mMEDIUM KAKOS Catalog Content Pipeline CLI\x1b[0m
Usage:
  node cli.mjs <command> <path> [options]

Commands:
  \x1b[36mparse <dir_path>\x1b[0m       Run non-interactive automatic parser on a supplier product folder.
  \x1b[36mprocess <dir_path>\x1b[0m     Run interactive wizard to fill, validate and approve a product.
  \x1b[36mvalidate <dir_path>\x1b[0m    Validate product.json schema, assets coherence, and business rules.
  \x1b[36mbatch <parent_path>\x1b[0m    Run automatic parser on all subdirectories of parent folder.

Options:
  \x1b[33m--force\x1b[0m               Overwrite existing product.json entries, even if already 'APPROVED'.
`);
}

// Command: Parse
async function handleParse(dirPath, isForce) {
  const jsonPath = path.join(dirPath, 'product.json');
  
  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (existing.status === 'APPROVED' && !isForce) {
        console.log(`\x1b[33mSkipping: '${path.basename(dirPath)}' is already APPROVED. Use --force to overwrite.\x1b[0m`);
        return;
      }
    } catch (e) {
      // If corrupted, overwrite is fine
    }
  }

  console.log(`Parsing folder: \x1b[34m${path.basename(dirPath)}\x1b[0m`);
  let data = parseDirectory(dirPath);
  
  // Apply rules for DRAFT / REVIEW_REQUIRED status
  data = checkUncertainties(data);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\x1b[32mSaved product.json (Status: ${data.status})\x1b[0m`);
}

// Command: Process (Interactive)
async function handleProcess(dirPath) {
  const jsonPath = path.join(dirPath, 'product.json');
  let existingData = null;

  if (fs.existsSync(jsonPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (existingData.status === 'APPROVED') {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(`\x1b[33mProduct is already APPROVED. Overwrite and re-process? (y/N): \x1b[0m`);
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          return;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // Parse folder to get baseline defaults, or use existing json
  let defaults = existingData || parseDirectory(dirPath);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n\x1b[1m=== KAKOS Product Wizard: ${path.basename(dirPath)} ===\x1b[0m\n`);

  // Prompt Name
  const name = await rl.question(`Product Name [${defaults.name}]: `) || defaults.name;

  // Prompt Category
  console.log(`\nAvailable Categories:\n${VALID_CATEGORIES.map((c, i) => `  ${i+1}. ${c}`).join('\n')}`);
  let categoryIdxStr = await rl.question(`Select category number (1-${VALID_CATEGORIES.length}) [${VALID_CATEGORIES.indexOf(defaults.category) + 1 || ''}]: `);
  let category = defaults.category;
  if (categoryIdxStr) {
    const idx = parseInt(categoryIdxStr, 10) - 1;
    if (idx >= 0 && idx < VALID_CATEGORIES.length) {
      category = VALID_CATEGORIES[idx];
    }
  }

  // Prompt Supplier Price
  const supplierPriceInput = await rl.question(`\nSupplier Price (FCFA) [${defaults.supplierPrice || 0}]: `);
  const supplierPrice = supplierPriceInput ? parseInt(supplierPriceInput, 10) : (defaults.supplierPrice || 0);

  // Prompt Sale Price
  const recommendedPrice = recommendSalePrice(supplierPrice);
  const salePriceInput = await rl.question(`Sale Price (FCFA) [${defaults.salePrice || recommendedPrice}]: `);
  const salePrice = salePriceInput ? parseInt(salePriceInput, 10) : (defaults.salePrice || recommendedPrice);

  // Approve Sale Price
  const approvalInput = await rl.question(`Approve this sale price (${salePrice} FCFA) explicitly? (y/n) [y]: `);
  const salePriceApprovedByHuman = approvalInput.toLowerCase() !== 'n';

  // Prompt Sizes
  const sizesInput = await rl.question(`\nSizes (comma separated, e.g. S,M,L or 38,40) [${defaults.sizes.join(',')}]: `);
  const sizes = sizesInput ? sizesInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : defaults.sizes;

  // Prompt Colors
  const colorsInput = await rl.question(`Colors (comma separated, e.g. Noir,Bleu) [${defaults.colors.join(',')}]: `);
  const colors = colorsInput ? colorsInput.split(',').map(c => c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase()).filter(Boolean) : defaults.colors;

  // Prompt Supplier Reference
  const refInput = await rl.question(`Supplier Reference (optional) [${defaults.supplierReference || ''}]: `);
  const supplierReference = refInput ? refInput.trim() : (defaults.supplierReference || '');

  // Prompt Stock per Variant
  const variants = [];
  let totalStock = 0;

  if (sizes.length > 0 && colors.length > 0) {
    console.log(`\n\x1b[1m--- Stock Configuration ---\x1b[0m`);
    const defaultStockInput = await rl.question(`Enter default stock for all variants [10]: `);
    const defaultStock = defaultStockInput ? parseInt(defaultStockInput, 10) : 10;

    const customizeInput = await rl.question(`Do you want to customize stock for individual variants? (y/N): `);
    const customize = customizeInput.toLowerCase() === 'y';

    for (const size of sizes) {
      for (const color of colors) {
        let stock = defaultStock;
        if (customize) {
          const varStockInput = await rl.question(`  Stock for variant ${size} - ${color} [${defaultStock}]: `);
          stock = varStockInput ? parseInt(varStockInput, 10) : defaultStock;
        }
        variants.push({ size, color, stock });
        totalStock += stock;
      }
    }
  }

  rl.close();

  // Combine data
  let updatedData = {
    ...defaults,
    name,
    category,
    supplierPrice,
    salePrice,
    salePriceApprovedByHuman,
    sizes,
    colors,
    variants,
    stock: totalStock,
    supplierReference
  };

  // Re-run checks
  updatedData = checkUncertainties(updatedData);

  // Write file
  fs.writeFileSync(jsonPath, JSON.stringify(updatedData, null, 2), 'utf-8');
  console.log(`\n\x1b[32mSuccess: Saved product.json (Status: ${updatedData.status})\x1b[0m`);

  // Final validation report
  await handleValidate(dirPath);
}

// Command: Validate
async function handleValidate(dirPath) {
  const jsonPath = path.join(dirPath, 'product.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`\x1b[31mError: product.json not found in '${dirPath}'\x1b[0m`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const report = validateProductData(data, dirPath);

  console.log(`\n\x1b[1m=== Validation Report: ${path.basename(dirPath)} ===\x1b[0m`);
  console.log(`Status: ${data.status === 'APPROVED' ? '\x1b[32mAPPROVED\x1b[0m' : `\x1b[33m${data.status}\x1b[0m`}`);
  console.log(`Needs Review: ${data.needs_review ? '\x1b[31mYes\x1b[0m' : '\x1b[32mNo\x1b[0m'}`);
  
  if (data.uncertainties && data.uncertainties.length > 0) {
    console.log(`Uncertainties (${data.uncertainties.length}):`);
    data.uncertainties.forEach(u => console.log(`  - \x1b[33m${u}\x1b[0m`));
  }

  if (report.valid) {
    console.log(`\x1b[32m✔ JSON Schema & Business rules validation: PASSED\x1b[0m`);
  } else {
    console.log(`\x1b[31m✘ JSON Schema & Business rules validation: FAILED (${report.errors.length} errors)\x1b[0m`);
    report.errors.forEach(e => console.log(`  - \x1b[31m${e}\x1b[0m`));
  }

  if (report.warnings.length > 0) {
    console.log(`Warnings (${report.warnings.length}):`);
    report.warnings.forEach(w => console.log(`  - \x1b[33m${w}\x1b[0m`));
  }
}

// Command: Batch
async function handleBatch(parentPath, isForce) {
  const absolutePath = path.resolve(parentPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    throw new Error(`Parent directory does not exist: ${parentPath}`);
  }

  const items = fs.readdirSync(absolutePath);
  const dirs = items.filter(item => {
    const fullPath = path.join(absolutePath, item);
    return fs.statSync(fullPath).isDirectory();
  });

  console.log(`Found ${dirs.length} product directories. Starting batch processing...\n`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const dir of dirs) {
    const fullPath = path.join(absolutePath, dir);
    const jsonPath = path.join(fullPath, 'product.json');

    if (fs.existsSync(jsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        if (existing.status === 'APPROVED' && !isForce) {
          skippedCount++;
          continue;
        }
      } catch (e) {
        // Corrupted, overwrite
      }
    }

    try {
      await handleParse(fullPath, isForce);
      processedCount++;
    } catch (e) {
      console.error(`\x1b[31mFailed to process '${dir}': ${e.message}\x1b[0m`);
    }
  }

  console.log(`\n\x1b[1m=== Batch Processing Completed ===\x1b[0m`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped (Already APPROVED): ${skippedCount}`);
}

main();
