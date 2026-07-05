"use server";

import { db } from "@/lib/db";
import { analytics, links, workspaceMembers } from "@/lib/schema";
import { eq, gte, and, sql, inArray } from "drizzle-orm";
import { getSessionUser } from "./auth";

export async function getWorkspaceAnalytics(
  workspaceId: string,
  timeframe: string
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!member) throw new Error("Access denied");

  const now = new Date();
  let startDate = new Date();

  if (timeframe === "24h") {
    startDate.setHours(now.getHours() - 24);
  } else if (timeframe === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const workspaceLinks = await db
    .select({
      id: links.id,
      shortCode: links.shortCode,
      title: links.title,
      clicksCount: links.clicksCount,
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

  const clicks = await db
    .select()
    .from(analytics)
    .where(
      and(
        inArray(analytics.linkId, linkIds),
        gte(analytics.timestamp, startDate)
      )
    );

  const totalClicks = clicks.length;
  const uniqueIps = new Set(clicks.map((c) => c.ipHash)).size;

  const topLinkObj = [...workspaceLinks].sort(
    (a, b) => b.clicksCount - a.clicksCount
  )[0];
  const topLink = topLinkObj
    ? `${topLinkObj.title || topLinkObj.shortCode}`
    : "N/A";

  const countriesMap: Record<string, number> = {};
  const referrersMap: Record<string, number> = {};
  const devicesMap: Record<string, number> = {};

  clicks.forEach((c) => {
    countriesMap[c.country] = (countriesMap[c.country] || 0) + 1;
    referrersMap[c.referrer] = (referrersMap[c.referrer] || 0) + 1;
    devicesMap[c.device] = (devicesMap[c.device] || 0) + 1;
  });

  const countries = Object.entries(countriesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const referrers = Object.entries(referrersMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const devices = Object.entries(devicesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const timeSeriesMap: Record<string, number> = {};
  clicks.forEach((c) => {
    const dateStr = c.timestamp.toISOString().split("T")[0];
    timeSeriesMap[dateStr] = (timeSeriesMap[dateStr] || 0) + 1;
  });

  const timeSeries = Object.entries(timeSeriesMap)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    kpi: {
      totalClicks,
      uniqueClicks: uniqueIps,
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

  await db
    .update(links)
    .set({ clicksCount: sql`clicks_count + 1` })
    .where(eq(links.id, linkId));
}

export async function seedMockData(workspaceId: string) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "UNAUTHORIZED" };

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!member || member.role !== "owner") {
      return { success: false, error: "FORBIDDEN" };
    }

    await db.delete(links).where(eq(links.workspaceId, workspaceId));

    const link1Id = crypto.randomUUID();
    const link2Id = crypto.randomUUID();
    const link3Id = crypto.randomUUID();

    await db.insert(links).values([
      {
        id: link1Id,
        workspaceId,
        shortCode: "launch-2026",
        originalUrl: "https://github.com/metricon/launch",
        title: "Product Launch Campaign Page",
        clicksCount: 142,
      },
      {
        id: link2Id,
        workspaceId,
        shortCode: "pricing-pro",
        originalUrl: "https://metricon.co/pricing",
        title: "Pro Subscription Checkout Page",
        clicksCount: 84,
      },
      {
        id: link3Id,
        workspaceId,
        shortCode: "newsletter-sub",
        originalUrl: "https://metricon.co/blog",
        title: "Newsletter Opt-in Success Page",
        clicksCount: 39,
      },
    ]);

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

    await db.insert(analytics).values(clicksToInsert);

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
