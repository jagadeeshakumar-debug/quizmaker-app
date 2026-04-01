import "server-only";

import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Centralized D1 client utilities for QuizMaker.
// Follows rules in `.cursor/rules/d1.mdc`:
// - All D1 access goes through this module
// - Normalize `?` placeholders to positional `?1`, `?2`, ...
// - Prefer executeQueryFirst for single-row lookups

export type D1DatabaseLike = {
  prepare(query: string): D1PreparedStatementLike;
};

export type D1PreparedStatementLike = {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<T = unknown>(): Promise<{ results: T[] }>;
};

/**
 * Normalize anonymous `?` placeholders to positional `?1`, `?2`, ...
 * Example: "SELECT * FROM user WHERE id = ?" -> "SELECT * FROM user WHERE id = ?1"
 */
export function normalizePlaceholders(query: string): string {
  let index = 0;
  return query.replace(/\?/g, () => {
    index += 1;
    return `?${index}`;
  });
}

/**
 * Execute a read-only query that may return multiple rows.
 */
export async function executeQuery<T = unknown>(
  db: D1DatabaseLike,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const normalized = normalizePlaceholders(sql);
  const stmt = db.prepare(normalized).bind(...params);
  const { results } = await stmt.all<T>();
  return results ?? [];
}

/**
 * Execute a read-only query and return the first row (or null).
 */
export async function executeQueryFirst<T = unknown>(
  db: D1DatabaseLike,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await executeQuery<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a mutation (INSERT/UPDATE/DELETE).
 * Returns the raw D1 response so callers can inspect metadata if needed.
 */
export async function executeMutation(
  db: D1DatabaseLike,
  sql: string,
  params: unknown[] = [],
): Promise<unknown> {
  const normalized = normalizePlaceholders(sql);
  const stmt = db.prepare(normalized).bind(...params);
  // Using all() for mutations is acceptable in D1; callers can ignore results.
  const result = await stmt.all();
  return result;
}

export type BatchStatement = {
  sql: string;
  params?: unknown[];
};

/**
 * Execute a batch of statements in sequence.
 * Simple implementation; can be optimized later if needed.
 */
export async function executeBatch(
  db: D1DatabaseLike,
  statements: BatchStatement[],
): Promise<unknown[]> {
  const results: unknown[] = [];
  for (const { sql, params = [] } of statements) {
    // Reuse executeMutation since batches are typically used for writes.
    // If needed, we can add a read-optimized variant later.
    // eslint-disable-next-line no-await-in-loop
    const res = await executeMutation(db, sql, params);
    results.push(res);
  }
  return results;
}

/**
 * Resolve the bound D1 database from the OpenNext Cloudflare context.
 * This is used by server code (server actions / route handlers).
 * Uses React cache to avoid recreating the client multiple times per request.
 */
export const getDatabase = cache(async (): Promise<D1DatabaseLike> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as CloudflareEnv).quizmaker_database;
    if (!db || typeof db.prepare !== "function") {
      throw new Error(
        "D1 binding `quizmaker_database` not found in Cloudflare env. Check wrangler.jsonc bindings.",
      );
    }
    
    if (process.env.NODE_ENV === "development") {
      try {
        const { ensureTablesExist } = await import("./db-init");
        await ensureTablesExist(db);
      } catch (err) {
        console.warn("Failed to auto-initialize database:", err);
      }
    }
    
    return db;
  } catch (err) {
    console.error("Failed to get database:", err);
    throw err;
  }
});

export function generateId(): string {
  return crypto.randomUUID();
}
