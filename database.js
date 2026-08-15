import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("railway") ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

export async function initDatabase() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id SERIAL PRIMARY KEY,
      jid TEXT NOT NULL,
      item TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      jid TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at TIMESTAMPTZ NOT NULL,
      sent BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id SERIAL PRIMARY KEY,
      jid TEXT NOT NULL,
      message TEXT NOT NULL,
      send_at TIMESTAMPTZ NOT NULL,
      sent BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function addShoppingItem(jid, item) {
  await getPool().query(
    "INSERT INTO shopping_items (jid, item) VALUES ($1, $2)",
    [jid, item]
  );
}

export async function listShoppingItems(jid) {
  const { rows } = await getPool().query(
    "SELECT id, item FROM shopping_items WHERE jid = $1 ORDER BY id",
    [jid]
  );
  return rows;
}

export async function removeShoppingItem(jid, id) {
  const result = await getPool().query(
    "DELETE FROM shopping_items WHERE jid = $1 AND id = $2",
    [jid, id]
  );
  return result.rowCount > 0;
}

export async function clearShoppingList(jid) {
  await getPool().query("DELETE FROM shopping_items WHERE jid = $1", [jid]);
}

export async function addReminder(jid, message, remindAt) {
  const { rows } = await getPool().query(
    `INSERT INTO reminders (jid, message, remind_at)
     VALUES ($1, $2, $3)
     RETURNING id, remind_at`,
    [jid, message, remindAt]
  );
  return rows[0];
}

export async function addScheduledMessage(jid, message, sendAt) {
  const { rows } = await getPool().query(
    `INSERT INTO scheduled_messages (jid, message, send_at)
     VALUES ($1, $2, $3)
     RETURNING id, send_at`,
    [jid, message, sendAt]
  );
  return rows[0];
}

export async function getDueReminders() {
  const { rows } = await getPool().query(`
    UPDATE reminders
    SET sent = TRUE
    WHERE sent = FALSE AND remind_at <= NOW()
    RETURNING id, jid, message
  `);
  return rows;
}

export async function getDueMessages() {
  const { rows } = await getPool().query(`
    UPDATE scheduled_messages
    SET sent = TRUE
    WHERE sent = FALSE AND send_at <= NOW()
    RETURNING id, jid, message
  `);
  return rows;
}
