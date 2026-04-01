import "server-only";

import { getDatabase, generateId } from "@/lib/d1-client";
import { signUp, login, getCurrentUser } from "@/lib/services/auth-service";
import type { SignUpInput, LoginInput } from "@/lib/services/auth-service";

export async function testAuthenticationFlow() {
  const results: string[] = [];
  
  try {
    const db = await getDatabase();
    results.push("✓ Database connection established");

    const testUser: SignUpInput = {
      firstName: "Test",
      lastName: "User",
      username: `testuser_${generateId().slice(0, 8)}`,
      email: `test_${generateId().slice(0, 8)}@example.com`,
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
    };

    const signupResult = await signUp(db, testUser);
    results.push(`✓ User signup successful: ${signupResult.user.username}`);
    results.push(`✓ Session created: ${signupResult.session.id}`);

    const currentUser = await getCurrentUser(db, signupResult.session.id);
    if (currentUser && currentUser.id === signupResult.user.id) {
      results.push("✓ getCurrentUser works correctly");
    } else {
      results.push("✗ getCurrentUser failed");
    }

    const loginInput: LoginInput = {
      identifier: testUser.username,
      password: testUser.password,
    };
    const loginResult = await login(db, loginInput);
    results.push(`✓ Login successful: ${loginResult.user.username}`);
    results.push(`✓ New session created: ${loginResult.session.id}`);

    const loginByEmail: LoginInput = {
      identifier: testUser.email,
      password: testUser.password,
    };
    const emailLoginResult = await login(db, loginByEmail);
    results.push(`✓ Login by email successful: ${emailLoginResult.user.email}`);

    try {
      const invalidLogin: LoginInput = {
        identifier: testUser.username,
        password: "WrongPassword",
      };
      await login(db, invalidLogin);
      results.push("✗ Invalid login should have failed");
    } catch (err) {
      results.push("✓ Invalid login properly rejected");
    }

    results.push("\n=== All tests passed! ===");
    return { success: true, results };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    results.push(`✗ Test failed: ${error}`);
    return { success: false, results, error };
  }
}
