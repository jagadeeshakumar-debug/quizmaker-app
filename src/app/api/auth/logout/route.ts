import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { revokeSession } from "@/lib/services/session-service";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("qm_session")?.value;

    if (sessionId) {
      const db = await getDatabase();
      await revokeSession(db, sessionId, Date.now());
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    response.cookies.delete("qm_session");

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to logout";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
