export const SITE_CONFIG = {
  name: "Metricon",
  description: "Premium Link Management & Analytics Platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    github: "https://github.com/metricon",
  },
};

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free Plan",
    description: "Ideal for personal projects and testing.",
    price: 0,
    features: [
      "Up to 10 active links",
      "Basic link redirection",
      "7 days analytics history",
      "Standard support",
    ],
    limits: {
      links: 10,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    description: "For growing businesses needing deep analytic insight.",
    price: 29,
    features: [
      "Unlimited active links",
      "Device & Geo-Targeting routing",
      "Password protection & Link expiration",
      "Lifetime analytics retention",
      "Priority API support",
    ],
    limits: {
      links: 1000000,
    },
  },
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
