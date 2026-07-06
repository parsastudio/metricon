export async function hashSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getSaltedIpHash(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || "default-secret-salt-2026";
  return hashSha256(`${ip}:${salt}`);
}

export async function signSession(userId: string): Promise<string> {
  const secret =
    process.env.STRIPE_SECRET_KEY || "default-session-salt-secret-2026";
  const signature = await hashSha256(`${userId}:${secret}`);
  return `${userId}.${signature}`;
}

export async function verifySession(
  signedValue: string
): Promise<string | null> {
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;
  const [userId, signature] = parts;
  const secret =
    process.env.STRIPE_SECRET_KEY || "default-session-salt-secret-2026";
  const expectedSignature = await hashSha256(`${userId}:${secret}`);
  if (signature === expectedSignature) {
    return userId;
  }
  return null;
}
