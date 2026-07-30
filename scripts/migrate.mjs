// Applies db/schema.sql to Neon. Idempotent — every statement is IF NOT EXISTS.
// Usage: npm run db:migrate   (reads .env via node --env-file-if-exists)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const connectionString = process.env.NEON_POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  console.error('NEON_POSTGRES_CONNECTION_STRING is not set — run `stripe projects env --pull` first.');
  process.exit(1);
}

const schema = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'schema.sql'),
  'utf8',
);

const client = new pg.Client({
  connectionString,
  ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: true },
});

await client.connect();
try {
  await client.query(schema);
  console.log('Schema applied.');
} finally {
  await client.end();
}
