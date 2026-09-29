"use server";

import { db } from "@/lib/db";
import { analytics, links } from "@/lib/schema";
import { eq, gte, lte, and, inArray, sql, count, desc } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";

export async function getWorkspaceAnalytics(
  workspaceId: string,
  timeframe: string,
  customStart?: string,
  customEnd?: string
) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);

  let startDate = new Date();
  let endDate = new Date();

  if (customStart && customEnd) {
    const startParsed = new Date(customStart);
    const endParsed = new Date(customEnd);

    if (!isNaN(startParsed.getTime()) && !isNaN(endParsed.getTime())) {
      startDate = startParsed;
      startDate.setHours(0, 0, 0, 0);
      endDate = endParsed;
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }
  } else {
    const now = new Date();
    if (timeframe === "24h") {
      startDate.setHours(now.getHours() - 24);
    } else if (timeframe === "7d") {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === "30d") {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }
  }

  const workspaceLinks = await db
    .select({
      id: links.id,
      shortCode: links.shortCode,
      title: links.title,
    })
    .from(links)
    .where(eq(links.workspaceId, workspaceId));

  if (workspaceLinks.length === 0) {
    return {
      kpi: { totalClicks: 0, uniqueClicks: 0, topLink: "N/A" },
      countries: [],
      referrers: [],
      devices: [],
      timeSeries: [],
    };
  }

  const linkIds = workspaceLinks.map((l) => l.id);

  const [kpi] = await db
    .select({
      totalClicks: count(),
      uniqueClicks: sql<number>`count(distinct ${analytics.ipHash})`,
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    );

  const [topLinkResult] = await db
    .select({
      linkId: analytics.linkId,
      clicks: count(),
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    )
    .groupBy(analytics.linkId)
    .orderBy(desc(count()))
    .limit(1);

  let topLink = "N/A";
  if (topLinkResult) {
    const matched = workspaceLinks.find((l) => l.id === topLinkResult.linkId);
    if (matched) {
      topLink = matched.title || matched.shortCode;
    }
  }

  const countries = await db
    .select({
      name: analytics.country,
      value: count(),
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    )
    .groupBy(analytics.country)
    .orderBy(desc(count()))
    .limit(10);

  const referrers = await db
    .select({
      name: analytics.referrer,
      value: count(),
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    )
    .groupBy(analytics.referrer)
    .orderBy(desc(count()))
    .limit(10);

  const devices = await db
    .select({
      name: analytics.device,
      value: count(),
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    )
    .groupBy(analytics.device)
    .orderBy(desc(count()))
    .limit(5);

  const rawTimeSeries = await db
    .select({
      date: sql<string>`to_char(${analytics.timestamp}, 'YYYY-MM-DD')`,
      clicks: count(),
    })
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate),
        lte(analytics.timestamp, endDate)
      )
    )
    .groupBy(sql`to_char(${analytics.timestamp}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${analytics.timestamp}, 'YYYY-MM-DD')`);

  const timeSeriesMap: Record<string, number> = {};
  const iterDate = new Date(startDate);
  const endIterDate = new Date(endDate);
  while (iterDate <= endIterDate) {
    const dateStr = iterDate.toISOString().split("T")[0];
    timeSeriesMap[dateStr] = 0;
    iterDate.setDate(iterDate.getDate() + 1);
  }

  rawTimeSeries.forEach((entry) => {
    if (entry.date in timeSeriesMap) {
      timeSeriesMap[entry.date] = entry.clicks;
    }
  });

  const timeSeries = Object.entries(timeSeriesMap)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    kpi: {
      totalClicks: kpi?.totalClicks || 0,
      uniqueClicks: kpi?.uniqueClicks || 0,
      topLink,
    },
    countries,
    referrers,
    devices,
    timeSeries,
  };
}

export async function recordClick(
  linkId: string,
  info: {
    country: string;
    referrer: string;
    device: string;
    browser: string;
    ipHash: string;
  }
) {
  await db.insert(analytics).values({
    id: crypto.randomUUID(),
    linkId,
    country: info.country || "Unknown",
    referrer: info.referrer || "Direct",
    device: info.device || "Desktop",
    browser: info.browser || "Unknown",
    ipHash: info.ipHash,
    timestamp: new Date(),
  });
}

export async function syncLinksClicks() {
  await db.execute(sql`
    UPDATE links
    SET clicks_count = GREATEST(
      links.clicks_count,
      COALESCE((
        SELECT CAST(COUNT(*) AS integer)
        FROM analytics
        WHERE analytics.link_id = links.id
      ), 0)
    ),
    updated_at = NOW()
    WHERE id IN (
      SELECT DISTINCT link_id
      FROM analytics
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    );
  `);
}

export async function seedMockData(workspaceId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);

    const link1Id = crypto.randomUUID();
    const link2Id = crypto.randomUUID();
    const link3Id = crypto.randomUUID();

    const existing = await db
      .select({ shortCode: links.shortCode })
      .from(links)
      .where(eq(links.workspaceId, workspaceId));

    const existingCodes = new Set(existing.map((e) => e.shortCode));
    const linksToInsert = [];

    if (!existingCodes.has("launch-2026")) {
      linksToInsert.push({
        id: link1Id,
        workspaceId,
        shortCode: "launch-2026",
        originalUrl: "https://github.com/metricon/launch",
        title: "Product Launch Campaign Page",
        clicksCount: 142,
      });
    }

    if (!existingCodes.has("pricing-pro")) {
      linksToInsert.push({
        id: link2Id,
        workspaceId,
        shortCode: "pricing-pro",
        originalUrl: "https://metricon.co/pricing",
        title: "Pro Subscription Checkout Page",
        clicksCount: 84,
      });
    }

    if (!existingCodes.has("newsletter-sub")) {
      linksToInsert.push({
        id: link3Id,
        workspaceId,
        shortCode: "newsletter-sub",
        originalUrl: "https://metricon.co/blog",
        title: "Newsletter Opt-in Success Page",
        clicksCount: 39,
      });
    }

    if (linksToInsert.length > 0) {
      await db.insert(links).values(linksToInsert);
    }

    const countries = ["US", "GB", "DE", "FR", "JP", "CA", "AU"];
    const referrers = [
      "Twitter",
      "LinkedIn",
      "Google",
      "GitHub",
      "Direct",
      "Reddit",
    ];
    const devices = ["Desktop", "Mobile", "Tablet"];
    const browsers = ["Chrome", "Safari", "Firefox", "Edge"];

    const clicksToInsert = [];
    const now = new Date();

    if (!existingCodes.has("launch-2026")) {
      for (let i = 0; i < 142; i++) {
        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 30));
        clicksToInsert.push({
          id: crypto.randomUUID(),
          linkId: link1Id,
          timestamp: date,
          country: countries[Math.floor(Math.random() * countries.length)],
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          ipHash: crypto.randomUUID().substring(0, 32),
        });
      }
    }

    if (!existingCodes.has("pricing-pro")) {
      for (let i = 0; i < 84; i++) {
        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 30));
        clicksToInsert.push({
          id: crypto.randomUUID(),
          linkId: link2Id,
          timestamp: date,
          country: countries[Math.floor(Math.random() * countries.length)],
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          ipHash: crypto.randomUUID().substring(0, 32),
        });
      }
    }

    if (!existingCodes.has("newsletter-sub")) {
      for (let i = 0; i < 39; i++) {
        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 30));
        clicksToInsert.push({
          id: crypto.randomUUID(),
          linkId: link3Id,
          timestamp: date,
          country: countries[Math.floor(Math.random() * countries.length)],
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          ipHash: crypto.randomUUID().substring(0, 32),
        });
      }
    }

    if (clicksToInsert.length > 0) {
      await db.insert(analytics).values(clicksToInsert);
    }

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}
