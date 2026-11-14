// Entry point: creates the Express app, mounts middleware + route modules (order matters), and starts the server.
import express from "express";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "../backend/db.js";
import { registerCoreMiddleware, registerDatabaseInit } from "../backend/middleware.js";
import { registerAccountRoutes } from "../backend/routes/accounts.js";
import { registerAdminRoutes } from "../backend/routes/admin.js";
import { registerEmailRoutes } from "../backend/routes/emails.js";
import { registerFragmentRoutes } from "../backend/routes/fragments.js";
import { registerPaymentRoutes } from "../backend/routes/payments.js";
import { registerFileStreamRoute, registerStorageRoutes } from "../backend/routes/storage.js";
import { configureR2BucketCors } from "../backend/services/storage.js";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// --- Middleware & routes (registration order is significant) ---
registerCoreMiddleware(app);
registerFileStreamRoute(app);
registerDatabaseInit(app);
registerEmailRoutes(app);
registerAccountRoutes(app);
registerPaymentRoutes(app);
registerAdminRoutes(app);
registerFragmentRoutes(app);
registerStorageRoutes(app);

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  await initializeDatabase();

  // Auto-verify and enforce wildcard CORS rules on Cloudflare R2 bucket for direct browser uploads
  configureR2BucketCors().catch(err => {
    console.warn("[CLOUDFLARE R2 CORS NOTICE] Background check:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Mounting Vite in development middleware mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } else {
          next();
        }
      } catch (e: any) {
        if (vite && vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    console.log("[SERVER] Mounting static asset serve for production...");
    const cwdDist = path.join(process.cwd(), "dist");
    const distPath = fs.existsSync(path.join(cwdDist, "index.html"))
      ? cwdDist
      : (fs.existsSync(path.join(currentDir, "index.html")) ? currentDir : cwdDist);
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\x1b[36m%s\x1b[0m", `[SERVER] THE OWL CLOCK Fullstack Server is fully running on: http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };
