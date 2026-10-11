// Postgres in production (Neon via DATABASE_URL); embedded PGlite for local dev.
let dbPromise;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'duo',
  members JSONB NOT NULL DEFAULT '[]',
  search TEXT NOT NULL DEFAULT '',
  table_no TEXT DEFAULT '',
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS checkins (
  team_id INT NOT NULL,
  round INT NOT NULL,
  mentor_id TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  override TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  PRIMARY KEY (team_id, round)
);
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL,
  round INT NOT NULL,
  mentor_id TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS locks (
  team_id INT NOT NULL,
  round INT NOT NULL,
  mentor_id TEXT NOT NULL,
  override TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (team_id, round)
);
CREATE TABLE IF NOT EXISTS conflicts (
  mentor_id TEXT NOT NULL,
  team_id INT NOT NULL,
  PRIMARY KEY (mentor_id, team_id)
);
CREATE TABLE IF NOT EXISTS flags (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL,
  type TEXT NOT NULL,
  skill TEXT,
  note TEXT NOT NULL DEFAULT '',
  raised_by TEXT,
  source TEXT NOT NULL DEFAULT 'flag',
  round INT,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open',
  taken_by TEXT,
  taken_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS picks (
  mentor_id TEXT PRIMARY KEY,
  first_team INT,
  first_why TEXT,
  second_team INT,
  second_why TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS nominations (
  mentor_id TEXT NOT NULL,
  team_id INT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mentor_id, team_id)
);
CREATE TABLE IF NOT EXISTS scores (
  mentor_id TEXT NOT NULL,
  team_id INT NOT NULL,
  marks JSONB NOT NULL DEFAULT '{}',
  total DOUBLE PRECISION NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (mentor_id, team_id)
);
CREATE TABLE IF NOT EXISTS followups (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL,
  mentor_id TEXT NOT NULL,
  round INT,
  note TEXT NOT NULL DEFAULT '',
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shortlist (
  team_id INT PRIMARY KEY,
  starred BOOLEAN NOT NULL DEFAULT true,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- New columns for existing databases go below as ALTER TABLE ... ADD COLUMN IF NOT EXISTS,
-- after every CREATE TABLE, and nullable so older backups still restore.
`;

async function init() {
  let query, transaction;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
      max: 3,
    });
    // A dropped idle connection must not crash the function; the pool replaces it.
    pool.on('error', e => console.error('pg pool error', e.message));
    query = async (text, params) => (await pool.query(text, params)).rows;
    transaction = async fn => {
      const client = await pool.connect();
      client.on('error', () => {});
      let broken = null;
      try {
        await client.query('BEGIN');
        const out = await fn(async (text, params = []) => (await client.query(text, params)).rows);
        await client.query('COMMIT');
        return out;
      } catch (e) {
        await client.query('ROLLBACK').catch(err => { broken = err; });
        throw e;
      } finally {
        client.release(broken || undefined); // a connection that failed to roll back is discarded, not reused
      }
    };
    for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) await pool.query(stmt);
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite(process.env.PGLITE_DIR || './.pglite');
    await db.exec(SCHEMA);
    query = async (text, params) => (await db.query(text, params)).rows;
    transaction = fn => db.transaction(tx => fn(async (text, params = []) => (await tx.query(text, params)).rows));
  }
  return { query, transaction };
}

const ready = () => {
  if (!dbPromise) dbPromise = init().catch(e => { dbPromise = null; throw e; });
  return dbPromise;
};

export async function sql(text, params = []) {
  return (await ready()).query(text, params);
}

// Runs fn(q) inside one transaction: all of it applies, or none of it does.
export async function transaction(fn) {
  return (await ready()).transaction(fn);
}
