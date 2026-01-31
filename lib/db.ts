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
      "walletSetId" VARCHAR(255),
      "walletSetName" VARCHAR(255),
      addresses JSONB,
      "walletSetRaw" JSONB,
      "walletsRaw" JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Add columns if missing (idempotent)
  const alterStatements = [
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS wallet VARCHAR(255);',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS "walletSetId" VARCHAR(255);',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS "walletSetName" VARCHAR(255);',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS addresses JSONB;',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS "walletSetRaw" JSONB;',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS "walletsRaw" JSONB;',
    'ALTER TABLE everywherepay ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;'
  ];
  for (const stmt of alterStatements) {
    await pool.query(stmt);
  }
}


export async function insertUser({ gmail, wallet, walletSetId, walletSetName, addresses, walletSetRaw, walletsRaw }: {
  gmail: string;
  wallet?: string;
  walletSetId?: string;
  walletSetName?: string;
  addresses?: any;
  walletSetRaw?: any;
  walletsRaw?: any;
}) {
  await createEverywherePayTable();
  const result = await pool.query(
    `INSERT INTO everywherepay (gmail, wallet, "walletSetId", "walletSetName", addresses, "walletSetRaw", "walletsRaw")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (gmail) DO UPDATE SET
       wallet = EXCLUDED.wallet,
       "walletSetId" = EXCLUDED."walletSetId",
       "walletSetName" = EXCLUDED."walletSetName",
       addresses = EXCLUDED.addresses,
       "walletSetRaw" = EXCLUDED."walletSetRaw",
       "walletsRaw" = EXCLUDED."walletsRaw"
     RETURNING *`,
    [
      gmail,
      wallet || null,
      walletSetId || null,
      walletSetName || null,
      addresses ? JSON.stringify(addresses) : null,
      walletSetRaw ? JSON.stringify(walletSetRaw) : null,
      walletsRaw ? JSON.stringify(walletsRaw) : null,
    ]
  );
  return result.rows[0];
}

export async function getUserByGmail(gmail: string) {
  await createEverywherePayTable();
  const result = await pool.query('SELECT * FROM everywherepay WHERE gmail = $1', [gmail]);
  return result.rows[0];
}
