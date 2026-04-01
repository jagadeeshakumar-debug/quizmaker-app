import { executeMutation, executeQueryFirst, type D1DatabaseLike } from "@/lib/d1-client";

export type Session = {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  revokedAt: number | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  revoked_at: number | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
};

function mapRowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
  };
}

export async function getSessionById(
  db: D1DatabaseLike,
  id: string,
): Promise<Session | null> {
  const row = await executeQueryFirst<SessionRow>(
    db,
    "SELECT * FROM session WHERE id = ?",
    [id],
  );
  return row ? mapRowToSession(row) : null;
}

export async function createSession(
  db: D1DatabaseLike,
  session: Session,
): Promise<Session> {
  await executeMutation(
    db,
    `
      INSERT INTO session (
        id,
        user_id,
        expires_at,
        created_at,
        revoked_at,
        ip_hash,
        user_agent_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      session.id,
      session.userId,
      session.expiresAt,
      session.createdAt,
      session.revokedAt,
      session.ipHash ?? null,
      session.userAgentHash ?? null,
    ],
  );

  const created = await getSessionById(db, session.id);
  if (!created) {
    throw new Error("Failed to load session after insert");
  }
  return created;
}

export async function revokeSession(
  db: D1DatabaseLike,
  id: string,
  revokedAt: number,
): Promise<void> {
  await executeMutation(
    db,
    "UPDATE session SET revoked_at = ? WHERE id = ?",
    [revokedAt, id],
  );
}

export function isSessionActive(session: Session | null, now: number): boolean {
  if (!session) return false;
  if (session.revokedAt != null && session.revokedAt <= now) return false;
  if (session.expiresAt <= now) return false;
  return true;
}

