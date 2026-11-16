import fs from 'node:fs';
import pg from 'pg';

for (const rawLine of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const separator = rawLine.indexOf('=');
  if (separator > 0 && !rawLine.trim().startsWith('#')) {
    process.env[rawLine.slice(0, separator).trim()] = rawLine.slice(separator + 1).trim();
  }
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE id IN (
        '6e89a70d-50c7-49a7-b149-566edc7a125c',
        '358119b4-50d5-413c-90e2-f25c35af026a',
        'dcc1e277-686f-4899-aa23-50390072971a',
        'ca80af45-3b44-41cc-81e8-ffabe3602a67'
      ) AND is_active = FALSE) AS crossed_products_archived,
      (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id IN (
        '6e89a70d-50c7-49a7-b149-566edc7a125c',
        '358119b4-50d5-413c-90e2-f25c35af026a',
        'dcc1e277-686f-4899-aa23-50390072971a',
        'ca80af45-3b44-41cc-81e8-ffabe3602a67'
      )) AS crossed_products_stock,
      (SELECT COUNT(*) FROM products WHERE id = 'b3051be1-15d2-434b-843d-4a00bdb1be8e' AND is_active AND title = 'Loro Piana') AS loro_piana_active,
      (SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id WHERE p.is_active AND c.slug = 'sacs') AS active_handbags,
      (SELECT COUNT(*) FROM products WHERE id IN (
        '6323a70b-e8b5-460d-8623-bab1c1093740',
        'c2f309ff-ef94-4e0a-8848-8016ceb47860',
        '22928302-916c-4cd2-8ec8-5932516c4eb1'
      ) AND is_active = FALSE) AS supplier_only_archived,
      (SELECT COUNT(*) FROM product_images WHERE product_id = '8689dcb2-d6d3-4df4-8980-1ebb46d55278' AND url = '/kakos-product-series-limitee-v2.webp') AS generated_indoor_asset
  `);
  const result = rows[0];
  console.log(result);
  if (
    Number(result.crossed_products_archived) !== 4 ||
    Number(result.crossed_products_stock) !== 0 ||
    Number(result.loro_piana_active) !== 1 ||
    Number(result.active_handbags) !== 2 ||
    Number(result.supplier_only_archived) !== 3 ||
    Number(result.generated_indoor_asset) !== 1
  ) {
    throw new Error('La vérification des corrections du catalogue a échoué.');
  }
} finally {
  await client.end();
}
