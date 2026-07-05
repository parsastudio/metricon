import { Reader } from "mmdb-lib";

interface GeoLiteCountryResponse {
  country?: {
    iso_code?: string;
  };
}

let cachedReader: Reader | null = null;

async function getReader(): Promise<Reader | null> {
  if (cachedReader) {
    return cachedReader;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@ip-location-db/geolite2-country-mmdb/geolite2-country.mmdb",
      {
        signal: controller.signal,
        next: { revalidate: 86400 },
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      cachedReader = new Reader(new Uint8Array(buffer));
      return cachedReader;
    }
  } catch {}

  return null;
}

export async function resolveCountryFromIp(rawIp: string): Promise<string> {
  if (!rawIp || rawIp === "127.0.0.1" || rawIp === "::1") {
    return "Unknown";
  }

  try {
    const reader = await getReader();
    if (reader) {
      const result = reader.lookup(rawIp) as GeoLiteCountryResponse | null;
      if (result?.country?.iso_code) {
        return result.country.iso_code.toUpperCase();
      }
    }
  } catch {}

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
  const timeoutId = setTimeout(() => controller.abort(), 800);

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
