const HASH_ITERATIONS = 100000;
const HASH_LENGTH_BITS = 256;

const base64UrlEncode = (value: ArrayBuffer) => {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlDecode = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const createSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
};

const derivePasswordHash = async (password: string, salt: string) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64UrlDecode(salt),
      iterations: HASH_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_LENGTH_BITS
  );
  return base64UrlEncode(derivedBits);
};

export const hashPassword = async (password: string) => {
  const salt = createSalt();
  const passwordHash = await derivePasswordHash(password, salt);
  return { passwordHash, passwordSalt: salt };
};

export const verifyPassword = async (password: string, passwordHash?: string, passwordSalt?: string) => {
  if (!passwordHash || !passwordSalt) return false;
  const candidateHash = await derivePasswordHash(password, passwordSalt);
  return candidateHash === passwordHash;
};
