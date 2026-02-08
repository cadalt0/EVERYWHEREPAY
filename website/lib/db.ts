// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let everywherePayInitPromise: Promise<void> | null = null;


export async function createEverywherePayTable() {
  if (!everywherePayInitPromise) {
    everywherePayInitPromise = (async () => {
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
    })();
  }

  return everywherePayInitPromise;
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

export async function getUserAddressesByGmail(gmail: string) {
  await createEverywherePayTable();
  const result = await pool.query('SELECT addresses FROM everywherepay WHERE gmail = $1', [gmail]);
  return result.rows[0];
}
/**
 * Check if txcoming table exists
 */
export async function txcomingTableExists() {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'txcoming'
    );
  `);
  return result.rows[0].exists;
}

/**
 * Create txcoming table if it doesn't exist
 */
export async function createTxcomingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS txcoming (
      id SERIAL PRIMARY KEY,
      mail VARCHAR(255) NOT NULL,
      txhash VARCHAR(255) NOT NULL UNIQUE,
      amount VARCHAR(255) NOT NULL,
      chain VARCHAR(100) NOT NULL,
      sender VARCHAR(255) NOT NULL,
      walletid VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create index on txhash for fast duplicate checking
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_txcoming_txhash ON txcoming(txhash);
  `);
  
  // Create index on mail for user queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_txcoming_mail ON txcoming(mail);
  `);
}

/**
 * Save incoming USDC transaction
 * Returns { isDuplicate: true } if txhash already exists
 */
export async function saveTxcoming({
  mail,
  txhash,
  amount,
  chain,
  sender,
  walletid,
  status = 'pending'
}: {
  mail: string;
  txhash: string;
  amount: string;
  chain: string;
  sender: string;
  walletid: string;
  status?: string;
}) {
  // Ensure table exists
  const tableExists = await txcomingTableExists();
  if (!tableExists) {
    await createTxcomingTable();
  }

  // Check if txhash already exists (prevent duplicates)
  const existing = await pool.query(
    'SELECT id FROM txcoming WHERE txhash = $1',
    [txhash]
  );
  
  if (existing.rows.length > 0) {
    console.log('Duplicate txhash found:', txhash);
    return { isDuplicate: true, id: existing.rows[0].id };
  }

  // Insert new transaction
  const result = await pool.query(
    `INSERT INTO txcoming (mail, txhash, amount, chain, sender, walletid, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [mail, txhash, amount, chain, sender, walletid, status]
  );

  return { isDuplicate: false, ...result.rows[0] };
}