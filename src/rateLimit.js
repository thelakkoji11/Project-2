"use strict";

/** Tiny fixed-window rate limiter (per IP). Returns 429 when exceeded. */
function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  const hits = new Map();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) if (rec.reset <= now) hits.delete(ip);
  }, windowMs);
  timer.unref();

  return function limiter(req, res, next) {
    const now = Date.now();
    const key = req.ip;
    let rec = hits.get(key);
    if (!rec || rec.reset <= now) {
      rec = { count: 0, reset: now + windowMs };
      hits.set(key, rec);
    }
    rec.count += 1;

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - rec.count)));

    if (rec.count > max) {
      const retry = Math.ceil((rec.reset - now) / 1000);
      res.set("Retry-After", String(retry));
      return res.status(429).json({
        error: { code: "TOO_MANY_REQUESTS", message: `Rate limit exceeded. Retry in ${retry}s.` }
      });
    }
    next();
  };
}

module.exports = rateLimit;
