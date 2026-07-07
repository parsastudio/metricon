export async function resolveCountryFromIp(rawIp: string): Promise<string> {
  if (
    !rawIp ||
    rawIp === "127.0.0.1" ||
    rawIp === "::1" ||
    rawIp.startsWith("192.168.") ||
    rawIp.startsWith("10.")
  ) {
    return "Unknown";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400);

    const response = await fetch(`https://ipapi.co/${rawIp}/country/`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const country = await response.text();
      if (country && country.trim().length === 2) {
        return country.trim().toUpperCase();
      }
    }
  } catch {}

  return "Unknown";
}

export async function resolveCountryFromHeaders(
  reqHeaders: Headers
): Promise<string> {
  const cfCountry = reqHeaders.get("cf-ipcountry");
  if (cfCountry && cfCountry.length === 2) {
    return cfCountry.toUpperCase();
  }

  const vercelCountry = reqHeaders.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry.length === 2) {
    return vercelCountry.toUpperCase();
  }

  const cfIp = reqHeaders.get("cf-connecting-ip");
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const rawIp = cfIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "");

  if (rawIp) {
    return await resolveCountryFromIp(rawIp);
  }

  return "Unknown";
}

export function getClientIp(reqHeaders: Headers): string {
  const cfIp = reqHeaders.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = reqHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}
