import "server-only";

import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { requireUser, getCurrentUser } from "@/lib/services/auth-service";
import type { User } from "@/lib/services/user-service";

export async function getAuthenticatedUser(): Promise<User> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("qm_session")?.value;
  const db = await getDatabase();
  return requireUser(db, sessionId);
}

export async function getOptionalUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("qm_session")?.value;
  const db = await getDatabase();
  return getCurrentUser(db, sessionId);
}

export async function requireAuth(): Promise<User> {
  return getAuthenticatedUser();
}
