import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "grad-pilot.db");
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
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
const userColumns = sqlite
  .query<{ name: string }>("PRAGMA table_info(users)")
  .all()
  .map((column) => column.name);
if (!userColumns.includes("email")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN email TEXT");
  if (userColumns.includes("username")) {
    sqlite.exec("UPDATE users SET email = lower(username) WHERE email IS NULL");
  }
}
if (!userColumns.includes("email_verified_at")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  sqlite.exec("UPDATE users SET email_verified_at = datetime('now') WHERE email IS NOT NULL AND email_verified_at IS NULL");
}
if (!userColumns.includes("verification_token_hash")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN verification_token_hash TEXT");
}
if (!userColumns.includes("verification_token_expires_at")) {
  sqlite.exec("ALTER TABLE users ADD COLUMN verification_token_expires_at TEXT");
}
sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
