declare module "bcryptjs" {
  const bcrypt: {
    genSalt(rounds: number, callback: (err: unknown, salt: string) => void): void;
    hash(
      plain: string,
      salt: string,
      callback: (err: unknown, hash: string) => void,
    ): void;
    compare(
      plain: string,
      hash: string,
      callback: (err: unknown, same: boolean) => void,
    ): void;
  };

  export default bcrypt;
}

