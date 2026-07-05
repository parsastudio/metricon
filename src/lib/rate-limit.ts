import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
    })
  : null;

export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) {
    return true;
  }
  try {
    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch {
    return true;
  }
}
