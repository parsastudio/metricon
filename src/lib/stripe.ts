import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_mock",
  {
    apiVersion: "2025-01-27-previews.3" as unknown as NonNullable<
      ConstructorParameters<typeof Stripe>[1]
    >["apiVersion"],
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
