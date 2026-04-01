import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { getCurrentUser } from "@/lib/services/auth-service";
import {
  listAllMCQsWithChoices,
  createMCQ,
  type CreateMCQInput,
} from "@/lib/services/mcq-service";

export async function GET(request: NextRequest) {
  try {
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

    const mcqs = await listAllMCQsWithChoices(db, user.id);

    return NextResponse.json(
      { success: true, mcqs },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch MCQs";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      title?: string;
      description?: string;
      question?: string;
      choices?: Array<{ text: string; isCorrect: boolean }>;
    };

    const input: CreateMCQInput = {
      userId: user.id,
      title: body.title ?? "",
      description: body.description,
      question: body.question ?? "",
      choices: (body.choices ?? []).map(c => ({
        choiceText: c.text,
        isCorrect: c.isCorrect,
      })),
    };

    const mcq = await createMCQ(db, input);

    return NextResponse.json(
      { success: true, mcq },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create MCQ";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
