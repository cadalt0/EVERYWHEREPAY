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
      txtype TEXT NOT NULL DEFAULT 'IN',
      status VARCHAR(500) NOT NULL DEFAULT 'received',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (mail, txhash)
    );
  `;
  const p = getPool();
  await p.query(sql);
  await p.query('ALTER TABLE txcoming ADD COLUMN IF NOT EXISTS walletid TEXT;');
  await p.query('ALTER TABLE txcoming ADD COLUMN IF NOT EXISTS txtype TEXT DEFAULT \'IN\';');
  await p.query('ALTER TABLE txcoming ALTER COLUMN status TYPE VARCHAR(500);');
  await p.query('CREATE UNIQUE INDEX IF NOT EXISTS txcoming_mail_txhash_uniq ON txcoming (mail, txhash);');
};

export const saveTxcoming = async ({ mail, walletid, txhash, amount, chain, sender, txtype = 'IN', status = 'received' }) => {
  await ensureTxcomingTable();
  const sql = `
    INSERT INTO txcoming (mail, walletid, txhash, amount, chain, sender, txtype, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (mail, txhash) DO NOTHING
    RETURNING id;
  `;
  const values = [mail, walletid, txhash, amount, chain, sender, txtype, status];
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
export const updateTxcomingStatus = async (txhash, newStatus, newChain = null) => {
  await ensureTxcomingTable();
  const p = getPool();
  
  if (newChain) {
    const sql = `UPDATE txcoming SET status = $1, chain = $2 WHERE txhash = $3;`;
    const result = await p.query(sql, [newStatus, newChain, txhash]);
    return { updated: result.rowCount > 0 };
  } else {
    const sql = `UPDATE txcoming SET status = $1 WHERE txhash = $2;`;
    const result = await p.query(sql, [newStatus, txhash]);
    return { updated: result.rowCount > 0 };
  }
};

export const getTransactionByBurnHash = async (burnHash) => {
  await ensureTxcomingTable();
  const p = getPool();
  const sql = `SELECT * FROM txcoming WHERE txhash = $1 LIMIT 1;`;
  const result = await p.query(sql, [burnHash]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const getLatestBridgedTransaction = async (email, amount) => {
  await ensureTxcomingTable();
  const p = getPool();
  const sql = `SELECT * FROM txcoming WHERE mail = $1 AND amount = $2 AND status = 'bridged' ORDER BY created_at DESC LIMIT 1;`;
  const result = await p.query(sql, [email, amount]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const updatePreviousReceivedToBridged = async (email, currentId) => {
  await ensureTxcomingTable();
  const p = getPool();
  const sql = `UPDATE txcoming SET status = 'bridged' WHERE mail = $1 AND status = 'received' AND id < $2;`;
  const result = await p.query(sql, [email, currentId]);
  return { updated: result.rowCount };
};

export { getPool };