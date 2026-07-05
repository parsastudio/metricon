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
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);
      const country = await service(rawIp, controller.signal);
      clearTimeout(timeoutId);
      if (country) {
        return country;
      }
    } catch {
      continue;
    }
  }
  return "Unknown";
}
