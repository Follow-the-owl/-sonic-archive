// HTTP routes: email diagnostics, contact/proposal forms, Resend webhook, admin inbox/outbox.
import type { Express } from "express";
import { db, useMockDb } from "../db.js";
import { isRateLimited, requireAdmin } from "../security.js";
import { ADMIN_NOTIFICATION_EMAIL, COLLABORATION_EMAIL, RESEND_FROM_EMAIL, inMemoryEmailStore, recordInboundEmail, resendClient, sendContactTransmission, sendEmail, sendProposalEmailNotification, verifyResendWebhookSignature } from "../services/email.js";

export function registerEmailRoutes(app: Express) {
  // --- API ENDPOINTS ---

  // Email Configuration Diagnostics Endpoint
  app.get("/api/emails/config", (_req, res) => {
    res.json({
      success: true,
      resendConfigured: Boolean(resendClient),
      smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      fromEmail: RESEND_FROM_EMAIL,
      adminNotificationEmail: ADMIN_NOTIFICATION_EMAIL,
      collaborationEmail: COLLABORATION_EMAIL,
      contactEmail: "contact@theowlclock.io",
      legalEmail: "legal@theowlclock.io",
      inboundWebhookUrl: "/api/webhooks/resend-inbound",
      instructions: {
        outbound: "Add RESEND_API_KEY to your environment variables to route emails through Resend.",
        inbound: "In Resend dashboard -> Inbound -> Add Webhook: set URL to https://your-domain.com/api/webhooks/resend-inbound",
        collaboration: `All collaboration proposals are routed to ${COLLABORATION_EMAIL} and notified to ${ADMIN_NOTIFICATION_EMAIL}.`
      }
    });
  });

  // Outbound Contact / Collaboration Transmission Endpoint
  app.post("/api/emails/send-transmission", async (req, res) => {
    try {
      if (isRateLimited(`transmission:${req.ip}`, 5, 10 * 60 * 1000)) {
        return res.status(429).json({ error: "Too many submissions. Please try again in a few minutes." });
      }
      const { name, email, department, subject, message } = req.body || {};
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
      }

      const result = await sendContactTransmission({
        name: String(name).trim(),
        email: String(email).trim(),
        department: String(department || "General Inquiries").trim(),
        subject: String(subject || "New Transmission").trim(),
        message: String(message).trim()
      });

      res.json({
        success: true,
        transmissionRef: result.transmissionRef,
        message: "Transmission successfully logged and dispatched."
      });
    } catch (err: any) {
      console.error("[SEND TRANSMISSION ERROR]:", err);
      res.status(500).json({ error: err.message || "Failed to dispatch transmission." });
    }
  });

  // Outbound Custom Proposal & Collaboration Submission Endpoint
  app.post("/api/emails/send-proposal", async (req, res) => {
    try {
      if (isRateLimited(`proposal:${req.ip}`, 5, 10 * 60 * 1000)) {
        return res.status(429).json({ error: "Too many submissions. Please try again in a few minutes." });
      }
      const {
        proposalRef,
        proposerName,
        organization,
        email,
        phone,
        proposalType,
        targetFragment,
        mediaType,
        projectTitle,
        projectOverview,
        distributionScope,
        territory,
        term,
        budgetRange,
        isCollaboration
      } = req.body || {};

      if (!proposerName || !email || !projectOverview) {
        return res.status(400).json({ error: "Proposer name, email, and project overview are required." });
      }

      const result = await sendProposalEmailNotification({
        proposalRef: proposalRef || `PROP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        proposerName: String(proposerName).trim(),
        organization: organization ? String(organization).trim() : undefined,
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : undefined,
        proposalType: String(proposalType || "Custom Clearance Proposal").trim(),
        targetFragment: String(targetFragment || "11:11 PM").trim(),
        mediaType: String(mediaType || "Media Production").trim(),
        projectTitle: String(projectTitle || "Untitled Project").trim(),
        projectOverview: String(projectOverview).trim(),
        distributionScope: String(distributionScope || "Worldwide").trim(),
        territory: String(territory || "Worldwide").trim(),
        term: String(term || "Perpetuity").trim(),
        budgetRange: String(budgetRange || "$1,000 – $5,000").trim(),
        isCollaboration: Boolean(isCollaboration)
      });

      res.json({
        success: true,
        proposalRef: result.proposalRef,
        message: "Proposal successfully dispatched to A&R and Rights Administration."
      });
    } catch (err: any) {
      console.error("[SEND PROPOSAL ERROR]:", err);
      res.status(500).json({ error: err.message || "Failed to dispatch proposal." });
    }
  });

  // Official Resend Inbound Webhook Endpoint (Receives emails sent to your domain)
  app.post("/api/webhooks/resend-inbound", async (req, res) => {
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const secret = process.env.RESEND_WEBHOOK_SECRET || "";
      if (secret && req.headers["svix-signature"]) {
        const isValid = verifyResendWebhookSignature(rawBody, req.headers, secret);
        if (!isValid) {
          console.warn("[RESEND INBOUND] Webhook signature mismatch for incoming payload.");
          return res.status(401).json({ error: "Invalid webhook signature." });
        }
      }

      const payload = req.body || {};
      // Unwrap nested Resend 'data' property if present (official Resend format for email.received)
      const data = payload.data || payload;
      const fromAddr = data.from || data.sender || payload.from || "unknown@remote.com";
      const toAddr = data.to || data.recipient || payload.to || "contact@theowlclock.io";
      const subject = data.subject || payload.subject || "(No Subject)";
      const text = data.text || payload.text || "";
      const html = data.html || payload.html || "";

      const cleanFrom = Array.isArray(fromAddr) ? fromAddr.join(", ") : String(fromAddr);
      const cleanTo = Array.isArray(toAddr) ? toAddr : [String(toAddr)];

      const recorded = recordInboundEmail({
        from: cleanFrom,
        to: cleanTo,
        subject,
        text,
        html,
        headers: data.headers || payload.headers,
        attachments: data.attachments || payload.attachments,
      });

      if (!useMockDb && db) {
        db.collection("emails").insertOne(recorded).catch((e: any) => console.error("Error inserting inbound email into Mongo:", e));
      }

      // Auto-forward priority notification to owner's Gmail (soluwatist@gmail.com)
      sendEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        replyTo: Array.isArray(fromAddr) ? fromAddr[0] : String(fromAddr),
        subject: `[INBOUND EMAIL: ${cleanTo.join(", ")}] ${subject}`,
        html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #050505; color: #E5E5E5; margin: 0; padding: 24px;">
          <div style="max-width: 620px; margin: 0 auto; background: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #222; background: #050505;">
              <h2 style="color: #D9D6CA; font-size: 15px; margin: 0; letter-spacing: 0.15em; text-transform: uppercase;">
                NEW INBOUND EMAIL RECEIVED VIA RESEND
              </h2>
              <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
                TO: <strong style="color: #FFF;">${cleanTo.join(", ")}</strong> &bull; FROM: <strong style="color: #FFF;">${cleanFrom}</strong>
              </p>
            </div>
            <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
              <p style="margin: 0 0 12px 0; color: #FFF; font-weight: bold; font-size: 14px;">
                Subject: ${subject}
              </p>
              <div style="background: #050505; border: 1px solid #262626; padding: 18px; border-radius: 3px; margin: 16px 0;">
                ${html || `<pre style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; white-space: pre-wrap; margin: 0; color: #EEE;">${text}</pre>`}
              </div>
              <p style="color: #888; font-size: 11px; font-family: monospace; margin: 12px 0 0 0;">
                Hit "Reply" in your email client to respond directly to <strong style="color: #FFF;">${cleanFrom}</strong>.
              </p>
            </div>
            <div style="padding: 14px 24px; border-top: 1px solid #222; background: #050505; font-size: 10px; color: #666; font-family: monospace;">
              The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia
            </div>
          </div>
        </body>
        </html>
      `,
        text: `Inbound email received at ${cleanTo.join(", ")} from ${cleanFrom}\nSubject: ${subject}\n\n${text}`,
        category: (recorded.category as any) || "contact"
      }).catch(e => console.error("Error auto-forwarding inbound email to Gmail:", e));

      console.log(`[RESEND INBOUND PROCESSED] From: ${cleanFrom} | To: ${cleanTo.join(", ")} | Subject: "${subject}"`);
      res.json({ success: true, id: recorded.id, message: "Inbound email received and registered." });
    } catch (err: any) {
      console.error("[INBOUND WEBHOOK ERROR]:", err);
      res.status(500).json({ error: err.message || "Failed to process inbound email." });
    }
  });

  // Manual / General Inbound Endpoint
  app.post("/api/emails/inbound", requireAdmin, async (req, res) => {
    try {
      const { from, to, subject, text, html, replyTo } = req.body || {};
      if (!from || !subject) {
        return res.status(400).json({ error: "Fields 'from' and 'subject' are required." });
      }

      const recorded = recordInboundEmail({
        from,
        to: to || "contact@theowlclock.io",
        subject,
        text,
        html,
        replyTo
      });

      if (!useMockDb && db) {
        db.collection("emails").insertOne(recorded).catch((e: any) => console.error("Error saving inbound email to DB:", e));
      }

      res.json({ success: true, email: recorded });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to record inbound email." });
    }
  });

  // Universal Outbound Send Endpoint (Internal / Admin / Client)
  app.post("/api/emails/send", requireAdmin, async (req, res) => {
    try {
      const { to, subject, html, text, from, replyTo, category } = req.body || {};
      if (!to || !subject) {
        return res.status(400).json({ error: "Fields 'to' and 'subject' are required." });
      }

      const result = await sendEmail({
        to,
        subject,
        html,
        text,
        from,
        replyTo,
        category: category || "contact"
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send email." });
    }
  });

  // Inbound Email Inbox Endpoint (List all received emails)
  app.get("/api/emails/inbox", requireAdmin, async (req, res) => {
    try {
      if (!useMockDb && db) {
        const dbEmails = await db.collection("emails").find({ direction: "inbound" }).sort({ timestamp: -1 }).limit(100).toArray();
        if (dbEmails.length > 0) {
          return res.json({ success: true, emails: dbEmails });
        }
      }

      const inMemoryInbound = inMemoryEmailStore.filter(e => e.direction === "inbound");
      res.json({ success: true, emails: inMemoryInbound });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Outbound Email Outbox Endpoint (List all sent emails)
  app.get("/api/emails/outbox", requireAdmin, async (req, res) => {
    try {
      if (!useMockDb && db) {
        const dbEmails = await db.collection("emails").find({ direction: "outbound" }).sort({ timestamp: -1 }).limit(100).toArray();
        if (dbEmails.length > 0) {
          return res.json({ success: true, emails: dbEmails });
        }
      }

      const inMemoryOutbound = inMemoryEmailStore.filter(e => e.direction === "outbound");
      res.json({ success: true, emails: inMemoryOutbound });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test Email Ping Endpoint (to test connection with Resend/Gmail)
  app.post("/api/emails/test", requireAdmin, async (req, res) => {
    try {
      const targetEmail = req.body.to || ADMIN_NOTIFICATION_EMAIL;
      const testResult = await sendEmail({
        to: targetEmail,
        subject: `[The Owl Clock] Email Connectivity Test (${new Date().toLocaleTimeString()})`,
        html: `
        <div style="font-family: monospace; background: #000; color: #FFF; padding: 20px; border: 1px solid #333;">
          <h2 style="color: #D9D6CA;">THE OWL CLOCK &bull; RESEND TEST PING</h2>
          <p>This confirms that your email dispatch pipeline is connected and operational.</p>
          <p>Active Resend Provider: <strong>${resendClient ? "Connected" : "Sandbox / SMTP"}</strong></p>
          <p>Collaboration Routing: <strong>${COLLABORATION_EMAIL}</strong></p>
          <p>Admin Notification Inbox: <strong>${ADMIN_NOTIFICATION_EMAIL}</strong></p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
        text: `The Owl Clock email connectivity test successful. Timestamp: ${new Date().toISOString()}`,
        category: "system"
      });

      res.json({ success: true, ...testResult, target: targetEmail });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
