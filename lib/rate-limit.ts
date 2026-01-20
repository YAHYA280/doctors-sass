import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Create Redis client only if environment variables are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Different rate limiters for different purposes
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      })
    : null,

  // Auth rate limit: 5 attempts per 15 minutes
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
        prefix: "ratelimit:auth",
      })
    : null,

  // Booking rate limit: 10 bookings per hour per IP
  booking: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
        prefix: "ratelimit:booking",
      })
    : null,

  // Webhook rate limit: 1000 per minute (for Stripe/WhatsApp webhooks)
  webhook: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, "1 m"),
        analytics: true,
        prefix: "ratelimit:webhook",
      })
    : null,
};

type RateLimiterType = keyof typeof rateLimiters;

export async function rateLimit(
  request: NextRequest,
  type: RateLimiterType = "api"
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  const limiter = rateLimiters[type];

  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return { success: true };
  }

  // Get identifier (IP address or user ID from header)
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const identifier = `${type}:${ip}`;

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // On error, allow the request but log for monitoring
    return { success: true };
  }
}

export function createRateLimitResponse(
  reset: number
): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    }
  );
}

// Middleware helper to apply rate limiting
export async function withRateLimit(
  request: NextRequest,
  type: RateLimiterType = "api"
): Promise<NextResponse | null> {
  const result = await rateLimit(request, type);

  if (!result.success && result.reset) {
    return createRateLimitResponse(result.reset);
  }

  return null;
}
