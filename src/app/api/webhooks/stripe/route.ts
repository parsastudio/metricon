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
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing Stripe Signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("Webhook signature verification disabled", {
      status: 500,
    });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspaceId;
    const subscriptionId = session.subscription as string | null;

    if (workspaceId && subscriptionId) {
      await db
        .update(workspaces)
        .set({
          plan: "pro",
          linkLimit: 1000000,
          stripeSubscriptionId: subscriptionId,
        })
        .where(eq(workspaces.id, workspaceId));
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;
    await db
      .update(workspaces)
      .set({
        plan: "free",
        linkLimit: 10,
        stripeSubscriptionId: null,
      })
      .where(eq(workspaces.stripeSubscriptionId, subscriptionId));
  }

  return new NextResponse(null, { status: 200 });
}
