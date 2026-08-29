import { Pool, QueryResultRow } from 'pg';

const connectionString = 'postgresql://postgres.ralpcvehpryooszzmmya:Precioussmith2002%40@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const globalForPg = global as unknown as { pgPool: Pool | undefined };

const pool = globalForPg.pgPool ?? new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}
