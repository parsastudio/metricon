export async function hashSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getSaltedIpHash(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error("Missing IP_HASH_SALT environment variable");
  }
  return hashSha256(`${ip}:${salt}`);
}

export async function signSession(userId: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  const signature = await hashSha256(`${userId}:${secret}`);
  return `${userId}.${signature}`;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifySession(
  signedValue: string
): Promise<string | null> {
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;
  const [userId, signature] = parts;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  const expectedSignature = await hashSha256(`${userId}:${secret}`);
  if (timingSafeEqual(signature, expectedSignature)) {
    return userId;
  }
  return null;
}
