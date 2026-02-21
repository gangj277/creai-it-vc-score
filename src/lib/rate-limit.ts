const counters = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = counters.get(key);

  if (!current || current.resetAt < now) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAt: current.resetAt };
  }

  current.count += 1;
  counters.set(key, current);
  return { allowed: true, remaining: limit - current.count };
}
