import "server-only";

import type { D1DatabaseLike } from "./d1-client";

const MIGRATIONS = {
  auth: `
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      revoked_at INTEGER,
      ip_hash TEXT,
      user_agent_hash TEXT,
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
    CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);
  `,
  mcq: `
    CREATE TABLE IF NOT EXISTS mcq (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      question TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mcq_choice (
      id TEXT PRIMARY KEY,
      mcq_id TEXT NOT NULL,
      choice_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      choice_order INTEGER NOT NULL,
      FOREIGN KEY (mcq_id) REFERENCES mcq(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mcq_attempt (
      id TEXT PRIMARY KEY,
      mcq_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      selected_choice_ids TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      score INTEGER NOT NULL,
      completed_at INTEGER NOT NULL,
      FOREIGN KEY (mcq_id) REFERENCES mcq(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_mcq_user_id ON mcq(user_id);
    CREATE INDEX IF NOT EXISTS idx_mcq_created_at ON mcq(created_at);
    CREATE INDEX IF NOT EXISTS idx_mcq_choice_mcq_id ON mcq_choice(mcq_id);
    CREATE INDEX IF NOT EXISTS idx_mcq_choice_order ON mcq_choice(mcq_id, choice_order);
    CREATE INDEX IF NOT EXISTS idx_mcq_attempt_mcq_id ON mcq_attempt(mcq_id);
    CREATE INDEX IF NOT EXISTS idx_mcq_attempt_user_id ON mcq_attempt(user_id);
    CREATE INDEX IF NOT EXISTS idx_mcq_attempt_completed_at ON mcq_attempt(completed_at);
  `,
};

let initialized = false;

export async function ensureTablesExist(db: D1DatabaseLike): Promise<void> {
  if (initialized) return;

  try {
    const statements = [
      ...MIGRATIONS.auth.split(";").filter((s) => s.trim()),
      ...MIGRATIONS.mcq.split(";").filter((s) => s.trim()),
    ];

    for (const sql of statements) {
      if (sql.trim()) {
        await db.prepare(sql.trim()).all();
      }
    }

    initialized = true;
  } catch (err) {
    console.error("Failed to initialize database tables:", err);
    throw err;
  }
}
