import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_mock",
  {
    typescript: true,
  }
);

export async function hasPlanAccess(
  currentPlan: "free" | "pro",
  requiredPlan: "free" | "pro"
): Promise<boolean> {
  if (requiredPlan === "free") {
    return true;
  }
  return currentPlan === "pro";
}
