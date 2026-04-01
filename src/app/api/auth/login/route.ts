import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/d1-client";
import { login, type LoginInput } from "@/lib/services/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { identifier?: string; password?: string };
    
    const input: LoginInput = {
      identifier: body.identifier ?? "",
      password: body.password ?? "",
    };

    const db = await getDatabase();
    const { user, session } = await login(db, input);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );

    response.cookies.set("qm_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid credentials";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
