"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/d1-client";
import { login, signUp } from "@/lib/services/auth-service";
import type { LoginInput, SignUpInput } from "@/lib/services/auth-service";

export type AuthFormState = {
  error: string | null;
};

async function setSessionCookie(sessionId: string, expiresAtMs: number) {
  const store = await cookies();
  store.set("qm_session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAtMs),
  });
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const input: SignUpInput = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      username: String(formData.get("username") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const db = await getDatabase();
    const { session } = await signUp(db, input);

    await setSessionCookie(session.id, session.expiresAt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign up";
    return { error: message };
  }
  
  redirect("/mcqs");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const input: LoginInput = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const db = await getDatabase();
    const { session } = await login(db, input);

    await setSessionCookie(session.id, session.expiresAt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid credentials";
    return { error: message };
  }
  
  redirect("/mcqs");
}

