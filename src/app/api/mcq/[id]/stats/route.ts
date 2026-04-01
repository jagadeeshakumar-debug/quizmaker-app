import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { getCurrentUser } from "@/lib/services/auth-service";
import { getMCQStats } from "@/lib/services/mcq-attempt-service";
import { verifyMCQOwnership } from "@/lib/services/mcq-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: mcqId } = await context.params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("qm_session")?.value;
    const db = await getDatabase();
    const user = await getCurrentUser(db, sessionId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const isOwner = await verifyMCQOwnership(db, mcqId, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Not authorized to view stats" },
        { status: 403 }
      );
    }

    const stats = await getMCQStats(db, mcqId);

    return NextResponse.json(
      { success: true, stats },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
