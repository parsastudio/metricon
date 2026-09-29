import { db } from "@/lib/db";
import { analytics } from "@/lib/schema";
import { eq, count, sql } from "drizzle-orm";
import { recordClick } from "@/actions/analytics";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { after } from "next/server";
import { IS_DEMO_MODE } from "@/core/config";
import { scrapeUrlMetadata } from "@/lib/metadata-scraper";
import { getCachedWorkspace, getCachedLink } from "@/lib/cached-queries";
import { resolveCountryFromHeaders, getClientIp } from "@/lib/geoip";
import { hashSha256, getSaltedIpHash } from "@/lib/crypto";
import { generateUnlockSignature } from "@/actions/links-security";

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

  const workspace = await getCachedWorkspace(workspacePrefix);

  if (!workspace) {
    redirect("/expired");
  }

  const link = await getCachedLink(workspace.id, code);

  if (!link || !link.isActive) {
    redirect("/expired");
  }

  if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
    redirect("/expired");
  }

  if (link.maxClicks && link.clicksCount >= link.maxClicks) {
    redirect("/expired");
  }

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") || "";
  const referrer = reqHeaders.get("referer") || "Direct";
  const rawIp = getClientIp(reqHeaders);
  const ipHash = await getSaltedIpHash(rawIp);

  if (link.password) {
    const cookieStore = await cookies();
    const unlockedCookie = cookieStore.get(
      `link_unlocked_${workspacePrefix}_${code}`
    )?.value;
    const expectedSignature = await generateUnlockSignature(
      workspacePrefix,
      code,
      ipHash
    );
    const isUnlocked = unlockedCookie === expectedSignature;
    if (!isUnlocked) {
      redirect(`/r/${workspacePrefix}/${code}/protected`);
    }
  }

  let device = "Desktop";
  if (__device && (process.env.NODE_ENV === "development" || IS_DEMO_MODE)) {
    device = __device;
  } else if (/mobile/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet/i.test(userAgent)) {
    device = "Tablet";
  }

  let browser = "Unknown";
  if (/chrome/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/safari/i.test(userAgent)) {
    browser = "Safari";
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
  }

  let country = "Unknown";
  if (__country && (process.env.NODE_ENV === "development" || IS_DEMO_MODE)) {
    country = __country;
  } else {
    country = await resolveCountryFromHeaders(reqHeaders);
  }

  let targetUrl = link.originalUrl;
  let hasGeoMatch = false;

  if (link.geoRouting && country !== "Unknown") {
    const geoMatch = link.geoRouting[country.toUpperCase()];
    if (geoMatch) {
      targetUrl = geoMatch;
      hasGeoMatch = true;
    }
  }

  if (!hasGeoMatch) {
    if (device === "Mobile") {
      if (link.iosUrl && /iphone|ipad/i.test(userAgent)) {
        targetUrl = link.iosUrl;
      } else if (link.androidUrl && /android/i.test(userAgent)) {
        targetUrl = link.androidUrl;
      }
    } else if (device === "Desktop" && link.desktopUrl) {
      targetUrl = link.desktopUrl;
    }
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

  after(async () => {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(analytics).values({
          id: crypto.randomUUID(),
          linkId: link.id,
          country: country || "Unknown",
          referrer: referrer || "Direct",
          device: device || "Desktop",
          browser: browser || "Unknown",
          ipHash,
          timestamp: new Date(),
        });

        await tx.execute(sql`
          UPDATE links
          SET clicks_count = clicks_count + 1
          WHERE id = ${link.id};
        `);
      });
    } catch {}
  });

  redirect(targetUrl);
}
