import { Database } from 'bun:sqlite';

const DB_PATH = process.env.DB_PATH ?? 'data/app.db';

const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode=WAL');

// Create notes table
db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    title        TEXT NOT NULL,
    content_json TEXT NOT NULL,
    is_public    INTEGER NOT NULL DEFAULT 0,
    public_slug  TEXT UNIQUE,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
  )
`);

db.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id     ON notes(user_id)');
db.run('CREATE INDEX IF NOT EXISTS idx_notes_public_slug ON notes(public_slug)');
db.run('CREATE INDEX IF NOT EXISTS idx_notes_is_public   ON notes(is_public)');

export function getDb(): Database {
  return db;
}

export function query<T>(sql: string, params?: unknown[]): T[] {
  return db.query(sql).all(...(params ?? [])) as T[];
}

export function get<T>(sql: string, params?: unknown[]): T | undefined {
  return db.query(sql).get(...(params ?? [])) as T | undefined;
}

export function run(sql: string, params?: unknown[]): void {
  db.run(sql, params ?? []);
}
