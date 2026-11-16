import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const migrationName = process.argv[2];
if (!migrationName || !/^\d{14}_[a-z0-9_]+\.sql$/.test(migrationName)) {
  throw new Error('Usage: node scripts/apply-migration.mjs <migration.sql>');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationName);
const sql = await fs.readFile(migrationPath, 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log(`Applied ${migrationName}`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
