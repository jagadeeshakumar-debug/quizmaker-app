import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/d1-client";
import { getCurrentUser } from "@/lib/services/auth-service";
import {
  getMCQWithChoices,
  updateMCQ,
  deleteMCQ,
  verifyMCQOwnership,
  type UpdateMCQInput,
} from "@/lib/services/mcq-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const db = await getDatabase();
    const mcq = await getMCQWithChoices(db, id);

    if (!mcq) {
      return NextResponse.json(
        { success: false, error: "MCQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, mcq },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch MCQ";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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

    const isOwner = await verifyMCQOwnership(db, id, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Not authorized to update this MCQ" },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      title?: string;
      description?: string;
      question?: string;
      choices?: Array<{ id?: string; text: string; isCorrect: boolean }>;
    };

    const input: UpdateMCQInput = {
      title: body.title,
      description: body.description,
      question: body.question,
      choices: body.choices?.map(c => ({
        choiceText: c.text,
        isCorrect: c.isCorrect,
      })),
    };

    const mcq = await updateMCQ(db, id, input);

    return NextResponse.json(
      { success: true, mcq },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update MCQ";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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

    const isOwner = await verifyMCQOwnership(db, id, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this MCQ" },
        { status: 403 }
      );
    }

    await deleteMCQ(db, id);

    return NextResponse.json(
      { success: true, message: "MCQ deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete MCQ";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
