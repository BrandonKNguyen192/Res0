import { Pool, type QueryResultRow } from "pg";

// Neon writes NEON_POSTGRES_CONNECTION_STRING, not DATABASE_URL (see README).
const connectionString = process.env.NEON_POSTGRES_CONNECTION_STRING;

// Survive Next.js dev-server hot reloads without leaking pools.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!connectionString) {
    throw new Error(
      "NEON_POSTGRES_CONNECTION_STRING is not set — run `stripe projects env --pull`.",
    );
  }
  if (!globalForPool.pgPool) {
    globalForPool.pgPool = new Pool({
      connectionString,
      max: 5,
      ssl: /localhost|127\.0\.0\.1/.test(connectionString)
        ? undefined
        : { rejectUnauthorized: true },
    });
  }
  return globalForPool.pgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}
