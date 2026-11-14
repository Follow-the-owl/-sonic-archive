// HTTP routes: admin-only management of users, payments, licenses and clearance requests.
import crypto from "crypto";
import type { Express } from "express";
import { db, mockLicenses, mockPayments, mockRequests, mockUsers, useMockDb } from "../db.js";
import { getEmailFromToken, hashPassword, isAuthorizedAdmin } from "../security.js";
import { License, Payment, RequestItem } from "../types.js";

export function registerAdminRoutes(app: Express) {
  // Security Middleware: Protect all /api/admin/* routes against unauthenticated or client accounts
  app.use("/api/admin", async (req, res, next) => {
    const tokenEmail = await getEmailFromToken(req);
    if (!tokenEmail || !isAuthorizedAdmin(tokenEmail)) {
      return res.status(403).json({
        error: "Access Forbidden: Administrator clearance required for the Master Administrative API.",
        authenticatedUser: tokenEmail || null
      });
    }
    next();
  });

  // 11. Payments & Transactions CRUD: Read (All payments)
  app.get(["/api/admin/payments", "/api/admin/transactions"], async (req, res) => {
    try {
      let payments: Payment[] = [];
      if (useMockDb) {
        payments = mockPayments;
      } else {
        payments = (await db!.collection("payments").find({}).sort({ createdAt: -1 }).toArray()) as any[];
      }
      res.json({ success: true, payments, transactions: payments });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve payments." });
    }
  });

  // Admin Clearance / Requests CRUD
  app.get(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
    try {
      let requests: RequestItem[] = [];
      if (useMockDb) {
        requests = mockRequests;
      } else {
        requests = (await db!.collection("requests").find({}).toArray()) as any[];
      }
      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve clearance requests." });
    }
  });

  app.post(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
    try {
      const { ref, type, target, status, date, email, clientName, requestedLicense, notes, paymentStatus } = req.body;
      const cleanRef = ref || `REQ-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`;
      const newReq: any = {
        ref: cleanRef,
        type: type || requestedLicense || "Commercial Exploitation",
        target: target || "Archived Fragment",
        status: status || "NEW",
        date: date || new Date().toISOString().split("T")[0],
        email: (email || "client@lomon.local").toLowerCase().trim(),
        clientName: clientName || email || "Authorized Client",
        requestedLicense: requestedLicense || type || "Commercial Exploitation",
        notes: notes || "",
        paymentStatus: paymentStatus || "PAYMENT PENDING"
      };

      if (useMockDb) {
        mockRequests.unshift(newReq);
      } else {
        await db!.collection("requests").insertOne(newReq);
      }
      res.json({ success: true, request: newReq });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create clearance request." });
    }
  });

  app.put(["/api/admin/clearance", "/api/admin/requests"], async (req, res) => {
    try {
      const { ref, status, notes, paymentStatus, requestedLicense } = req.body;
      if (!ref) {
        return res.status(400).json({ error: "Reference ID is required to update clearance request." });
      }

      let updated = false;
      if (useMockDb) {
        const idx = mockRequests.findIndex(r => r.ref === ref);
        if (idx !== -1) {
          if (status) mockRequests[idx].status = status;
          if (notes !== undefined) (mockRequests[idx] as any).notes = notes;
          if (paymentStatus) (mockRequests[idx] as any).paymentStatus = paymentStatus;
          if (requestedLicense) (mockRequests[idx] as any).requestedLicense = requestedLicense;
          updated = true;
        }
      } else {
        const fields: any = {};
        if (status) fields.status = status;
        if (notes !== undefined) fields.notes = notes;
        if (paymentStatus) fields.paymentStatus = paymentStatus;
        if (requestedLicense) fields.requestedLicense = requestedLicense;
        const resCol = await db!.collection("requests").updateOne({ ref }, { $set: fields });
        updated = resCol.matchedCount > 0;
      }

      if (updated) {
        res.json({ success: true, message: `Clearance request ${ref} updated.` });
      } else {
        res.status(404).json({ error: "Clearance request not found." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update clearance request." });
    }
  });

  // Admin All Licenses CRUD
  app.get("/api/admin/licenses", async (req, res) => {
    try {
      let licenses: License[] = [];
      if (useMockDb) {
        licenses = mockLicenses;
      } else {
        licenses = (await db!.collection("licenses").find({}).toArray()) as any[];
      }
      res.json({ success: true, licenses });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve licenses." });
    }
  });

  app.post("/api/admin/licenses", async (req, res) => {
    try {
      const licData = req.body;
      const cleanId = licData.id || `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
      const newLic: License = {
        id: cleanId,
        song: licData.song || "Archived Fragment",
        type: licData.type || "Commercial Exploitation ($1,000)",
        date: licData.date || new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        isrc: licData.isrc || `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
        iswc: licData.iswc || `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
        email: (licData.email || "client@lomon.local").toLowerCase().trim(),
        signature: licData.signature || `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${(licData.email || "CLIENT").toUpperCase()}`,
        hash: licData.hash || `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
        tierId: licData.tierId || "commercial",
        licenseeLegalName: licData.licenseeLegalName || licData.email || "Authorized Licensee",
        archiveIdentifier: licData.archiveIdentifier || `TOC-${licData.song ? licData.song.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "FRAG"}-001`,
        transactionRef: licData.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        purchaseDate: licData.purchaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      };

      if (useMockDb) {
        mockLicenses.unshift(newLic);
      } else {
        await db!.collection("licenses").insertOne(newLic);
      }

      res.json({ success: true, license: newLic });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create license." });
    }
  });

  app.put("/api/admin/licenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      let updated = false;

      if (useMockDb) {
        const idx = mockLicenses.findIndex(l => l.id === id);
        if (idx !== -1) {
          mockLicenses[idx] = { ...mockLicenses[idx], ...updateData };
          updated = true;
        }
      } else {
        const result = await db!.collection("licenses").updateOne({ id }, { $set: updateData });
        updated = result.matchedCount > 0;
      }

      if (updated) {
        res.json({ success: true, message: `License ${id} updated.` });
      } else {
        res.status(404).json({ error: "License not found." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update license." });
    }
  });

  app.delete("/api/admin/licenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let deleted = false;
      if (useMockDb) {
        const idx = mockLicenses.findIndex(l => l.id === id);
        if (idx !== -1) {
          mockLicenses.splice(idx, 1);
          deleted = true;
        }
      } else {
        const result = await db!.collection("licenses").deleteOne({ id });
        deleted = result.deletedCount > 0;
      }

      if (deleted) {
        res.json({ success: true, message: `License ${id} revoked/deleted.` });
      } else {
        res.status(404).json({ error: "License not found." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete license." });
    }
  });

  // 11. Payments CRUD: Create (Manual payment addition)
  app.post("/api/admin/payments", async (req, res) => {
    try {
      const { email, amount, currency, gateway, items, status } = req.body;
      if (!email || !amount) {
        return res.status(400).json({ error: "Email and amount are required for manual creation." });
      }

      const uniqueId = `MAN-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      const newPayment: Payment = {
        id: uniqueId,
        email: email.toLowerCase().trim(),
        amount: parseFloat(amount),
        currency: currency || "NGN",
        status: status || "success",
        gateway: gateway || "manual",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items: items || [{ id: "manual", name: "Manual License Clear Record", price: `$${amount}` }]
      };

      if (useMockDb) {
        mockPayments.push(newPayment);
      } else {
        await db!.collection("payments").insertOne(newPayment);
      }

      res.json({ success: true, payment: newPayment });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create manual payment record." });
    }
  });

  // 11. Payments CRUD: Update (Modify payment status/metadata)
  app.put("/api/admin/payments", async (req, res) => {
    try {
      const { id, status, amount, gateway } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Payment Reference ID is required for update." });
      }

      let updated = false;
      if (useMockDb) {
        const idx = mockPayments.findIndex(p => p.id === id);
        if (idx !== -1) {
          if (status) mockPayments[idx].status = status;
          if (amount) mockPayments[idx].amount = parseFloat(amount);
          if (gateway) mockPayments[idx].gateway = gateway;
          updated = true;
        }
      } else {
        const paymentsCol = db!.collection("payments");
        const fieldsToUpdate: any = {};
        if (status) fieldsToUpdate.status = status;
        if (amount) fieldsToUpdate.amount = parseFloat(amount);
        if (gateway) fieldsToUpdate.gateway = gateway;

        const result = await paymentsCol.updateOne({ id }, { $set: fieldsToUpdate });
        updated = result.matchedCount > 0;
      }

      if (updated) {
        res.json({ success: true, message: `Payment ${id} successfully updated.` });
      } else {
        res.status(404).json({ error: `Payment record with reference "${id}" not found.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update payment record." });
    }
  });

  // 11. Payments CRUD: Delete (Remove payment record)
  app.delete("/api/admin/payments", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Payment Reference ID is required for deletion." });
      }

      let deleted = false;
      if (useMockDb) {
        const idx = mockPayments.findIndex(p => p.id === id);
        if (idx !== -1) {
          mockPayments.splice(idx, 1);
          deleted = true;
        }
      } else {
        const result = await db!.collection("payments").deleteOne({ id });
        deleted = result.deletedCount > 0;
      }

      if (deleted) {
        res.json({ success: true, message: `Payment ${id} has been securely purged from archive databases.` });
      } else {
        res.status(404).json({ error: `Payment record "${id}" not found.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete payment record." });
    }
  });

  // 12. User CRUD: Read (Fetch all registered terminals)
  app.get("/api/admin/users", async (req, res) => {
    try {
      let usersList: any[] = [];
      if (useMockDb) {
        // Return list of in-memory keys
        const inMemoryUsers = Array.from(mockUsers.values()).map(u => ({
          email: u.email,
          createdAt: u.createdAt,
          status: "ACTIVE USER"
        }));
        // ensure we also list the hardcoded evianaconcepts email if it's accessed
        if (!mockUsers.has("evianaconcepts1@gmail.com")) {
          inMemoryUsers.push({
            email: "evianaconcepts1@gmail.com",
            createdAt: new Date("2026-06-01T00:00:00Z"),
            status: "ADMINISTRATOR"
          });
        }
        usersList = inMemoryUsers;
      } else {
        usersList = await db!.collection("users").find({}, { projection: { passwordHash: 0 } }).toArray();
      }
      res.json({ success: true, users: usersList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve users." });
    }
  });

  // 12. User CRUD: Create (Add user manually)
  app.post("/api/admin/users", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const targetEmail = email.toLowerCase().trim();
      const passwordHash = hashPassword(password);

      if (useMockDb) {
        if (mockUsers.has(targetEmail)) {
          return res.status(400).json({ error: "Email address already registered." });
        }
        mockUsers.set(targetEmail, {
          email: targetEmail,
          passwordHash,
          createdAt: new Date()
        });
      } else {
        const usersCol = db!.collection("users");
        const existingUser = await usersCol.findOne({
          $or: [
            { email: targetEmail },
            { email: { $regex: new RegExp(`^${targetEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
          ]
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email address already registered." });
        }
        await usersCol.insertOne({
          email: targetEmail,
          passwordHash,
          createdAt: new Date()
        });
      }

      res.json({ success: true, user: { email: targetEmail, createdAt: new Date() } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create user account." });
    }
  });

  // 12. User CRUD: Update (Change user password)
  app.put("/api/admin/users", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and new password are required." });
      }

      const targetEmail = email.toLowerCase().trim();
      const newPasswordHash = hashPassword(password);
      let updated = false;

      if (useMockDb) {
        const user = mockUsers.get(targetEmail);
        if (user) {
          user.passwordHash = newPasswordHash;
          mockUsers.set(targetEmail, user);
          updated = true;
        } else if (targetEmail === "evianaconcepts1@gmail.com") {
          mockUsers.set(targetEmail, {
            email: targetEmail,
            passwordHash: newPasswordHash,
            createdAt: new Date()
          });
          updated = true;
        }
      } else {
        const usersCol = db!.collection("users");
        const result = await usersCol.updateOne(
          {
            $or: [
              { email: targetEmail },
              { email: { $regex: new RegExp(`^${targetEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
            ]
          },
          { $set: { passwordHash: newPasswordHash } }
        );
        updated = result.matchedCount > 0;
      }

      if (updated) {
        res.json({ success: true, message: `Password for user ${targetEmail} successfully updated.` });
      } else {
        res.status(404).json({ error: `User ${targetEmail} not found.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update user account." });
    }
  });

  // 12. User CRUD: Delete (Remove user)
  app.delete("/api/admin/users", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "User email address is required." });
      }

      const targetEmail = email.toLowerCase().trim();
      let deleted = false;

      if (useMockDb) {
        deleted = mockUsers.delete(targetEmail);
      } else {
        const result = await db!.collection("users").deleteOne({
          $or: [
            { email: targetEmail },
            { email: { $regex: new RegExp(`^${targetEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
          ]
        });
        deleted = result.deletedCount > 0;
      }

      if (deleted) {
        res.json({ success: true, message: `User ${targetEmail} successfully deleted.` });
      } else {
        res.status(404).json({ error: `User ${targetEmail} not found.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete user account." });
    }
  });
}
