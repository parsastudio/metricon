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
