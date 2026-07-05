import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Invalid Signature Header", { status: 400 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("Configuration Failure", { status: 500 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    return new NextResponse(`Verification Failed: ${message}`, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const subscriptionId = session.subscription as string | null;
      if (workspaceId && subscriptionId) {
        await db.transaction(async (tx) => {
          await tx
            .update(workspaces)
            .set({
              plan: "pro",
              linkLimit: 1000000,
              stripeSubscriptionId: subscriptionId,
              updatedAt: new Date(),
            })
            .where(eq(workspaces.id, workspaceId));
        });
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      await db.transaction(async (tx) => {
        await tx
          .update(workspaces)
          .set({
            plan: "free",
            linkLimit: 10,
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.stripeSubscriptionId, subscriptionId));
      });
    }
  } catch {
    return new NextResponse("Database Sync Failed", { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
