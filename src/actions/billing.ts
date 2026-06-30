"use server";

import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "./auth";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function getBillingInfo(workspaceId: string) {
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

  if (!member) throw new Error("Unauthorized workspace access");

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
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return { success: false, error: "FORBIDDEN" };
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const reqHeaders = await headers();
    const host = reqHeaders.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const origin = `${protocol}://${host}`;

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
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function createPortalSession(workspaceId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace || !workspace.stripeCustomerId) {
      return { success: false, error: "NO_CUSTOMER_FOUND" };
    }

    const reqHeaders = await headers();
    const host = reqHeaders.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const origin = `${protocol}://${host}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${origin}/dashboard/${workspace.slug}/billing`,
    });

    if (!session.url) {
      return { success: false, error: "PORTAL_SESSION_ERROR" };
    }

    return { success: true, url: session.url };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function downgradeToFree(workspaceId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

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

    await db
      .update(workspaces)
      .set({
        plan: "free",
        linkLimit: 10,
      })
      .where(eq(workspaces.id, workspaceId));

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
