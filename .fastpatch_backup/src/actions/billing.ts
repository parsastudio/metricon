"use server";

import { db } from "@/lib/db";
import { workspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { IS_DEMO_MODE } from "@/core/config";
import { getAppOrigin } from "@/lib/network";
import { verifyWorkspaceAccess } from "@/lib/rbac";

export async function getBillingInfo(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) throw new Error("Workspace not found");

  return {
    plan: workspace.plan,
    linkLimit: workspace.linkLimit,
  };
}

export async function upgradeToPro(workspaceId: string) {
  try {
    const { user } = await verifyWorkspaceAccess(workspaceId, [
      "owner",
      "admin",
    ]);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    if (IS_DEMO_MODE) {
      await db
        .update(workspaces)
        .set({
          plan: "pro",
          linkLimit: 1000000,
        })
        .where(eq(workspaces.id, workspaceId));

      return {
        success: true,
        url: `/dashboard/${workspace.slug}/billing?sandbox=success`,
      };
    } else {
      const origin = await getAppOrigin();

      let customerId = workspace.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: { workspaceId },
        });
        customerId = customer.id;
        await db
          .update(workspaces)
          .set({ stripeCustomerId: customerId })
          .where(eq(workspaces.id, workspaceId));
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PRO_PRICE_ID || "price_dummy_pro",
            quantity: 1,
          },
        ],
        success_url: `${origin}/dashboard/${workspace.slug}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/${workspace.slug}/billing`,
        metadata: { workspaceId },
      });

      if (!session.url) {
        return { success: false, error: "STRIPE_SESSION_ERROR" };
      }

      return { success: true, url: session.url };
    }
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

export async function createPortalSession(workspaceId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    if (IS_DEMO_MODE) {
      await db
        .update(workspaces)
        .set({
          plan: "free",
          linkLimit: 10,
        })
        .where(eq(workspaces.id, workspaceId));

      return {
        success: true,
        url: `/dashboard/${workspace.slug}/billing?sandbox=downgrade`,
      };
    } else {
      if (!workspace.stripeCustomerId) {
        return { success: false, error: "NO_CUSTOMER_FOUND" };
      }

      const origin = await getAppOrigin();

      const session = await stripe.billingPortal.sessions.create({
        customer: workspace.stripeCustomerId,
        return_url: `${origin}/dashboard/${workspace.slug}/billing`,
      });

      if (!session.url) {
        return { success: false, error: "PORTAL_SESSION_ERROR" };
      }

      return { success: true, url: session.url };
    }
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

export async function downgradeToFree(workspaceId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);

    await db
      .update(workspaces)
      .set({
        plan: "free",
        linkLimit: 10,
      })
      .where(eq(workspaces.id, workspaceId));

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
