import { Pool, QueryResultRow } from 'pg';

const globalForPg = global as unknown as { pgPool: Pool | undefined };

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL est manquante. Ajoutez la connexion Supabase dans .env.local.');
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
  }

  return globalForPg.pgPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  const start = Date.now();
  const res = await getPool().query<T>(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}
