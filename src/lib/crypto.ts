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
