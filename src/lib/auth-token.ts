const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || "queijo";
const JWT_ALGORITHM = "HS256";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

export type AuthTokenPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

const base64UrlEncode = (value: string | ArrayBuffer) => {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlDecode = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const createSignature = async (unsignedToken: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsignedToken));
  return base64UrlEncode(signature);
};

export const createAuthToken = async (user: { id: string; role: string }) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: JWT_ALGORITHM,
    typ: "JWT",
  };
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = await createSignature(unsignedToken);
  return `${unsignedToken}.${signature}`;
};

export const decodeAuthToken = (token: string | null): AuthTokenPayload | null => {
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload;
  } catch {
    return null;
  }
};

export const verifyAuthToken = async (token: string | null) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = await createSignature(`${header}.${payload}`);
  if (signature !== expectedSignature) return null;

  const decoded = decodeAuthToken(token);
  if (!decoded || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
  return decoded;
};
