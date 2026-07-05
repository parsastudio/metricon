export async function resolveCountryFromIp(rawIp: string): Promise<string> {
  if (!rawIp || rawIp === "127.0.0.1" || rawIp === "::1") {
    return "Unknown";
  }

  const services = [
    async (ip: string, signal: AbortSignal) => {
      const res = await fetch(`https://ipapi.co/${ip}/country/`, { signal });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length === 2) {
          return text.trim().toUpperCase();
        }
      }
      throw new Error("Failed");
    },
    async (ip: string, signal: AbortSignal) => {
      const res = await fetch(`https://ip-api.com/json/${ip}`, { signal });
      if (res.ok) {
        const data = (await res.json()) as { countryCode?: string };
        if (data.countryCode && data.countryCode.length === 2) {
          return data.countryCode.toUpperCase();
        }
      }
      throw new Error("Failed");
    },
    async (ip: string, signal: AbortSignal) => {
      const res = await fetch(`https://ipwho.is/${ip}`, { signal });
      if (res.ok) {
        const data = (await res.json()) as { country_code?: string };
        if (data.country_code && data.country_code.length === 2) {
          return data.country_code.toUpperCase();
        }
      }
      throw new Error("Failed");
    },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const country = await Promise.any(
      services.map((service) => service(rawIp, controller.signal))
    );
    clearTimeout(timeoutId);
    if (country) {
      return country;
    }
  } catch {
    clearTimeout(timeoutId);
  }

  return "Unknown";
}

export async function resolveCountryFromHeaders(
  reqHeaders: Headers
): Promise<string> {
  const vercelCountry = reqHeaders.get("x-vercel-ip-country");
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  const cfCountry = reqHeaders.get("cf-ipcountry");
  if (cfCountry) {
    return cfCountry.toUpperCase();
  }

  const rawIp = getClientIp(reqHeaders);
  return resolveCountryFromIp(rawIp);
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
