import { executeQueryFirst, executeMutation, type D1DatabaseLike } from "@/lib/d1-client";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

export type CreateUserInput = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
};

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(
  db: D1DatabaseLike,
  id: string,
): Promise<User | null> {
  const row = await executeQueryFirst<UserRow>(
    db,
    "SELECT * FROM user WHERE id = ?",
    [id],
  );
  return row ? mapRowToUser(row) : null;
}

export async function getUserByUsernameOrEmail(
  db: D1DatabaseLike,
  identifier: string,
): Promise<User | null> {
  const normalized = identifier.trim().toLowerCase();
  const row = await executeQueryFirst<UserRow>(
    db,
    "SELECT * FROM user WHERE LOWER(username) = ? OR LOWER(email) = ?",
    [normalized, normalized],
  );
  return row ? mapRowToUser(row) : null;
}

export async function createUser(
  db: D1DatabaseLike,
  input: CreateUserInput,
): Promise<User> {
  await executeMutation(
    db,
    `
      INSERT INTO user (
        id,
        first_name,
        last_name,
        username,
        email,
        password_hash,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.firstName,
      input.lastName,
      input.username,
      input.email,
      input.passwordHash,
      input.createdAt,
      input.updatedAt,
    ],
  );

  const created = await getUserById(db, input.id);
  if (!created) {
    throw new Error("Failed to load user after insert");
  }
  return created;
}

