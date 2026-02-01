import pkg from 'pg';

const { Pool } = pkg;

let pool;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    });
  }
  return pool;
};

export const ensureTxcomingTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS txcoming (
      id SERIAL PRIMARY KEY,
      mail TEXT NOT NULL,
      walletid TEXT NOT NULL,
      txhash TEXT NOT NULL,
      amount TEXT NOT NULL,
      chain TEXT NOT NULL,
      sender TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (mail, txhash)
    );
  `;
  const p = getPool();
  await p.query(sql);
  await p.query('ALTER TABLE txcoming ADD COLUMN IF NOT EXISTS walletid TEXT;');
  await p.query('CREATE UNIQUE INDEX IF NOT EXISTS txcoming_mail_txhash_uniq ON txcoming (mail, txhash);');
};

export const saveTxcoming = async ({ mail, walletid, txhash, amount, chain, sender, status = 'pending' }) => {
  await ensureTxcomingTable();
  const sql = `
    INSERT INTO txcoming (mail, walletid, txhash, amount, chain, sender, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (mail, txhash) DO NOTHING
    RETURNING id;
  `;
  const values = [mail, walletid, txhash, amount, chain, sender, status];
  const p = getPool();
  const result = await p.query(sql, values);
  return { inserted: result.rowCount > 0 };
};

export const getUserByGmail = async (email) => {
  const p = getPool();
  const sql = `SELECT "walletSetId", addresses FROM everywherepay WHERE gmail = $1 LIMIT 1;`;
  const result = await p.query(sql, [email]);
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  let addresses = row.addresses;
  if (typeof addresses === 'string') {
    try {
      addresses = JSON.parse(addresses);
    } catch {
      addresses = null;
    }
  }
  return { walletSetId: row.walletSetId, addresses };
};
