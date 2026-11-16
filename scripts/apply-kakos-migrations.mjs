import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(filePath) {
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(path.join(repoRoot, '.env.local'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manque dans .env.local.');
}

const migrationFiles = [
  '20261115000001_affiliate_sales_system.sql',
  '20261115000002_supplier_catalog_intake.sql',
  '20261115000003_real_promotion_checkout.sql',
  '20261116000004_search_and_store_contact_fix.sql',
];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  for (const fileName of migrationFiles) {
    const sql = fs.readFileSync(path.join(repoRoot, 'supabase', 'migrations', fileName), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Migration appliquée: ${fileName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}
