// HTTP routes: health/status, sign-up/login/session, user data, license creation & transfer.
import crypto from "crypto";
import type { Express } from "express";
import { db, dbErrorDetail, dbStatusMsg, enableMockDb, mockEmailLogs, mockFragments, mockLicenses, mockPayments, mockRequests, mockSessions, mockUsers, useMockDb } from "../db.js";
import { escapeRegex, generateToken, getEmailFromToken, hashPassword, isAuthorizedAdmin, isRateLimited, requireAdmin, requireAuth, verifyPassword } from "../security.js";
import { PAYPAL_MODE, isLivePayPal } from "../services/paypal.js";
import { generateLicenseNumber, markBeatExclusivelySold } from "../services/purchases.js";
import { EmailLog, License, Payment, RequestItem } from "../types.js";

export function registerAccountRoutes(app: Express) {
  // Endpoint to check current MongoDB connection status
  app.get("/api/db-status", async (req, res) => {
    // Connection error details can reveal cluster/host names, so only admins see them.
    const caller = await getEmailFromToken(req);
    res.json({
      success: !useMockDb,
      status: dbStatusMsg,
      error: caller && isAuthorizedAdmin(caller) ? dbErrorDetail : "",
      timestamp: new Date().toISOString()
    });
  });

  // System Status & Mode Endpoint (Live vs Sandbox, Database, Storage)
  app.get("/api/system/status", (req, res) => {
    res.json({
      live: isLivePayPal,
      paypalMode: PAYPAL_MODE,
      database: useMockDb ? "mock" : "mongodb",
      storage: "cloudflare-r2"
    });
  });

  // 1. Auth: Sign up
  app.post(["/api/auth/signup", "/auth/signup"], async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required fields." });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      if (isRateLimited(`signup:${req.ip}`, 10, 60 * 60 * 1000)) {
        return res.status(429).json({ error: "Too many sign-up attempts. Please try again later." });
      }
      const passwordHash = hashPassword(password);
      const assignedRole = isAuthorizedAdmin(normalizedEmail) ? "admin" : "client";

      let emailTaken = false;
      if (!useMockDb && db) {
        try {
          const usersCol = db.collection("users");
          const existingUser = await usersCol.findOne({
            $or: [
              { email: normalizedEmail },
              { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
            ]
          });
          if (existingUser) {
            emailTaken = true;
          } else {
            await usersCol.insertOne({
              email: normalizedEmail,
              passwordHash,
              role: assignedRole,
              createdAt: new Date()
            });
          }
        } catch (dbErr: any) {
          console.warn("[AUTH SIGNUP] MongoDB write encountered issue, caching to runtime memory store:", dbErr?.message);
          enableMockDb();
        }
      }

      if (emailTaken || mockUsers.has(normalizedEmail)) {
        return res.status(400).json({ error: "Email address already registered." });
      }

      // Always mirror to in-memory store for instant zero-latency failover
      mockUsers.set(normalizedEmail, {
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        createdAt: new Date()
      });

      // Auto-create a session
      const token = generateToken();
      mockSessions.set(token, normalizedEmail);

      if (!useMockDb && db) {
        try {
          await db.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
        } catch (_e) {}
      }

      return res.json({ success: true, token, email: normalizedEmail, role: assignedRole, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // 2. Auth: Login
  app.post(["/api/auth/login", "/auth/login"], async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      if (isRateLimited(`login:${req.ip}:${normalizedEmail}`, 10, 15 * 60 * 1000)) {
        return res.status(429).json({ error: "Too many login attempts. Please try again in a few minutes." });
      }

      let authenticated = false;
      let userRole = isAuthorizedAdmin(normalizedEmail) ? "admin" : "client";

      // First attempt MongoDB verification if connected
      if (!useMockDb && db) {
        try {
          const user = await db.collection("users").findOne({
            $or: [
              { email: normalizedEmail },
              { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
            ]
          });
          if (user) {
            authenticated = verifyPassword(password, user.passwordHash);
            userRole = user.role || userRole;
          }
        } catch (dbErr: any) {
          console.warn("[AUTH LOGIN] MongoDB query error, checking in-memory credential cache:", dbErr?.message);
          enableMockDb();
        }
      }

      // Secondary in-memory store check
      if (!authenticated) {
        const memoryUser = mockUsers.get(normalizedEmail);
        if (memoryUser) {
          authenticated = verifyPassword(password, memoryUser.passwordHash);
          userRole = memoryUser.role || userRole;
        }
      }

      if (!authenticated) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Transparently upgrade legacy (unsalted SHA-256) password hashes to salted scrypt
      try {
        const upgraded = hashPassword(password);
        const mu = mockUsers.get(normalizedEmail);
        if (mu && !String(mu.passwordHash).startsWith("scrypt$")) mu.passwordHash = upgraded;
        if (!useMockDb && db) {
          await db.collection("users").updateOne(
            { email: normalizedEmail, passwordHash: { $not: /^scrypt\$/ } },
            { $set: { passwordHash: upgraded } }
          );
        }
      } catch (_e) { /* non-fatal */ }

      const token = generateToken();
      mockSessions.set(token, normalizedEmail);

      if (!useMockDb && db) {
        try {
          await db.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
        } catch (_e) {}
      }

      return res.json({ success: true, token, email: normalizedEmail, role: userRole, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // 3. Auth: Current user info
  app.get(["/api/auth/me", "/auth/me"], async (req, res) => {
    try {
      const email = await getEmailFromToken(req);
      if (!email) {
        return res.status(401).json({ error: "Unauthorized. Please sign in." });
      }

      let role = isAuthorizedAdmin(email) ? "admin" : "client";
      const uMem = mockUsers.get(email.toLowerCase().trim());
      if (uMem && uMem.role) role = uMem.role;

      if (!useMockDb && db) {
        try {
          const u = await db.collection("users").findOne({
            $or: [
              { email: email.toLowerCase().trim() },
              { email: { $regex: new RegExp(`^${email.toLowerCase().trim().replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
            ]
          });
          if (u && u.role) role = u.role;
        } catch (_e) {}
      }

      return res.json({ success: true, email, role, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // 4. Auth: Logout - End active sessions
  app.post(["/api/auth/logout", "/auth/logout"], async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      let userEmail: string | null = null;
      if (token) {
        if (useMockDb) {
          userEmail = mockSessions.get(token) || null;
          mockSessions.delete(token);
        } else if (db) {
          try {
            const s = await db.collection("sessions").findOne({ token });
            if (s) userEmail = s.email;
            await db.collection("sessions").deleteOne({ token });
          } catch (_e) {}
        }
      }

      if (!userEmail && req.body && req.body.email) {
        userEmail = String(req.body.email).toLowerCase().trim();
      }

      if (userEmail) {
        const normalizedEmail = userEmail.toLowerCase().trim();
        for (const [key, val] of Array.from(mockSessions.entries())) {
          if (val && val.toLowerCase().trim() === normalizedEmail) {
            mockSessions.delete(key);
          }
        }
        if (!useMockDb && db) {
          try {
            await db.collection("sessions").deleteMany({
              $or: [
                { email: normalizedEmail },
                { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
              ]
            });
          } catch (_e) {}
        }
      }

      return res.json({ success: true, message: "Logged out successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // 5. Database Fetch: User secure data (Licenses & Requests)
  app.get("/api/user/data", async (req, res) => {
    try {
      const tokenEmail = await getEmailFromToken(req);
      if (!tokenEmail) {
        return res.status(401).json({ error: "Authentication required. Please sign in." });
      }
      // Users can only read their own data; admins may look up another account via ?email=
      const queryEmail = (req.query.email as string)?.toLowerCase().trim();
      const email = (queryEmail && isAuthorizedAdmin(tokenEmail) ? queryEmail : tokenEmail).toLowerCase().trim();

      let userLicenses: License[] = [];
      let userRequests: RequestItem[] = [];
      let userEmailLogs: EmailLog[] = [];
      let userPayments: Payment[] = [];

      if (useMockDb) {
        userLicenses = mockLicenses.filter((lic) => !email || (lic.email && lic.email.toLowerCase().trim() === email));
        userRequests = mockRequests.filter((reqItem) => !email || (reqItem.email && reqItem.email.toLowerCase().trim() === email));
        userEmailLogs = mockEmailLogs.filter((log) => !email || (log.email && log.email.toLowerCase().trim() === email));
        userPayments = mockPayments.filter((p) => {
          const pEmail = (p.userId || p.email || p.clientEmail || "").toLowerCase().trim();
          return !email || pEmail === email;
        });
      } else {
        const query = email ? { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } } : {};
        const paymentQuery = email ? {
          $or: [
            { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
            { clientEmail: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
            { userId: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } }
          ]
        } : {};
        userLicenses = (await db!.collection("licenses").find(query).toArray()) as any[];
        userRequests = (await db!.collection("requests").find(query).toArray()) as any[];
        userEmailLogs = (await db!.collection("email_logs").find(query).toArray()) as any[];
        userPayments = (await db!.collection("payments").find(paymentQuery).toArray()) as any[];
      }

      res.json({
        success: true,
        email,
        licenses: userLicenses,
        requests: userRequests,
        emailLogs: userEmailLogs,
        payments: userPayments,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // 6. Database Action: Record verified checkout purchases (Enforced Settlement Required)
  app.post("/api/user/purchase", async (req, res) => {
    try {
      // 1. Authentication Pre-check: Active session required
      const tokenEmail = await getEmailFromToken(req);
      if (!tokenEmail) {
        return res.status(401).json({ error: "Authentication required: Active session required to register clearance purchases." });
      }
      const email = tokenEmail.toLowerCase().trim();

      const { items, licenseeLegalName, billing, orderID, reference, paymentRef, paypalOrderId } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Acquisitions payload must contain item list." });
      }

      // 2. Server-Side Payment Verification: Require settled PayPal transaction in DB
      const targetRef = (paymentRef || paypalOrderId || orderID || reference || "").trim();
      if (!targetRef) {
        return res.status(403).json({ error: "Payment verification required: Must provide a verified PayPal transaction reference." });
      }

      let existingTx: any = null;
      if (useMockDb) {
        existingTx = mockPayments.find(p => (p.id === targetRef || (p as any).paypalOrderId === targetRef || (p as any).orderID === targetRef) && (p.status === "COMPLETED" || p.paymentStatus === "COMPLETED"));
      } else if (db) {
        existingTx = await db.collection("payments").findOne({
          $and: [
            { $or: [{ id: targetRef }, { paypalOrderId: targetRef }, { orderID: targetRef }] },
            { $or: [{ status: "COMPLETED" }, { paymentStatus: "COMPLETED" }] }
          ]
        });
      }

      if (!existingTx) {
        return res.status(403).json({ error: "Security check failed: Confirmed PayPal payment settlement required before issuing licenses." });
      }

      const legalName = licenseeLegalName || (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || email;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const generatedLicenses: License[] = items.map((item: any) => {
        const uniqueId = generateLicenseNumber(item.tierId, item.tierTitle);
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
      
        return {
          id: uniqueId,
          song: item.name,
          type: item.tierTitle || "Archive Access License ($150 USD)",
          date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
          iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
          email,
          signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${email.toUpperCase()}`,
          hash: contractHash,
          tierId: item.tierId || "access",
          licenseeLegalName: legalName,
          archiveIdentifier: archiveId,
          transactionRef: `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
          purchaseDate: formattedDate
        };
      });

      // Create a corresponding clearance request record
      const generatedRequests: RequestItem[] = items.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email
        };
      });

      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
      }

      // Immediately update beat's status in the database (isSold: true) if Exclusive license
      await markBeatExclusivelySold(items, email);

      res.json({
        success: true,
        email,
        licenses: generatedLicenses,
        requests: generatedRequests,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // Public License Verification API Endpoint
  app.get(["/api/v1/licenses/verify/:license_number", "/api/licenses/verify/:license_number"], async (req, res) => {
    try {
      const rawParam = req.params.license_number || "";
      const cleanNumber = rawParam.trim();
      const upperNumber = cleanNumber.toUpperCase();

      if (!cleanNumber) {
        return res.status(400).json({
          valid: false,
          status: "INVALID_REQUEST",
          error: "License number parameter is required for verification query."
        });
      }

      let foundLicense: License | null = null;

      if (!useMockDb && db) {
        const col = db.collection("licenses");
        foundLicense = (await col.findOne({
          $or: [
            { id: upperNumber },
            { licenseNumber: upperNumber },
            { id: { $regex: new RegExp(`^${upperNumber}$`, "i") } },
            { hash: { $regex: new RegExp(`^${upperNumber}$`, "i") } },
            { transactionRef: { $regex: new RegExp(`^${upperNumber}$`, "i") } }
          ]
        })) as unknown as License | null;
      } else {
        foundLicense = mockLicenses.find(l => {
          const lid = (l.id || "").toUpperCase();
          const lnum = ((l as any).licenseNumber || "").toUpperCase();
          const lhash = (l.hash || "").toUpperCase();
          const lref = (l.transactionRef || "").toUpperCase();
          return lid === upperNumber ||
            (lnum && lnum === upperNumber) ||
            (lhash && lhash === upperNumber) ||
            (lref && lref === upperNumber) ||
            (lid && lid.includes(upperNumber)) ||
            (upperNumber.includes(lid) && lid.length > 5);
        }) || null;
      }

      // 1. PURCHASED VALID LICENSE FOUND
      if (foundLicense) {
        const licensee = foundLicense.licenseeLegalName || foundLicense.email || "Authorized Licensee";
        const fragment = foundLicense.song || "Archived Composition";
      
        let tierDisplay = foundLicense.type || "Archive Access License ($150)";
        const tLower = (foundLicense.tierId || foundLicense.type || "").toLowerCase();
      
        if (upperNumber.startsWith("TOC-CR") || tLower.includes("release") || tLower === "cr") {
          tierDisplay = "Commercial Release ($500)";
        } else if (upperNumber.startsWith("TOC-AA") || tLower.includes("access") || tLower === "aa") {
          tierDisplay = "Archive Access ($150)";
        } else if (upperNumber.startsWith("TOC-CX") || tLower.includes("exploitation") || tLower === "cx") {
          tierDisplay = "Commercial Exploitation ($1,000)";
        } else if (upperNumber.startsWith("TOC-SYNC") || tLower.includes("sync")) {
          tierDisplay = "Synchronization & Master License (Custom)";
        } else if (upperNumber.startsWith("TOC-EX") || tLower.includes("exclusive") || tLower === "ex") {
          tierDisplay = "Exclusive Archive Acquisition ($5,000)";
        } else if (upperNumber.startsWith("TOC-COL") || tLower.includes("collab") || tLower === "col") {
          tierDisplay = "Producer Collaboration ($0)";
        }

        const issuedDate = foundLicense.purchaseDate || foundLicense.date || "August 6, 2026";
        const scopeText = tLower.includes("access") 
          ? "Songwriting, studio demos, rehearsals, and private creative development."
          : tLower.includes("release")
          ? "Commercial streaming distribution (up to 500,000 streams), digital broadcast, sync placement, global territory."
          : tLower.includes("exploitation")
          ? "Unlimited commercial distribution, worldwide sync placement, monetized streaming, live performance."
          : tLower.includes("exclusive")
          ? "100% Exclusive master acquisition, complete archival retirement from public marketplace."
          : tLower.includes("sync")
          ? "Audio-visual synchronization, motion picture soundtrack, episodic streaming, theatrical distribution."
          : "Producer co-production evaluation and collaborative arrangement drafting.";

        const royaltyTerms = "100% Sample-Free Master & Composition Clearance Warranty. Non-exclusive, worldwide, fully executed clearance under Schedule A & B terms.";

        return res.json({
          valid: true,
          purchased: true,
          status: "VALID & ACTIVE",
          licensee,
          licenseeEmail: foundLicense.email,
          fragment,
          tier: tierDisplay,
          issuedDate,
          licenseNumber: foundLicense.id,
          scope: scopeText,
          royaltyTerms,
          details: {
            id: foundLicense.id,
            song: foundLicense.song,
            type: foundLicense.type,
            date: foundLicense.date,
            isrc: foundLicense.isrc,
            iswc: foundLicense.iswc,
            email: foundLicense.email,
            signature: foundLicense.signature,
            hash: foundLicense.hash,
            tierId: foundLicense.tierId || "access",
            licenseeLegalName: licensee,
            archiveIdentifier: foundLicense.archiveIdentifier || `TOC-${foundLicense.id.replace(/[^a-zA-Z0-9]/g, "")}-001`,
            transactionRef: foundLicense.transactionRef || "LMN-TX-VERIFIED",
            purchaseDate: issuedDate
          }
        });
      }

      // 2. UNPURCHASED / FRAGMENT ID / DEFAULT SEARCH -> MASTER ARCHIVE REGISTRY STATE
      // Check if matching a known fragment timestamp or name
      let matchedFragment = mockFragments.find(f => {
        const fid = f.id.toUpperCase();
        const fname = f.name.toUpperCase();
        const ftime = f.timestamp.toUpperCase();
        const digits = f.id.replace(/[^0-9]/g, "");
        const cleanDigits = upperNumber.replace(/[^0-9]/g, "");
        return fid === upperNumber ||
          fname === upperNumber ||
          ftime === upperNumber ||
          (cleanDigits && digits === cleanDigits) ||
          upperNumber.includes(fid) ||
          upperNumber.includes(fname);
      });

      const fragTitle = matchedFragment ? matchedFragment.name : cleanNumber;
      const fragId = matchedFragment ? matchedFragment.id : cleanNumber;

      return res.json({
        valid: true,
        purchased: false,
        isUnpurchased: true,
        status: "UNLICENSED / AVAILABLE FOR CLEARANCE",
        originalRightsHolder: "LOMON LLC / THE OWL CLOCK",
        masterOwnership: "100% SOLELY OWNED BY LOMON LLC",
        publishingControl: "100% CONTROLLED BY LOMON LLC",
        fragment: fragTitle,
        fragmentId: fragId,
        licenseNumber: upperNumber.startsWith("TOC-") ? upperNumber : `TOC-FRAG-${fragId.replace(/[^a-zA-Z0-9]/g, "") || "MASTER"}`,
        clearanceStatus: "UNLICENSED / AVAILABLE FOR CLEARANCE",
        sampleClearanceWarranty: "100% Sample-Free Original Composition (Direct Master Clearance)",
        deliverables: "24-Bit 48kHz WAV Masters, Multi-track Audio Stems, Official PDF License Covenant",
        actionCall: "REQUEST CLEARANCE / PURCHASE LICENSE",
        actionText: "REQUEST CLEARANCE / PURCHASE LICENSE"
      });
    } catch (err: any) {
      console.error("[LICENSE VERIFY API ERROR]", err);
      return res.status(500).json({
        valid: false,
        status: "ERROR",
        error: "Internal server error querying license verification registry."
      });
    }
  });

  // 7. Database Action: Submit clearance or metadata requests manually
  app.post("/api/user/request", async (req, res) => {
    try {
      const email = await getEmailFromToken(req);
      if (!email) {
        return res.status(401).json({ error: "Unauthorized. Please sign in." });
      }

      const { type, target, status } = req.body;
      if (!type || !target) {
        return res.status(400).json({ error: "Request type and target composition name are required." });
      }

      const newRequest: RequestItem = {
        ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`,
        type,
        target,
        status: status || "SUBMITTED",
        date: new Date().toISOString().split("T")[0],
        email
      };

      if (useMockDb) {
        mockRequests.push(newRequest);
      } else {
        await db!.collection("requests").insertOne(newRequest);
      }

      res.json({ success: true, request: newRequest });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  // Clear user data / mock history endpoint
  app.post("/api/user/clear-history", requireAuth, async (req, res) => {
    try {
      // Non-admins can only clear their OWN history. Wiping everything needs an admin AND { all: true }.
      const authEmail = String((req as any).authEmail || "").toLowerCase().trim();
      const isAdminCaller = isAuthorizedAdmin(authEmail);
      const wipeAll = isAdminCaller && req.body?.all === true;
      const email: string | undefined = wipeAll ? undefined : (isAdminCaller && req.body?.email ? String(req.body.email) : authEmail);
      if (useMockDb) {
        if (email) {
          const normEmail = email.toLowerCase().trim();
          for (let i = mockLicenses.length - 1; i >= 0; i--) {
            if (mockLicenses[i].email === normEmail) mockLicenses.splice(i, 1);
          }
          for (let i = mockRequests.length - 1; i >= 0; i--) {
            if (mockRequests[i].email === normEmail) mockRequests.splice(i, 1);
          }
          for (let i = mockPayments.length - 1; i >= 0; i--) {
            if (mockPayments[i].email === normEmail) mockPayments.splice(i, 1);
          }
        } else {
          mockLicenses.length = 0;
          mockRequests.length = 0;
          mockPayments.length = 0;
          mockEmailLogs.length = 0;
        }
      } else if (db) {
        if (email) {
          const normEmail = email.toLowerCase().trim();
          await db.collection("licenses").deleteMany({ email: normEmail });
          await db.collection("requests").deleteMany({ email: normEmail });
          await db.collection("payments").deleteMany({ email: normEmail });
        } else {
          await db.collection("licenses").deleteMany({});
          await db.collection("requests").deleteMany({});
          await db.collection("payments").deleteMany({});
        }
      }

      res.json({ success: true, message: "History and license tracks cleared successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to clear history." });
    }
  });

  // Direct License Creation Endpoint
  app.post("/api/licenses/create", requireAdmin, async (req, res) => {
    try {
      const { items, email, licenseeLegalName, billing, transactionRef } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items array is required to generate license." });
      }

      const dbEmail = (email || "guest@lomon.local").toLowerCase().trim();
      const legalName = licenseeLegalName || (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const txRef = transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`;

      const generatedLicenses: License[] = items.map((item: any) => {
        const uniqueSuffix = Math.floor(100 + Math.random() * 900);
        const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uniqueSuffix}`;
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : `TOC-${(item.id || "FRAG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`;

        return {
          id: uniqueId,
          song: item.name,
          type: item.tierTitle || "Archive Access License ($150 USD)",
          date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
          iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
          email: dbEmail,
          signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
          hash: contractHash,
          tierId: item.tierId || "access",
          licenseeLegalName: legalName,
          archiveIdentifier: archiveId,
          transactionRef: txRef,
          purchaseDate: formattedDate
        };
      });

      const generatedRequests: RequestItem[] = items.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: "Master Acquisition & Sync Verification",
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const newPayment: Payment = {
        id: txRef,
        email: dbEmail,
        amount: items.reduce((sum, item) => sum + (parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0), 0),
        currency: "USD",
        status: "success",
        gateway: "paypal",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items
      };

      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
        mockPayments.push(newPayment);
      } else if (db) {
        await db.collection("licenses").insertMany(generatedLicenses);
        await db.collection("requests").insertMany(generatedRequests);
        await db.collection("payments").insertOne(newPayment);
      }

      res.json({
        success: true,
        reference: txRef,
        licenses: generatedLicenses,
        requests: generatedRequests,
        payment: newPayment
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create license." });
    }
  });
}
