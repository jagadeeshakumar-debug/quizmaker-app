import { NextResponse } from "next/server";
import { testAuthenticationFlow } from "@/lib/test-integration";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are disabled in production" },
      { status: 403 }
    );
  }

  try {
    const result = await testAuthenticationFlow();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
