// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function createEverywherePayTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS everywherepay (
      id SERIAL PRIMARY KEY,
      gmail VARCHAR(255) UNIQUE NOT NULL,
      wallet VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function insertUser({ gmail, wallet }: { gmail: string; wallet?: string }) {
  await createEverywherePayTable();
  const result = await pool.query(
    'INSERT INTO everywherepay (gmail, wallet) VALUES ($1, $2) ON CONFLICT (gmail) DO NOTHING RETURNING *',
    [gmail, wallet || null]
  );
  return result.rows[0];
}

export async function getUserByGmail(gmail: string) {
  await createEverywherePayTable();
  const result = await pool.query('SELECT * FROM everywherepay WHERE gmail = $1', [gmail]);
  return result.rows[0];
}
