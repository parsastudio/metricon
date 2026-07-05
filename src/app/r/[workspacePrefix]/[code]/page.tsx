import { db } from "@/lib/db";
import { links, workspaces } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { recordClick } from "@/actions/analytics";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createHash } from "crypto";
import { after } from "next/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workspacePrefix: string; code: string }>;
}

export default async function RedirectPage({ params }: PageProps) {
  const { workspacePrefix, code } = await params;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.shortPrefix, workspacePrefix))
    .limit(1);

  if (!workspace) {
    redirect("/expired");
  }

  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.shortCode, code)))
    .limit(1);

  if (!link || !link.isActive) {
    redirect("/expired");
  }

  if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
    redirect("/expired");
  }

  if (link.maxClicks && link.clicksCount >= link.maxClicks) {
    redirect("/expired");
  }

  if (link.password) {
    const cookieStore = await cookies();
    const isUnlocked =
      cookieStore.get(`link_unlocked_${workspacePrefix}_${code}`)?.value ===
      "true";
    if (!isUnlocked) {
      redirect(`/r/${workspacePrefix}/${code}/protected`);
    }
  }

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") || "";
  const referrer = reqHeaders.get("referer") || "Direct";
  const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const ipHash = createHash("sha256").update(rawIp).digest("hex");

  let device = "Desktop";
  if (/mobile/i.test(userAgent)) device = "Mobile";
  else if (/tablet/i.test(userAgent)) device = "Tablet";

  let browser = "Unknown";
  if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";

  let country = "Unknown";
  const geoCountry = reqHeaders.get("x-vercel-ip-country");
  if (geoCountry) country = geoCountry;

  after(() => {
    recordClick(link.id, {
      country,
      referrer,
      device,
      browser,
      ipHash,
    }).catch(() => {});
  });

  let targetUrl = link.originalUrl;

  if (link.geoRouting && country !== "Unknown") {
    const geoMatch = link.geoRouting[country.toUpperCase()];
    if (geoMatch) targetUrl = geoMatch;
  }

  if (device === "Mobile") {
    if (link.iosUrl && /iphone|ipad/i.test(userAgent)) {
      targetUrl = link.iosUrl;
    } else if (link.androidUrl && /android/i.test(userAgent)) {
      targetUrl = link.androidUrl;
    }
  }

  redirect(targetUrl);
}
