import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { getCurrentUser } from "@/lib/services/auth-service";
import {
  createAttempt,
  getUserAttemptForMCQ,
  type CreateAttemptInput,
} from "@/lib/services/mcq-attempt-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
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

    const body = await request.json() as {
      selectedChoiceIds?: string[];
    };

    const input: CreateAttemptInput = {
      mcqId,
      userId: user.id,
      selectedChoiceIds: body.selectedChoiceIds ?? [],
    };

    const result = await createAttempt(db, input);

    return NextResponse.json(
      {
        success: true,
        attempt: result.attempt,
        correctChoiceIds: result.correctChoiceIds,
        explanation: result.explanation,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit attempt";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

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

    const attempts = await getUserAttemptForMCQ(db, mcqId, user.id);

    return NextResponse.json(
      { success: true, attempts },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch attempts";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
