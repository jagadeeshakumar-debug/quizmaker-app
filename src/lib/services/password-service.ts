import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  // bcryptjs is synchronous, but we wrap in a Promise to keep an async API
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(
      DEFAULT_ROUNDS,
      (saltErr: unknown, salt: string) => {
      if (saltErr) return reject(saltErr);
      bcrypt.hash(plain, salt, (hashErr, hash) => {
        if (hashErr) return reject(hashErr);
        return resolve(hash);
      });
      },
    );
  });
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plain, hash, (err: unknown, same: boolean) => {
      if (err) return reject(err);
      return resolve(same);
    });
  });
}

