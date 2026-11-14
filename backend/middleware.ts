// Core Express middleware: CORS, API URL normalisation, body parsing, and lazy database initialisation.
import cors from "cors";
import express, { Express } from "express";
import { initializeDatabase } from "./db.js";

// Universal CORS Handler for all domains and environments
const EXTRA_ALLOWED_ORIGINS = [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || "").split(",")]
  .map((s) => (s || "").trim().replace(/\/+$/, ""))
  .filter(Boolean);

// URL normalization for API routes across standard servers, reverse proxies, and Vercel serverless rewrites:
const KNOWN_API_PREFIXES = [
  "system", "auth", "paypal", "licenses", "clearance", "storage",
  "user", "admin", "fragments", "db-status", "upload-url", "v1", "health"
];

export function registerCoreMiddleware(app: Express) {
  app.use(cors((req, callback) => {
    const origin = req.headers.origin as string | undefined;
    let allowed = false;
    if (!origin) {
      allowed = true; // same-origin requests, server-to-server calls, webhooks
    } else {
      try {
        const o = new URL(origin);
        const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
        allowed = o.host === host || o.hostname === "localhost" || o.hostname === "127.0.0.1" ||
          EXTRA_ALLOWED_ORIGINS.includes(origin.replace(/\/+$/, ""));
      } catch (_e) {
        allowed = false;
      }
    }
    callback(null, {
      origin: allowed,
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Range", "x-auth-token", "x-matched-path"]
    });
  }));

  app.use((req, res, next) => {
    // Check for original client path forwarded by Vercel / Cloudflare
    const forwardedPath = (req.headers["x-matched-path"] || req.headers["x-invoke-path"] || req.headers["x-forwarded-url"] || req.headers["x-original-url"]) as string | undefined;
    if (forwardedPath && typeof forwardedPath === "string" && forwardedPath.startsWith("/api") && (req.url === "/api" || req.url === "/" || req.url === "")) {
      req.url = forwardedPath;
    }
    if (req.url && !req.url.startsWith("/api")) {
      const cleanPath = req.url.replace(/^\/+/, "");
      const firstSegment = cleanPath.split("/")[0]?.split("?")[0]?.toLowerCase();
      if (firstSegment && KNOWN_API_PREFIXES.includes(firstSegment)) {
        req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
      }
    }
    next();
  });

  // Safely parse JSON and URL-encoded bodies without stalling if already read by Vercel serverless runtime
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
      return next();
    }
    express.json({ 
      limit: "50mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
      return next();
    }
    express.urlencoded({ extended: true, limit: "50mb" })(req, res, next);
  });
}

export function registerDatabaseInit(app: Express) {
  // Database initialization middleware (critical for serverless execution like Vercel)
  app.use(async (req, res, next) => {
    try {
      await initializeDatabase();
    } catch (err) {
      console.error("[MIDDLEWARE] Database initialization failed:", err);
    }
    next();
  });
}
