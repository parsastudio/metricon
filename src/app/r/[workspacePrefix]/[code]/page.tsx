import { db } from "@/lib/db";
import { links, workspaces, analytics } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";
import { recordClick } from "@/actions/analytics";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createHash } from "crypto";
import { after } from "next/server";
import { IS_DEMO_MODE } from "@/core/config";
import { scrapeUrlMetadata } from "@/lib/metadata-scraper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workspacePrefix: string; code: string }>;
  searchParams: Promise<{ __country?: string; __device?: string }>;
}

export default async function RedirectPage({
  params,
  searchParams,
}: PageProps) {
  const { workspacePrefix, code } = await params;
  const { __country, __device } = await searchParams;

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

  const [clicksCountResult] = await db
    .select({ value: count() })
    .from(analytics)
    .where(eq(analytics.linkId, link.id));
  const currentClicksCount = clicksCountResult?.value || 0;

  if (link.maxClicks && currentClicksCount >= link.maxClicks) {
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
  if (__device && (process.env.NODE_ENV === "development" || IS_DEMO_MODE)) {
    device = __device;
  } else if (/mobile/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet/i.test(userAgent)) {
    device = "Tablet";
  }

  let browser = "Unknown";
  if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";

  let country = "Unknown";
  const geoCountry = reqHeaders.get("x-vercel-ip-country");
  if (__country && (process.env.NODE_ENV === "development" || IS_DEMO_MODE)) {
    country = __country;
  } else if (geoCountry) {
    country = geoCountry;
  } else if (rawIp && rawIp !== "127.0.0.1" && rawIp !== "::1") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 400);
      const res = await fetch(`https://ipapi.co/${rawIp}/country/`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length === 2) {
          country = text.trim().toUpperCase();
        }
      }
    } catch {}
  }

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
  } else if (device === "Desktop" && link.desktopUrl) {
    targetUrl = link.desktopUrl;
  }

  const botRegex =
    /bot|crawl|spider|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp|discordbot|linkedinbot/i;
  const isBot = botRegex.test(userAgent);

  if (isBot) {
    const metadata = await scrapeUrlMetadata(
      targetUrl,
      link.title || "Secure Link"
    );
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>{metadata.title}</title>
          <meta name="description" content={metadata.description} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={metadata.title} />
          <meta property="og:description" content={metadata.description} />
          {metadata.image && (
            <meta property="og:image" content={metadata.image} />
          )}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={metadata.title} />
          <meta name="twitter:description" content={metadata.description} />
          {metadata.image && (
            <meta name="twitter:image" content={metadata.image} />
          )}
          <meta httpEquiv="refresh" content={`0;url=${targetUrl}`} />
        </head>
        <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4 text-center font-sans">
          <div className="space-y-4">
            <div className="border-primary mx-auto size-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-muted-foreground text-xs">
              Redirecting to target secure destination safely...
            </p>
            <a
              href={targetUrl}
              className="text-primary font-mono text-xs underline"
            >
              {targetUrl}
            </a>
          </div>
        </body>
      </html>
    );
  }

  after(() => {
    recordClick(link.id, {
      country,
      referrer,
      device,
      browser,
      ipHash,
    }).catch(() => {});
  });

  redirect(targetUrl);
}
