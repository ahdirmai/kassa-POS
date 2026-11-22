import Redis from "ioredis";
import { env } from "../config/env.js";

export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_SECONDS = 15 * 60; // 15 menit

const FAIL_KEY_PREFIX = "kassa:pin_fail:outlet:";
const LOCK_KEY_PREFIX = "kassa:pin_lock:outlet:";

interface MemoryEntry {
  count: number;
  expiresAt: number;
}

const memoryFails = new Map<string, MemoryEntry>();
const memoryLocks = new Map<string, number>();

let redisClient: Redis | null = null;
let redisReady = false;

function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (redisClient) return redisClient;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      return Math.min(times * 500, 5_000);
    },
  });

  client.on("ready", () => {
    redisReady = true;
  });
  client.on("error", (err) => {
    redisReady = false;
    if (process.env.NODE_ENV !== "test") {
      console.warn("[pin-lockout] Redis error, falling back to memory store:", err.message);
    }
  });
  client.on("close", () => {
    redisReady = false;
  });

  redisClient = client;
  return client;
}

// Inisialisasi koneksi Redis saat modul dimuat jika REDIS_URL tersedia
getRedis();

function normalizeKey(outletCode: string): string {
  return outletCode.trim().toUpperCase();
}

export async function checkPinLockout(
  outletCode: string,
): Promise<{ locked: boolean; retryAfterSec: number }> {
  const key = normalizeKey(outletCode);
  const redis = getRedis();

  if (redis && redisReady) {
    try {
      const ttl = await redis.ttl(`${LOCK_KEY_PREFIX}${key}`);
      if (ttl > 0) {
        return { locked: true, retryAfterSec: ttl };
      }
      return { locked: false, retryAfterSec: 0 };
    } catch {
      // Fallback ke in-memory
    }
  }

  const lockUntil = memoryLocks.get(key);
  if (lockUntil && lockUntil > Date.now()) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000)),
    };
  }
  if (lockUntil) memoryLocks.delete(key);
  return { locked: false, retryAfterSec: 0 };
}

export async function recordPinFailure(outletCode: string): Promise<{
  attempts: number;
  locked: boolean;
  retryAfterSec: number;
}> {
  const key = normalizeKey(outletCode);
  const redis = getRedis();

  if (redis && redisReady) {
    try {
      const failKey = `${FAIL_KEY_PREFIX}${key}`;
      const lockKey = `${LOCK_KEY_PREFIX}${key}`;
      const attempts = await redis.incr(failKey);
      if (attempts === 1) {
        await redis.expire(failKey, PIN_LOCKOUT_SECONDS);
      } else {
        const ttl = await redis.ttl(failKey);
        if (ttl < 0) {
          await redis.expire(failKey, PIN_LOCKOUT_SECONDS);
        }
      }

      if (attempts >= PIN_MAX_ATTEMPTS) {
        await redis.set(lockKey, "1", "EX", PIN_LOCKOUT_SECONDS);
        await redis.del(failKey);
        return { attempts, locked: true, retryAfterSec: PIN_LOCKOUT_SECONDS };
      }

      return { attempts, locked: false, retryAfterSec: 0 };
    } catch {
      // Fallback ke in-memory
    }
  }

  const now = Date.now();
  const existing = memoryFails.get(key);
  const count = existing && existing.expiresAt > now ? existing.count + 1 : 1;

  if (count >= PIN_MAX_ATTEMPTS) {
    memoryLocks.set(key, now + PIN_LOCKOUT_SECONDS * 1000);
    memoryFails.delete(key);
    return { attempts: count, locked: true, retryAfterSec: PIN_LOCKOUT_SECONDS };
  }

  memoryFails.set(key, {
    count,
    expiresAt: existing && existing.expiresAt > now ? existing.expiresAt : now + PIN_LOCKOUT_SECONDS * 1000,
  });
  return { attempts: count, locked: false, retryAfterSec: 0 };
}

export async function clearPinFailures(outletCode: string): Promise<void> {
  const key = normalizeKey(outletCode);
  const redis = getRedis();

  if (redis && redisReady) {
    try {
      await redis.del(`${FAIL_KEY_PREFIX}${key}`, `${LOCK_KEY_PREFIX}${key}`);
    } catch {
      // Abaikan dan bersihkan memory juga
    }
  }

  memoryFails.delete(key);
  memoryLocks.delete(key);
}

export async function closePinLockoutRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
    redisReady = false;
  }
}
