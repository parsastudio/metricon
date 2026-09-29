import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers, links, analytics } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_PLANS, IS_DEMO_MODE } from "@/core/config";
import { hashSha256 } from "@/lib/crypto";

export async function generateUniquePrefix(): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let attempts = 0;
  while (attempts < 50) {
    let prefix = "";
    for (let i = 0; i < 4; i++) {
      prefix += chars[Math.floor(Math.random() * chars.length)];
    }
    const [existing] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.shortPrefix, prefix))
      .limit(1);
    if (!existing) {
      return prefix;
    }
    attempts++;
  }
  return crypto.randomUUID().substring(0, 5);
}

export async function provisionWorkspaceForUser(params: {
  userId: string;
  email: string;
  name?: string;
  hashedApiKey: string;
}) {
  const workspaceId = crypto.randomUUID();
  const workspaceSlug = `${params.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "-")}-org`;
  const shortPrefix = await generateUniquePrefix();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: params.userId,
      email: params.email,
      name: params.name || params.email.split("@")[0],
      apiKey: params.hashedApiKey,
    });

    await tx.insert(workspaces).values({
      id: workspaceId,
      name: `${params.name || params.email.split("@")[0]}'s Org`,
      slug: workspaceSlug,
      shortPrefix,
      plan: "free",
      linkLimit: SUBSCRIPTION_PLANS.free.limits.links,
    });

    await tx.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: params.userId,
      role: "owner",
    });

    if (IS_DEMO_MODE) {
      const sarahId = crypto.randomUUID();
      const marcusId = crypto.randomUUID();

      await tx.insert(users).values([
        {
          id: sarahId,
          email: "sarah.chen@metricon.co",
          name: "Sarah Chen",
        },
        {
          id: marcusId,
          email: "marcus.vance@metricon.co",
          name: "Marcus Vance",
        },
      ]);

      await tx.insert(workspaceMembers).values([
        {
          id: crypto.randomUUID(),
          workspaceId,
          userId: sarahId,
          role: "admin",
        },
        {
          id: crypto.randomUUID(),
          workspaceId,
          userId: marcusId,
          role: "viewer",
        },
      ]);

      const deckId = crypto.randomUUID();
      const smartId = crypto.randomUUID();
      const globalId = crypto.randomUUID();
      const flashId = crypto.randomUUID();

      const hashedDemoPass = await hashSha256("demo123");

      await tx.insert(links).values([
        {
          id: deckId,
          workspaceId,
          shortCode: "investor-deck",
          originalUrl: "https://github.com/metricon",
          title: "Confidential Pitch Deck (Password: demo123)",
          password: hashedDemoPass,
          clicksCount: 165,
        },
        {
          id: smartId,
          workspaceId,
          shortCode: "smart-app",
          originalUrl: "https://metricon.co",
          title: "Mobile App Smart Store Router (iOS & Android)",
          iosUrl: "https://apps.apple.com/app/id123456789",
          androidUrl: "https://play.google.com/store/apps/details?id=co.metricon",
          desktopUrl: "https://metricon.co/download",
          clicksCount: 284,
        },
        {
          id: globalId,
          workspaceId,
          shortCode: "global-store",
          originalUrl: "https://metricon.co",
          title: "Global E-Commerce Store with Geo Routing",
          geoRouting: {
            US: "https://us.metricon.co",
            GB: "https://uk.metricon.co",
            DE: "https://de.metricon.co",
          },
          clicksCount: 412,
        },
        {
          id: flashId,
          workspaceId,
          shortCode: "flash-sale",
          originalUrl: "https://metricon.co/pricing",
          title: "Flash Sale Limited Campaign (500 Clicks Max)",
          maxClicks: 500,
          clicksCount: 215,
        },
      ]);

      const countries = ["US", "GB", "DE", "FR", "NL", "CA", "JP"];
      const referrers = ["Twitter", "LinkedIn", "Google", "GitHub", "Direct", "Reddit"];
      const devices = ["Desktop", "Mobile", "Tablet"];
      const browsers = ["Chrome", "Safari", "Firefox"];

      const mockClicks = [];
      const linkList = [deckId, smartId, globalId, flashId];

      for (let i = 0; i < 350; i++) {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * 28));
        mockClicks.push({
          id: crypto.randomUUID(),
          linkId: linkList[Math.floor(Math.random() * linkList.length)],
          country: countries[Math.floor(Math.random() * countries.length)],
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          ipHash: crypto.randomUUID().substring(0, 32),
          timestamp: d,
        });
      }

      await tx.insert(analytics).values(mockClicks);
    }
  });

  return { workspaceSlug, workspaceId };
}
