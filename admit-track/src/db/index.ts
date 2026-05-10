import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "grad-pilot.db");
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

function getUserColumns() {
  return sqlite
    .query<{ name: string; notnull: number }>("PRAGMA table_info(users)")
    .all();
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified_at TEXT,
    verification_token_hash TEXT,
    verification_token_expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

let userColumns = getUserColumns();
let userColumnNames = userColumns.map((column) => column.name);

if (userColumnNames.includes("username")) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users_next (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified_at TEXT,
      verification_token_hash TEXT,
      verification_token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  sqlite.exec(`
    INSERT OR IGNORE INTO users_next (
      id,
      email,
      name,
      password_hash,
      email_verified_at,
      verification_token_hash,
      verification_token_expires_at,
      created_at,
      updated_at
    )
    SELECT
      id,
      lower(coalesce(email, username)),
      name,
      password_hash,
      coalesce(email_verified_at, datetime('now')),
      verification_token_hash,
      verification_token_expires_at,
      created_at,
      updated_at
    FROM users
    WHERE coalesce(email, username) IS NOT NULL;
  `);
  sqlite.exec("DROP TABLE users;");
  sqlite.exec("ALTER TABLE users_next RENAME TO users;");
  userColumns = getUserColumns();
  userColumnNames = userColumns.map((column) => column.name);
}

if (!userColumnNames.includes("email")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN email TEXT");
  userColumnNames.push("email");
}
if (!userColumnNames.includes("email_verified_at")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  sqlite.exec("UPDATE users SET email_verified_at = datetime('now') WHERE email IS NOT NULL AND email_verified_at IS NULL");
  userColumnNames.push("email_verified_at");
}
if (!userColumnNames.includes("verification_token_hash")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN verification_token_hash TEXT");
  userColumnNames.push("verification_token_hash");
}
if (!userColumnNames.includes("verification_token_expires_at")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN verification_token_expires_at TEXT");
}
sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
