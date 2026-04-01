"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/d1-client";
import { revokeSession } from "@/lib/services/session-service";

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("qm_session")?.value;

    if (sessionId) {
      const db = await getDatabase();
      await revokeSession(db, sessionId, Date.now());
    }

    cookieStore.delete("qm_session");
  } catch (err) {
    console.error("Logout error:", err);
  }
  
  redirect("/login");
}
