import { headers } from "next/headers";

export async function getAppOrigin(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || "https";

    if (host) {
      return `${proto}://${host}`;
    }
  } catch {}

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
