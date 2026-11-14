// Authentication & security helpers: password hashing, session lookup, auth/admin middleware, rate limiting, HTML escaping.
import crypto from "crypto";
import express from "express";
import { db, mockSessions, useMockDb } from "./db.js";
import { CLOUDFLARE_R2_PUBLIC_URL, R2_ENDPOINT } from "./services/storage.js";

// Helper: Hash password
export function hashPassword(password: string): string {
  // Salted scrypt. Format: scrypt$<salt>$<hash>
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

// Verifies new scrypt hashes AND legacy unsalted SHA-256 hashes (so existing users can still log in).
// Legacy hashes are upgraded to scrypt automatically on the next successful login.
export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored || typeof stored !== "string") return false;
  try {
    if (stored.startsWith("scrypt$")) {
      const [, salt, hash] = stored.split("$");
      const expected = Buffer.from(hash, "hex");
      const actual = crypto.scryptSync(password, salt, expected.length);
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    }
    const legacy = crypto.createHash("sha256").update(password).digest("hex");
    return legacy.length === stored.length && crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
  } catch (_e) {
    return false;
  }
}

// Helper: Token generator
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// SECURITY HELPERS
// ---------------------------------------------------------------------------
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeHtmlFields<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = typeof v === "string" ? escapeHtml(v) : v;
  }
  return out as T;
}

export function escapeRegex(value: string): string {
  return String(value).replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// Minimal in-memory rate limiter (per server instance)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [k, b] of rateBuckets) if (b.resetAt < now) rateBuckets.delete(k);
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

// Requires a valid session token
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Authentication required. Please sign in." });
    }
    (req as any).authEmail = email;
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Authentication check failed." });
  }
}

// Requires a valid session token belonging to an administrator
export async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const email = await getEmailFromToken(req);
    if (!email || !isAuthorizedAdmin(email)) {
      return res.status(403).json({ error: "Access Forbidden: Administrator clearance required." });
    }
    (req as any).authEmail = email;
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Authorization check failed." });
  }
}

// Only allow the audio proxy to fetch from our own storage / CDN hosts (prevents SSRF)
export function isAllowedMediaUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    const allowedHosts = new Set<string>();
    for (const base of [CLOUDFLARE_R2_PUBLIC_URL, R2_ENDPOINT]) {
      try { allowedHosts.add(new URL(base).hostname.toLowerCase()); } catch (_e) {}
    }
    return allowedHosts.has(host) || host.endsWith(".r2.dev") || host.endsWith(".r2.cloudflarestorage.com") || host === "res.cloudinary.com";
  } catch (_e) {
    return false;
  }
}

// Sessions older than this are rejected (and deleted). Override with SESSION_MAX_AGE_DAYS.
const SESSION_MAX_AGE_MS = (parseInt(process.env.SESSION_MAX_AGE_DAYS || "30", 10) || 30) * 24 * 60 * 60 * 1000;

export function isSessionExpired(createdAt: unknown, now: number = Date.now()): boolean {
  if (!createdAt) return false; // legacy sessions without a timestamp are left alone
  const created = new Date(createdAt as any).getTime();
  return !Number.isNaN(created) && now - created > SESSION_MAX_AGE_MS;
}

// Authenticate session token middleware/helper
export async function getEmailFromToken(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.headers["x-auth-token"]) {
    token = String(req.headers["x-auth-token"]);
  }

  if (token) {
    if (useMockDb) {
      const email = mockSessions.get(token);
      if (email) return email;
    } else {
      try {
        const session = await db!.collection("sessions").findOne({ token });
        if (session && session.email) {
          if (isSessionExpired(session.createdAt)) {
            await db!.collection("sessions").deleteOne({ token }).catch(() => {});
            return null;
          }
          return session.email;
        }
      } catch {
        // fallback
      }
    }
  }


  return null;
}

// Centralized Admin Email Authorization
const ADMIN_AUTHORIZED_EMAILS = Array.from(new Set([
  "evianaconcepts1@gmail.com",
  (process.env.ADMIN_NOTIFICATION_EMAIL || "soluwatist@gmail.com"),
  ...(process.env.ADMIN_EMAILS || "").split(",")
].map((e) => e.toLowerCase().trim()).filter(Boolean)));

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_AUTHORIZED_EMAILS.includes(email.toLowerCase().trim());
}
