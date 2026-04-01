-- Migration number: 0002     2026-04-01T00:00:00.000Z

-- MCQ (Multiple Choice Question) table
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

-- MCQ Choice table (up to 4 choices per MCQ)
CREATE TABLE IF NOT EXISTS mcq_choice (
  id TEXT PRIMARY KEY,
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  choice_order INTEGER NOT NULL,
  FOREIGN KEY (mcq_id) REFERENCES mcq(id) ON DELETE CASCADE
);

-- MCQ Attempt table (records user attempts)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcq_user_id ON mcq(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_created_at ON mcq(created_at);

CREATE INDEX IF NOT EXISTS idx_mcq_choice_mcq_id ON mcq_choice(mcq_id);
CREATE INDEX IF NOT EXISTS idx_mcq_choice_order ON mcq_choice(mcq_id, choice_order);

CREATE INDEX IF NOT EXISTS idx_mcq_attempt_mcq_id ON mcq_attempt(mcq_id);
CREATE INDEX IF NOT EXISTS idx_mcq_attempt_user_id ON mcq_attempt(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_attempt_completed_at ON mcq_attempt(completed_at);
