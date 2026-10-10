import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  tags?: { name: string; value: string }[];
  category?: "contact" | "collaboration" | "clearance" | "license" | "support" | "system";
}

export interface EmailRecord {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  category?: string;
  status: "sent" | "delivered" | "received" | "failed" | "sandbox";
  provider: "resend" | "smtp" | "sandbox";
  providerId?: string;
  errorMessage?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// In-memory runtime store for emails (also mirrored to MongoDB when available)
export const inMemoryEmailStore: EmailRecord[] = [];

// Configuration
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "The Owl Clock <licensing@theowlclock.io>";
export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "soluwatist@gmail.com";
export const COLLABORATION_EMAIL = process.env.COLLABORATION_EMAIL || "collaboration@theowlclock.io";
export const CONTACT_EMAIL = "contact@theowlclock.io";
export const LEGAL_EMAIL = "legal@theowlclock.io";

// Initialize Resend Client
export const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Initialize SMTP fallback (e.g., Gmail SMTP)
export const smtpTransporter = (process.env.SMTP_USER && process.env.SMTP_PASS) ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

/**
 * Universal Send Email function using Resend with Gmail SMTP / Sandbox fallbacks
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id: string; provider: string; message?: string }> {
  const emailId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const toList = Array.isArray(options.to) ? options.to : [options.to];
  const fromAddress = options.from || RESEND_FROM_EMAIL;
  const replyTo = options.replyTo || (options.category === "collaboration" ? COLLABORATION_EMAIL : CONTACT_EMAIL);

  // 1. Try sending via Resend API
  if (resendClient) {
    try {
      // In sandbox mode without custom domain, Resend requires onboarding@resend.dev
      const safeFrom = fromAddress.includes("@theowlclock.io") && !process.env.RESEND_DOMAIN_VERIFIED
        ? `The Owl Clock <onboarding@resend.dev>`
        : fromAddress;

      const resendPayload: any = {
        from: safeFrom,
        to: toList,
        subject: options.subject,
        reply_to: replyTo,
      };

      if (options.html) resendPayload.html = options.html;
      if (options.text) resendPayload.text = options.text;
      if (options.attachments && options.attachments.length > 0) {
        resendPayload.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
        }));
      }
      if (options.tags) resendPayload.tags = options.tags;

      const resendRes = await resendClient.emails.send(resendPayload);

      if (resendRes.error) {
        console.warn("[RESEND SEND ERROR]", resendRes.error);
        throw new Error(resendRes.error.message);
      }

      const record: EmailRecord = {
        id: emailId,
        direction: "outbound",
        from: safeFrom,
        to: toList,
        replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        category: options.category || "system",
        status: "sent",
        provider: "resend",
        providerId: resendRes.data?.id || undefined,
        timestamp: new Date().toISOString(),
      };

      inMemoryEmailStore.unshift(record);
      return { success: true, id: record.id, provider: "resend" };
    } catch (err: any) {
      console.error("[RESEND DELIVERY FAILED, ATTEMPTING SMTP FALLBACK]:", err.message);
    }
  }

  // 2. Try sending via Gmail / Nodemailer SMTP
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to: toList.join(", "),
        replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      const record: EmailRecord = {
        id: emailId,
        direction: "outbound",
        from: fromAddress,
        to: toList,
        replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        category: options.category || "system",
        status: "sent",
        provider: "smtp",
        providerId: info.messageId,
        timestamp: new Date().toISOString(),
      };

      inMemoryEmailStore.unshift(record);
      return { success: true, id: record.id, provider: "smtp" };
    } catch (err: any) {
      console.error("[SMTP DELIVERY FAILED]:", err.message);
    }
  }

  // 3. Fallback: Record email into in-memory database with Sandbox status
  const record: EmailRecord = {
    id: emailId,
    direction: "outbound",
    from: fromAddress,
    to: toList,
    replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
    category: options.category || "system",
    status: "sandbox",
    provider: "sandbox",
    timestamp: new Date().toISOString(),
    metadata: {
      note: "Stored in sandbox outbox. Set RESEND_API_KEY or SMTP credentials to dispatch to live inboxes.",
    }
  };

  inMemoryEmailStore.unshift(record);
  console.log(`[EMAIL DISPATCH - SANDBOX BUFFER] Sent "${options.subject}" to ${toList.join(", ")}`);
  return { 
    success: true, 
    id: record.id, 
    provider: "sandbox",
    message: "Email queued in Sandbox Outbox. Configure RESEND_API_KEY in environment to deliver over live networks." 
  };
}

/**
 * Handle incoming email from Resend Inbound Webhook or external relay
 */
export function recordInboundEmail(payload: {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, any>;
  attachments?: any[];
}): EmailRecord {
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
  const toStr = toList.join(" ").toLowerCase();

  let category: EmailRecord["category"] = "contact";
  if (toStr.includes("collaboration") || payload.subject.toLowerCase().includes("collaboration") || payload.subject.toLowerCase().includes("co-pro")) {
    category = "collaboration";
  } else if (toStr.includes("licens") || toStr.includes("clearance") || payload.subject.toLowerCase().includes("clearance")) {
    category = "clearance";
  } else if (toStr.includes("legal") || toStr.includes("rights")) {
    category = "support";
  }

  const record: EmailRecord = {
    id: `inb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    direction: "inbound",
    from: payload.from,
    to: toList,
    replyTo: payload.replyTo || payload.from,
    subject: payload.subject || "(No Subject)",
    text: payload.text,
    html: payload.html,
    category,
    status: "received",
    provider: "resend",
    timestamp: new Date().toISOString(),
    metadata: {
      headers: payload.headers,
      attachmentsCount: payload.attachments?.length || 0,
    }
  };

  inMemoryEmailStore.unshift(record);
  console.log(`[INBOUND EMAIL RECEIVED] From: ${payload.from} | Subject: "${payload.subject}" | Category: ${category}`);
  return record;
}

/**
 * Helper to dispatch contact form transmissions
 */
export async function sendContactTransmission(data: {
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
  transmissionId?: string;
}) {
  const transmissionRef = data.transmissionId || `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
  const isCollaboration = data.department.toLowerCase().includes("collab") || 
                          data.subject.toLowerCase().includes("collab") || 
                          data.message.toLowerCase().includes("collab");

  const category = isCollaboration ? "collaboration" : "contact";
  const targetAdminEmail = ADMIN_NOTIFICATION_EMAIL;
  const replyToEmail = data.email;

  // 1. Notify Admin & Owner (at soluwatist@gmail.com)
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #E5E5E5; margin: 0; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #222; background-color: #050505;">
          <h1 style="color: #D9D6CA; font-size: 16px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">
            THE OWL CLOCK • ${isCollaboration ? "NEW COLLABORATION TRANSMISSION" : "INCOMING TRANSMISSION"}
          </h1>
          <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
            REF: ${transmissionRef} &bull; DEPARTMENT: ${data.department.toUpperCase()}
          </p>
        </div>
        <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="color: #888; padding: 6px 0; width: 140px; font-family: monospace; font-size: 11px; text-transform: uppercase;">Sender Name:</td>
              <td style="color: #FFF; font-weight: bold;">${data.name}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Sender Email:</td>
              <td style="color: #D9D6CA;"><a href="mailto:${data.email}" style="color: #D9D6CA; text-decoration: underline;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Department:</td>
              <td style="color: #FFF;">${data.department}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Subject:</td>
              <td style="color: #FFF;">${data.subject || "General Inquiry"}</td>
            </tr>
            ${isCollaboration ? `
            <tr>
              <td style="color: #D9D6CA; padding: 6px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Routing Desk:</td>
              <td style="color: #D9D6CA; font-weight: bold;">collaboration@theowlclock.io</td>
            </tr>` : ""}
          </table>

          <div style="background-color: #050505; border: 1px solid #262626; padding: 18px; border-radius: 3px; margin: 20px 0;">
            <p style="color: #888; font-size: 10px; font-family: monospace; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.1em;">Transmission Message Payload:</p>
            <p style="color: #E5E5E5; white-space: pre-wrap; margin: 0; font-size: 13px;">${data.message}</p>
          </div>

          <p style="color: #888; font-size: 11px; font-family: monospace;">
            You can hit "Reply" to respond directly to <strong style="color: #FFF;">${data.email}</strong>.
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #222; background-color: #050505; font-size: 10px; color: #666; font-family: monospace;">
          The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia
        </div>
      </div>
    </body>
    </html>
  `;

  // Dispatch notification to Admin
  await sendEmail({
    to: targetAdminEmail,
    replyTo: replyToEmail,
    subject: `[${isCollaboration ? "COLLABORATION" : "TRANSMISSION"}] ${data.subject || data.name} (Ref: ${transmissionRef})`,
    html: adminHtml,
    text: `Transmission from ${data.name} <${data.email}>\nDepartment: ${data.department}\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\nRef: ${transmissionRef}`,
    category,
    tags: [
      { name: "transmission_id", value: transmissionRef },
      { name: "department", value: data.department.toLowerCase().replace(/[^a-z]/g, "") },
    ]
  });

  // 2. Dispatch Automated Receipt Confirmation to Client
  const clientHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #E5E5E5; margin: 0; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #222; background-color: #050505;">
          <h1 style="color: #D9D6CA; font-size: 15px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0;">
            THE OWL CLOCK &bull; TRANSMISSION CONFIRMATION
          </h1>
          <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
            REFERENCE IDENTIFIER: ${transmissionRef}
          </p>
        </div>
        <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
          <p style="color: #FFF; font-weight: bold; margin-top: 0;">
            Greetings ${data.name},
          </p>
          <p style="color: #CCC;">
            Your communication regarding <strong style="color: #FFF;">"${data.subject || data.department}"</strong> has been logged into The Owl Clock's archival desk.
          </p>
          ${isCollaboration ? `
          <div style="background-color: #121214; border-left: 3px solid #D9D6CA; padding: 12px 16px; margin: 18px 0; font-size: 12px; color: #CCC;">
            <strong>Collaboration Note:</strong> Producer and creative co-release proposals are routed directly to our Rights &amp; Repertoire team (<span style="color: #D9D6CA; font-family: monospace;">collaboration@theowlclock.io</span>). We review sonic proposals, cue compatibility, and publishing terms with high priority.
          </div>
          ` : ""}
          <p style="color: #888; font-size: 12px;">
            A representative from our Rights Administration desk will respond shortly.
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #222; background-color: #050505; font-size: 10px; color: #666; font-family: monospace;">
          The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia &bull; https://theowlclock.io
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.email,
    from: isCollaboration ? `The Owl Clock Collaboration <${COLLABORATION_EMAIL}>` : RESEND_FROM_EMAIL,
    replyTo: isCollaboration ? COLLABORATION_EMAIL : CONTACT_EMAIL,
    subject: `[The Owl Clock] Transmission Acknowledged: ${transmissionRef}`,
    html: clientHtml,
    text: `Greetings ${data.name},\n\nYour transmission (Ref: ${transmissionRef}) regarding "${data.subject || data.department}" has been securely logged.\n\nOur team will review your message shortly.\n\nThe Owl Clock Archive\nhttps://theowlclock.io`,
    category,
    tags: [{ name: "transmission_id", value: transmissionRef }]
  });

  return { success: true, transmissionRef };
}

/**
 * Helper to dispatch automated License & Deliverable Assets on checkout
 */
export async function sendLicenseDeliveryEmail(data: {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  planTitle: string;
  planCode: string;
  priceDisplay: string;
  audioFiles?: { name: string; url: string }[];
  licenseAgreementUrl?: string;
  transactionRef?: string;
}) {
  const downloadLinksHtml = (data.audioFiles || []).map(f => `
    <li style="margin-bottom: 8px;">
      <a href="${f.url}" target="_blank" style="color: #D9D6CA; text-decoration: underline; font-family: monospace; font-size: 12px;">
        ${f.name} (Direct Cloudflare Master) &rarr;
      </a>
    </li>
  `).join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #E5E5E5; margin: 0; padding: 30px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
        <div style="padding: 26px; border-bottom: 1px solid #222; background-color: #050505;">
          <h1 style="color: #D9D6CA; font-size: 16px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0;">
            THE OWL CLOCK &bull; LICENSE CLEARANCE GRANT
          </h1>
          <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
            ORDER: ${data.orderId} &bull; COVENANT: ${data.planCode} &bull; ${data.priceDisplay}
          </p>
        </div>
        <div style="padding: 26px; font-size: 13px; line-height: 1.6;">
          <p style="color: #FFF; font-weight: bold; margin-top: 0;">
            Dear ${data.buyerName || "Valued Licensee"},
          </p>
          <p style="color: #CCC;">
            Payment verification has completed. Your legal master and synchronization rights grant under <strong style="color: #FFF;">${data.planTitle} (${data.planCode})</strong> has been registered into the Master Archive Registry.
          </p>

          <div style="background-color: #050505; border: 1px solid #262626; padding: 18px; border-radius: 3px; margin: 20px 0;">
            <p style="color: #D9D6CA; font-size: 11px; font-family: monospace; text-transform: uppercase; margin: 0 0 12px 0; font-weight: bold;">
              DELIVERABLE HIGH-FIDELITY ASSETS:
            </p>
            <ul style="padding-left: 20px; margin: 0;">
              ${downloadLinksHtml || "<li style='color: #888;'>Deliverable assets will be unlocked directly via your authenticated client dashboard.</li>"}
            </ul>
          </div>

          <p style="color: #CCC; font-size: 12px;">
            A signed copy of your License Certificate and SHA-256 Covenant Hash has been preserved on permanent immutable storage.
          </p>
        </div>
        <div style="padding: 16px 26px; border-top: 1px solid #222; background-color: #050505; font-size: 10px; color: #666; font-family: monospace;">
          The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia &bull; https://theowlclock.io
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.buyerEmail,
    from: RESEND_FROM_EMAIL,
    replyTo: "licensing@theowlclock.io",
    subject: `[The Owl Clock] Official License Clearance: ${data.planCode} (${data.orderId})`,
    html: emailHtml,
    text: `Dear ${data.buyerName},\n\nYour license grant for ${data.planTitle} (${data.planCode}) has been confirmed.\nOrder ID: ${data.orderId}\n\nDeliverable files and covenant certificates have been provisioned.\n\nThe Owl Clock Archive\nhttps://theowlclock.io`,
    category: "license",
    tags: [
      { name: "order_id", value: data.orderId },
      { name: "plan_code", value: data.planCode }
    ]
  });
}

/**
 * Helper to dispatch automated Custom Proposal & Collaboration Dossiers
 */
export async function sendProposalEmailNotification(data: {
  proposalRef: string;
  proposerName: string;
  organization?: string;
  email: string;
  phone?: string;
  proposalType: string;
  targetFragment: string;
  mediaType: string;
  projectTitle: string;
  projectOverview: string;
  distributionScope: string;
  territory: string;
  term: string;
  budgetRange: string;
  isCollaboration?: boolean;
}) {
  const proposalRef = data.proposalRef || `PROP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const isCollaboration = Boolean(
    data.isCollaboration || 
    data.proposalType?.toLowerCase().includes("collab") || 
    data.projectTitle?.toLowerCase().includes("collab") || 
    data.projectOverview?.toLowerCase().includes("collab")
  );

  const category = isCollaboration ? "collaboration" : "clearance";
  const deskEmail = isCollaboration ? COLLABORATION_EMAIL : "licensing@theowlclock.io";

  // 1. Send Priority Dossier to Admin / Gmail (soluwatist@gmail.com)
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #E5E5E5; margin: 0; padding: 30px;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
        <div style="padding: 26px; border-bottom: 1px solid #222; background-color: #050505;">
          <h1 style="color: #D9D6CA; font-size: 16px; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">
            THE OWL CLOCK &bull; ${isCollaboration ? "NEW COLLABORATION PROPOSAL" : "NEW BESPOKE CLEARANCE PROPOSAL"}
          </h1>
          <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
            DOCKET: ${proposalRef} &bull; TARGET: ${data.targetFragment || "UNSPECIFIED"} &bull; ROUTING: ${deskEmail}
          </p>
        </div>
        <div style="padding: 26px; font-size: 13px; line-height: 1.6;">
          <div style="background-color: #121214; border-left: 3px solid #D9D6CA; padding: 14px 18px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12.5px; color: #EEE;">
              <strong>${isCollaboration ? "Collaboration Proposal Received" : "Custom Rights Proposal Received"}</strong>: Review applicant specifications below and click "Reply" to respond directly to <strong style="color: #FFF;">${data.email}</strong>.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12.5px;">
            <tr>
              <td style="color: #888; padding: 7px 0; width: 160px; font-family: monospace; font-size: 11px; text-transform: uppercase;">Proposer Name:</td>
              <td style="color: #FFF; font-weight: bold;">${data.proposerName} ${data.organization ? `<span style="color: #AAA; font-weight: normal;">(${data.organization})</span>` : ""}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Applicant Email:</td>
              <td style="color: #D9D6CA;"><a href="mailto:${data.email}" style="color: #D9D6CA; text-decoration: underline;">${data.email}</a></td>
            </tr>
            ${data.phone ? `
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Contact Phone:</td>
              <td style="color: #FFF;">${data.phone}</td>
            </tr>` : ""}
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Target Beat / Fragment:</td>
              <td style="color: #FFF; font-weight: bold;">${data.targetFragment}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Proposal Scope:</td>
              <td style="color: #FFF;">${data.proposalType}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Media / Distribution:</td>
              <td style="color: #FFF;">${data.mediaType} &bull; ${data.distributionScope}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Territory &amp; Term:</td>
              <td style="color: #FFF;">${data.territory} &bull; ${data.term}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 7px 0; font-family: monospace; font-size: 11px; text-transform: uppercase;">Budget / Valuation:</td>
              <td style="color: #D9D6CA; font-weight: bold;">${data.budgetRange}</td>
            </tr>
          </table>

          <div style="background-color: #050505; border: 1px solid #262626; padding: 18px; border-radius: 3px; margin: 20px 0;">
            <p style="color: #888; font-size: 10px; font-family: monospace; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.1em;">
              Project Title: <strong style="color: #FFF;">${data.projectTitle || "Untitled Project"}</strong>
            </p>
            <p style="color: #E5E5E5; white-space: pre-wrap; margin: 0; font-size: 13px;">${data.projectOverview}</p>
          </div>
        </div>
        <div style="padding: 16px 26px; border-top: 1px solid #222; background-color: #050505; font-size: 10px; color: #666; font-family: monospace;">
          The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    replyTo: data.email,
    subject: `[${isCollaboration ? "COLLABORATION PROPOSAL" : "CUSTOM PROPOSAL"}] ${data.projectTitle || data.targetFragment} (${proposalRef})`,
    html: adminHtml,
    text: `Proposal from ${data.proposerName} <${data.email}>\nType: ${data.proposalType}\nTarget: ${data.targetFragment}\nBudget: ${data.budgetRange}\n\nProject:\n${data.projectOverview}\n\nRef: ${proposalRef}`,
    category,
    tags: [
      { name: "proposal_ref", value: proposalRef },
      { name: "proposal_type", value: isCollaboration ? "collaboration" : "custom" }
    ]
  });

  // 2. Send Formal Docket Acknowledgment to Applicant
  const applicantHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #E5E5E5; margin: 0; padding: 30px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #0F0F10; border: 1px solid #222; border-radius: 4px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #222; background-color: #050505;">
          <h1 style="color: #D9D6CA; font-size: 15px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0;">
            THE OWL CLOCK &bull; PROPOSAL DOCKET REGISTERED
          </h1>
          <p style="color: #888; font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">
            DOCKET IDENTIFIER: ${proposalRef}
          </p>
        </div>
        <div style="padding: 24px; font-size: 13px; line-height: 1.6;">
          <p style="color: #FFF; font-weight: bold; margin-top: 0;">
            Dear ${data.proposerName},
          </p>
          <p style="color: #CCC;">
            Thank you for submitting your ${isCollaboration ? "artistic collaboration proposal" : "custom clearance proposal"} regarding <strong style="color: #FFF;">${data.targetFragment}</strong> (${data.projectTitle || "Your Project"}).
          </p>
          <p style="color: #CCC;">
            Your project parameters have been logged into our clearance registry under Docket Identifier <strong style="color: #D9D6CA; font-family: monospace;">${proposalRef}</strong>.
          </p>
          <div style="background-color: #121214; border: 1px solid #222; padding: 14px 18px; margin: 18px 0; font-size: 12px; color: #AAA;">
            <p style="margin: 0 0 6px 0; color: #FFF; font-weight: bold;">Review Process:</p>
            An archivist from our Rights &amp; Repertoire team (${deskEmail}) will review your synchronization parameters, media distribution scope, and tonal alignment within 24 to 48 hours.
          </div>
          <p style="color: #888; font-size: 11px; font-family: monospace;">
            If you need to supply additional pitch decks, cue sheets, or references, simply reply directly to this transmission.
          </p>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #222; background-color: #050505; font-size: 10px; color: #666; font-family: monospace;">
          The Owl Clock &bull; Publishing &bull; Rights Management &bull; Licensing &bull; Atlanta, Georgia &bull; https://theowlclock.io
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.email,
    from: isCollaboration ? `The Owl Clock Collaboration <${COLLABORATION_EMAIL}>` : RESEND_FROM_EMAIL,
    replyTo: deskEmail,
    subject: `[The Owl Clock] Proposal Docket Registered: ${proposalRef}`,
    html: applicantHtml,
    text: `Dear ${data.proposerName},\n\nYour proposal for ${data.targetFragment} (Ref: ${proposalRef}) has been registered.\n\nOur team will review your project parameters within 24-48 hours.\n\nThe Owl Clock Archive\nhttps://theowlclock.io`,
    category,
    tags: [{ name: "proposal_ref", value: proposalRef }]
  });

  return { success: true, proposalRef };
}
