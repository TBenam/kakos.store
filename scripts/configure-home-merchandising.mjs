import fs from 'node:fs';
import pg from 'pg';

for (const rawLine of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = rawLine.trim();
  const separator = line.indexOf('=');
  if (!line || line.startsWith('#') || separator < 1) continue;
  process.env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query('BEGIN');

  const bestSellers = await client.query(`
    WITH ranked AS (
      SELECT p.id, p.title, c.name AS category_name,
             row_number() OVER (PARTITION BY p.category_id ORDER BY p.created_at DESC) AS category_rank
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE
    ), selected AS (
      SELECT id FROM ranked WHERE category_rank <= 2 ORDER BY category_name, id LIMIT 10
    )
    UPDATE public.products p
    SET is_bestseller = TRUE
    FROM selected
    WHERE p.id = selected.id
    RETURNING p.id, p.title
  `);

  const flashDeals = await client.query(`
    WITH ranked AS (
      SELECT p.id, p.title, p.sale_price, p.supplier_price,
             row_number() OVER (PARTITION BY p.category_id ORDER BY (p.sale_price - p.supplier_price) DESC, p.created_at DESC) AS category_rank
      FROM public.products p
      WHERE p.is_active = TRUE
        AND p.sale_price - p.supplier_price >= 2500
        AND p.promo_price IS NULL
    ), selected AS (
      SELECT id,
             LEAST(sale_price - 500, GREATEST(supplier_price + 2000, FLOOR((sale_price * 0.90) / 500) * 500)) AS flash_price
      FROM ranked
      WHERE category_rank = 1
      ORDER BY sale_price - supplier_price DESC
      LIMIT 6
    )
    UPDATE public.products p
    SET promo_price = selected.flash_price,
        badge = 'VENTE FLASH'
    FROM selected
    WHERE p.id = selected.id
      AND selected.flash_price > p.supplier_price
      AND selected.flash_price < p.sale_price
    RETURNING p.id, p.title, p.sale_price, p.promo_price
  `);

  await client.query('COMMIT');
  console.log(`Best sellers actifs: ${bestSellers.rowCount}`);
  console.log(`Ventes flash créées: ${flashDeals.rowCount}`);
  for (const product of flashDeals.rows) {
    console.log(`${product.title}: ${product.sale_price} -> ${product.promo_price} FCFA`);
  }
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
