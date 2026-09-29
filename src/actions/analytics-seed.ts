"use server";

import { db } from "@/lib/db";
import { analytics, links } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";

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
    const referrers = ["Twitter", "LinkedIn", "Google", "GitHub", "Direct", "Reddit"];
    const devices = ["Desktop", "Mobile", "Tablet"];
    const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
    const clicksToInsert = [];
    const now = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(now.getDate() - Math.floor(Math.random() * 25));
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

    if (clicksToInsert.length > 0) {
      await db.insert(analytics).values(clicksToInsert);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}
