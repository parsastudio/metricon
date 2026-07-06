import fs from "fs";
import path from "path";
import * as mmdb from "mmdb-lib";

const geoCache = new Map<string, string>();
let reader: mmdb.Reader<any> | null = null;

try {
  const dbPath =
    process.env.GEOIP_DB_PATH ||
    path.join(process.cwd(), "GeoLite2-Country.mmdb");
  if (fs.existsSync(dbPath)) {
    const dbBuffer = fs.readFileSync(dbPath);
    reader = new mmdb.Reader(dbBuffer);
  }
} catch {}

export async function resolveCountryFromIp(rawIp: string): Promise<string> {
  if (!rawIp || rawIp === "127.0.0.1" || rawIp === "::1") {
    return "Unknown";
  }

  if (geoCache.has(rawIp)) {
    return geoCache.get(rawIp)!;
  }

  if (reader) {
    try {
      const record = reader.get(rawIp);
      const countryCode = record?.country?.iso_code || record?.country_code;
      if (
        countryCode &&
        typeof countryCode === "string" &&
        countryCode.length === 2
      ) {
        const result = countryCode.toUpperCase();
        geoCache.set(rawIp, result);
        return result;
      }
    } catch {}
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 350);

  const services = [
    async (ip: string, signal: AbortSignal) => {
      const res = await fetch(`https://ipapi.co/${ip}/country/`, { signal });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length === 2) {
          return text.trim().toUpperCase();
        }
      }
      throw new Error();
    },
    async (ip: string, signal: AbortSignal) => {
      const res = await fetch(`http://ip-api.com/json/${ip}`, { signal });
      if (res.ok) {
        const data = (await res.json()) as { countryCode?: string };
        if (data.countryCode && data.countryCode.length === 2) {
          return data.countryCode.toUpperCase();
        }
      }
      throw new Error();
    },
  ];

  try {
    const country = await Promise.any(
      services.map((service) => service(rawIp, controller.signal))
    );
    clearTimeout(timeoutId);
    if (country) {
      geoCache.set(rawIp, country);
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
