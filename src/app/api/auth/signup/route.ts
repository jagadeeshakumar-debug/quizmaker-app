import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/d1-client";
import { signUp, type SignUpInput } from "@/lib/services/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { 
      firstName?: string; 
      lastName?: string; 
      username?: string; 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
    };
    
    const input: SignUpInput = {
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      username: body.username ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      confirmPassword: body.confirmPassword ?? "",
    };

    const db = await getDatabase();
    const { user, session } = await signUp(db, input);

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
      { status: 201 }
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
    const message = err instanceof Error ? err.message : "Failed to sign up";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
