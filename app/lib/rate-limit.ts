import { connectRedis } from "./redis";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store fallback for rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Basic rate limiter using IP address, backed by Redis with memory fallback
 * @param req Request object
 * @param limit Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns Object indicating success and rate limit details
 */
export async function rateLimit(
  req: Request,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes by default
) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
  const now = Date.now();
  
  try {
    const redis = await connectRedis();
    if (redis && redis.isOpen) {
      const key = `ratelimit:${ip}`;
      const current = await redis.incr(key);
      
      if (current === 1) {
        // Set expiry on first request
        await redis.pExpire(key, windowMs);
        return { success: true, remaining: limit - 1, resetAt: now + windowMs };
      }
      
      const ttl = await redis.pTTL(key);
      const resetAt = now + Math.max(0, ttl);
      
      if (current > limit) {
        return { success: false, remaining: 0, resetAt };
      }
      
      return { success: true, remaining: limit - current, resetAt };
    }
  } catch (error) {
    console.error("Redis rate limit error, falling back to memory:", error);
  }
  
  // Memory Fallback
  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs
    });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }
  
  record.count += 1;
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
}
