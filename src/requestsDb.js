import pkg from 'pg';
const { Pool } = pkg;
let pool;
export const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
};

export const ensureRequetsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS requets (
      id SERIAL PRIMARY KEY,
      requestid TEXT NOT NULL UNIQUE,
      "user" TEXT NOT NULL,
      amount TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  const p = getPool();
  await p.query(sql);
};

export const insertRequet = async ({ requestid, user, amount, message }) => {
  await ensureRequetsTable();
  const sql = `
    INSERT INTO requets (requestid, "user", amount, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const p = getPool();
  const result = await p.query(sql, [requestid, user, amount, message]);
  return result.rows[0];
};

export const getRequetByRequestId = async (requestid) => {
  await ensureRequetsTable();
  const sql = `SELECT * FROM requets WHERE requestid = $1 LIMIT 1;`;
  const p = getPool();
  const result = await p.query(sql, [requestid]);
  return result.rows[0] || null;
};
