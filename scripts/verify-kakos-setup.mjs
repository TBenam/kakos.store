import fs from 'node:fs';
import pg from 'pg';

for (const rawLine of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const line = rawLine.trim();
  const separator = line.indexOf('=');
  if (!line || line.startsWith('#') || separator < 1) continue;
  process.env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM public.suppliers) AS suppliers,
      (SELECT COUNT(*) FROM public.catalog_candidates) AS candidates,
      (SELECT COUNT(*) FROM public.catalog_candidates WHERE review_status = 'PUBLISHED') AS published_candidates,
      (SELECT COUNT(*) FROM public.products WHERE is_active = TRUE) AS active_products,
      (SELECT COUNT(*) FROM public.product_images) AS product_images,
      (SELECT COUNT(*) FROM public.product_variants) AS product_variants,
      (SELECT COUNT(*) FROM public.affiliates) AS affiliates,
      (SELECT COUNT(*) FROM public.affiliate_commissions) AS commissions
  `);
  console.log(rows[0]);
} finally {
  await client.end();
}
