import type { D1DatabaseLike } from "@/lib/d1-client";
import { getUserById, getUserByUsernameOrEmail, createUser, type User } from "@/lib/services/user-service";
import { hashPassword, verifyPassword } from "@/lib/services/password-service";
import {
  createSession,
  getSessionById,
  isSessionActive,
  type Session,
} from "@/lib/services/session-service";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SignUpInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string; // username or email
  password: string;
};

export type AuthResult = {
  user: User;
  session: Session;
};

function generateId(): string {
  return crypto.randomUUID();
}

function nowMs(): number {
  return Date.now();
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function validateSignUpInput(input: SignUpInput): void {
  const username = input.username.trim();
  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (firstName.length === 0) {
    throw new Error("First name is required");
  }
  if (lastName.length === 0) {
    throw new Error("Last name is required");
  }
  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!email.includes("@")) {
    throw new Error("Email must be a valid email address");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (input.password !== input.confirmPassword) {
    throw new Error("Password and confirmation do not match");
  }
}

export async function signUp(
  db: D1DatabaseLike,
  input: SignUpInput,
): Promise<AuthResult> {
  validateSignUpInput(input);

  const normalizedIdentifier = normalizeIdentifier(input.username);
  const existing = await getUserByUsernameOrEmail(db, normalizedIdentifier);
  if (existing) {
    throw new Error("A user with that username or email already exists");
  }

  const id = generateId();
  const timestamp = nowMs();
  const passwordHash = await hashPassword(input.password);

  const user = await createUser(db, {
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const session: Session = {
    id: generateId(),
    userId: user.id,
    createdAt: timestamp,
    expiresAt: timestamp + SESSION_TTL_MS,
    revokedAt: null,
    ipHash: null,
    userAgentHash: null,
  };

  const createdSession = await createSession(db, session);

  return {
    user,
    session: createdSession,
  };
}

export async function login(
  db: D1DatabaseLike,
  input: LoginInput,
): Promise<AuthResult> {
  const identifier = normalizeIdentifier(input.identifier);
  const user = await getUserByUsernameOrEmail(db, identifier);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid credentials");
  }

  const timestamp = nowMs();
  const session: Session = {
    id: generateId(),
    userId: user.id,
    createdAt: timestamp,
    expiresAt: timestamp + SESSION_TTL_MS,
    revokedAt: null,
    ipHash: null,
    userAgentHash: null,
  };

  const createdSession = await createSession(db, session);

  return {
    user,
    session: createdSession,
  };
}

export async function getCurrentUser(
  db: D1DatabaseLike,
  sessionId: string | null | undefined,
): Promise<User | null> {
  if (!sessionId) return null;
  const session = await getSessionById(db, sessionId);
  if (!session) return null;
  if (!isSessionActive(session, nowMs())) return null;
  return getUserById(db, session.userId);
}

export async function requireUser(
  db: D1DatabaseLike,
  sessionId: string | null | undefined,
): Promise<User> {
  const user = await getCurrentUser(db, sessionId);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

