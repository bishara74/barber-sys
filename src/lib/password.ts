// PBKDF2 through WebCrypto: native in Workers and Node, and cheap on the Workers CPU budget.
// Workers caps PBKDF2 at 100,000 iterations. scripts/create-owner.mjs uses the same format.
const ITERATIONS = 100_000;
const KEY_BYTES = 32;
const PREFIX = "pbkdf2_sha256";

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return [PREFIX, ITERATIONS, toBase64(salt), toBase64(hash)].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, iterations, salt, hash] = stored.split("$");
  if (prefix !== PREFIX || !iterations || !salt || !hash) return false;

  const expected = fromBase64(hash);
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  if (actual.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
