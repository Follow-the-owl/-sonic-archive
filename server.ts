import express from "express";
import path from "path";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";
import nodemailer from "nodemailer";

// --- Types ---
interface User {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface License {
  id: string;
  song: string;
  type: string;
  date: string;
  isrc: string;
  iswc: string;
  email: string;
  signature: string;
  hash: string;
}

interface RequestItem {
  ref: string;
  type: string;
  target: string;
  status: string;
  date: string;
  email: string;
}

interface Payment {
  id: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  date: string;
  items: any[];
}


const app = express();
const PORT = 3000;

app.use(express.json());

// Database initialization middleware (critical for serverless execution like Vercel)
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error("[MIDDLEWARE] Database initialization failed:", err);
  }
  next();
});

// --- Database Connection & Fail-safe Mock Fallbacks ---
let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let useMockDb = true;
let dbStatusMsg = "Initializing...";
let dbErrorDetail = "";

// In-Memory Fallbacks (used if MONGODB_URI is not provided or connection fails)
const mockUsers: Map<string, User> = new Map();
const mockSessions: Map<string, string> = new Map(); // token -> email
const mockLicenses: License[] = [
  { 
    id: "LOMON-OWL-823", 
    song: "The Owl Clock - Midnight Drift (Theme II)", 
    type: "Commercial Sync & Broadcast", 
    date: "2026-06-30 UTC",
    isrc: "US-LMN-26-00301",
    iswc: "T-302.459.882-1",
    email: "evianaconcepts1@gmail.com",
    signature: "DIGITALLY REGISTERED VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL",
    hash: "0x8F9C2B7A1E4D039F"
  },
  { 
    id: "LOMON-OWL-014", 
    song: "The Observatory - Dawn Chorus (Ambient)", 
    type: "Release License Agreement", 
    date: "2026-06-15 UTC",
    isrc: "US-LMN-26-00302",
    iswc: "T-302.459.882-2",
    email: "evianaconcepts1@gmail.com",
    signature: "DIGITALLY REGISTERED VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL",
    hash: "0x39E8F7A1B2C3D4E5"
  }
];

const mockRequests: RequestItem[] = [
  { 
    ref: "REQ-039-44", 
    type: "Commercial Clearance Request", 
    target: "Midnight Drift", 
    status: "UNDER LEGAL REVIEW", 
    date: "2026-06-30", 
    email: "evianaconcepts1@gmail.com" 
  },
  { 
    ref: "REQ-012-98", 
    type: "ISWC Publishing Registration", 
    target: "Dawn Chorus", 
    status: "SUBMITTED TO PRO", 
    date: "2026-06-28", 
    email: "evianaconcepts1@gmail.com" 
  }
];

const mockPayments: Payment[] = [
  {
    id: "PAY-PS-892019",
    email: "evianaconcepts1@gmail.com",
    amount: 15000,
    currency: "NGN",
    status: "success",
    gateway: "paystack",
    date: "2026-06-30 18:22:15 UTC",
    items: [{ id: "00:50", name: "The Owl Clock - Midnight Drift (Theme II)", price: "$10.00" }]
  },
  {
    id: "PAY-PS-102941",
    email: "evianaconcepts1@gmail.com",
    amount: 12000,
    currency: "NGN",
    status: "success",
    gateway: "paystack",
    date: "2026-06-15 14:10:00 UTC",
    items: [{ id: "02:17", name: "The Observatory - Dawn Chorus (Ambient)", price: "$29.99" }]
  }
];

interface EmailLog {
  id: string;
  email: string;
  reference: string;
  subject: string;
  previewUrl?: string;
  html: string;
  date: string;
}

const mockEmailLogs: EmailLog[] = [];

let dbInitPromise: Promise<void> | null = null;

async function initializeDatabase() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn("\x1b[33m%s\x1b[0m", "[DATABASE] WARNING: MONGODB_URI environment variable is not defined.");
      console.warn("\x1b[33m%s\x1b[0m", "[DATABASE] Defaulting to safe, fully featured in-memory database mock store.");
      useMockDb = true;
      dbStatusMsg = "OFFLINE - MONGODB_URI missing. Using fully functional Sandbox Mock database.";
      dbErrorDetail = "MONGODB_URI environment variable not configured in AI Studio / container environment variables.";
      return;
    }

    try {
      console.log("[DATABASE] Attempting connection to MongoDB...");
      const client = new MongoClient(uri, {
        connectTimeoutMS: 1500,
        serverSelectionTimeoutMS: 1500,
        socketTimeoutMS: 1500
      });
      await client.connect();
      db = client.db();
      mongoClient = client;
      
      console.log("\x1b[32m%s\x1b[0m", "[DATABASE] SUCCESS: Connected to real MongoDB database.");
      dbStatusMsg = "CONNECTED - MongoDB database connection is active and fully functional.";
      dbErrorDetail = "";
      useMockDb = false;
      
      // Seed default mock licenses for seed admin email if they don't exist
      const licensesCol = db.collection("licenses");
      const count = await licensesCol.countDocuments().catch(() => 0);
      if (count === 0) {
        await licensesCol.insertMany(mockLicenses).catch(() => {});
        await db.collection("requests").insertMany(mockRequests).catch(() => {});
        await db.collection("payments").insertMany(mockPayments).catch(() => {});
        console.log("[DATABASE] Seeded default credentials, licenses and payments to MongoDB collections.");
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.log("[DATABASE] INFO: MongoDB connection attempt bypassed or failed. Message: " + errorMsg);
      dbStatusMsg = "OFFLINE - MongoDB connection failed. Sandbox Mock database is active.";
      dbErrorDetail = errorMsg;
      
      if (errorMsg.includes("alert number 80") || errorMsg.includes("tlsv1 alert") || errorMsg.includes("SSL alert")) {
        console.log("\x1b[33m%s\x1b[0m", "=====================================================================================");
        console.log("\x1b[33m%s\x1b[0m", "[DATABASE] DIAGNOSTIC TIP: This TLS alert number 80 / handshake error almost always");
        console.log("\x1b[33m%s\x1b[0m", "means your current Server IP address is NOT whitelisted in MongoDB Atlas.");
        console.log("\x1b[33m%s\x1b[0m", "To fix this: Go to your MongoDB Atlas dashboard -> 'Network Access' tab, and add");
        console.log("\x1b[33m%s\x1b[0m", "'0.0.0.0/0' to allow access from dynamic server containers.");
        console.log("\x1b[33m%s\x1b[0m", "=====================================================================================");
        dbStatusMsg = "OFFLINE - SSL Handshake Error (IP Whitelist Missing in MongoDB Atlas)";
      }
      
      console.log("[DATABASE] NOTICE: Falling back to safe, fully featured in-memory database mock store.");
      useMockDb = true;
    }
  })();

  return dbInitPromise;
}

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper: Token generator
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper: send premium transaction license dispatch email
async function sendLicenseEmail(email: string, licenses: License[], amountNgn: number, reference: string): Promise<string> {
  console.log(`[EMAIL BYPASS] Email dispatch disabled as per instructions. No transmission email will be sent to ${email} for reference ${reference}.`);
  return "";
}

// --- API ENDPOINTS ---

// Authenticate session token middleware/helper
async function getEmailFromToken(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  if (useMockDb) {
    return mockSessions.get(token) || null;
  } else {
    try {
      const session = await db!.collection("sessions").findOne({ token });
      return session ? session.email : null;
    } catch {
      return null;
    }
  }
}

// Endpoint to check current MongoDB connection status
app.get("/api/db-status", (req, res) => {
  res.json({
    success: !useMockDb,
    status: dbStatusMsg,
    error: dbErrorDetail,
    timestamp: new Date().toISOString()
  });
});

// 1. Auth: Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    if (useMockDb) {
      if (mockUsers.has(normalizedEmail)) {
        return res.status(400).json({ error: "Email address already registered." });
      }
      mockUsers.set(normalizedEmail, {
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date()
      });
    } else {
      const usersCol = db!.collection("users");
      const existingUser = await usersCol.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email address already registered." });
      }
      await usersCol.insertOne({
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date()
      });
    }

    // Auto-create a session
    const token = generateToken();
    if (useMockDb) {
      mockSessions.set(token, normalizedEmail);
    } else {
      await db!.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
    }

    res.json({ success: true, token, email: normalizedEmail, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 2. Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    let authenticated = false;

    if (useMockDb) {
      const user = mockUsers.get(normalizedEmail);
      // Hardcode default login for the preset admin email to ease testing
      if (normalizedEmail === "evianaconcepts1@gmail.com" && !user) {
        mockUsers.set(normalizedEmail, {
          email: normalizedEmail,
          passwordHash: hashPassword("lomon2026"),
          createdAt: new Date()
        });
        authenticated = password === "lomon2026";
      } else if (user) {
        authenticated = user.passwordHash === passwordHash;
      }
    } else {
      const user = await db!.collection("users").findOne({ email: normalizedEmail });
      if (normalizedEmail === "evianaconcepts1@gmail.com" && !user) {
        // Safe default password for demo seed if user registers later
        const defaultHash = hashPassword("lomon2026");
        await db!.collection("users").insertOne({ email: normalizedEmail, passwordHash: defaultHash, createdAt: new Date() });
        authenticated = password === "lomon2026";
      } else if (user) {
        authenticated = user.passwordHash === passwordHash;
      }
    }

    if (!authenticated) {
      return res.status(401).json({ error: "Invalid cryptographic credentials or password." });
    }

    const token = generateToken();
    if (useMockDb) {
      mockSessions.set(token, normalizedEmail);
    } else {
      await db!.collection("sessions").insertOne({ token, email: normalizedEmail, createdAt: new Date() });
    }

    res.json({ success: true, token, email: normalizedEmail, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 3. Auth: Current user info
app.get("/api/auth/me", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Terminal unauthorized." });
    }

    res.json({ success: true, email, database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 4. Auth: Logout
app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (useMockDb) {
        mockSessions.delete(token);
      } else {
        await db!.collection("sessions").deleteOne({ token });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 5. Database Fetch: User secure data (Licenses & Requests)
app.get("/api/user/data", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Authentication token required." });
    }

    let userLicenses: License[] = [];
    let userRequests: RequestItem[] = [];
    let userEmailLogs: EmailLog[] = [];

    if (useMockDb) {
      userLicenses = mockLicenses.filter((lic) => lic.email === email);
      userRequests = mockRequests.filter((reqItem) => reqItem.email === email);
      userEmailLogs = mockEmailLogs.filter((log) => log.email === email);
    } else {
      userLicenses = (await db!.collection("licenses").find({ email }).toArray()) as any[];
      userRequests = (await db!.collection("requests").find({ email }).toArray()) as any[];
      userEmailLogs = (await db!.collection("email_logs").find({ email }).toArray()) as any[];
    }

    res.json({
      success: true,
      email,
      licenses: userLicenses,
      requests: userRequests,
      emailLogs: userEmailLogs,
      database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// 6. Database Action: Record custom checkout purchases
app.post("/api/user/purchase", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Terminal unauthorized. Login required to record acquisitions." });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Acquisitions payload must contain item list." });
    }

    const generatedLicenses: License[] = items.map((item: any) => {
      const uniqueSuffix = Math.floor(100 + Math.random() * 900);
      const uniqueId = `LOMON-OWL-${uniqueSuffix}`;
      const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      
      return {
        id: uniqueId,
        song: item.name,
        type: item.tierTitle || "Commercial Sync & Broadcast",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
        iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
        email,
        signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${email.toUpperCase()}`,
        hash: contractHash
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

// 7. Database Action: Submit clearance or metadata requests manually
app.post("/api/user/request", async (req, res) => {
  try {
    const email = await getEmailFromToken(req);
    if (!email) {
      return res.status(401).json({ error: "Terminal unauthorized." });
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

// Pending transactions store to retrieve items on callback redirect
const pendingTransactions = new Map<string, { email: string; items: any[]; billing?: any }>();

// 8. Real/Mock Paystack: Initialize Transaction
app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, items } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required for initialization." });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const reference = `LMN-PS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    if (!paystackSecret) {
      // Sandbox Mode / Mock mode fallback if keys are not defined
      console.log("[PAYSTACK] PAYSTACK_SECRET_KEY not defined. Falling back to sandbox initialize simulation.");
      
      if (items) {
        pendingTransactions.set(reference, { email, items });
      }

      return res.json({
        success: true,
        reference,
        isMock: true,
        amount,
        message: "Paystack initialized in safe simulation mode."
      });
    }

    // Call real Paystack API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // convert to kobo (e.g. NGN 15000 = 1500000 kobo)
        reference,
        callback_url: `${process.env.APP_URL || "http://localhost:3000"}/api/paystack/callback`
      })
    });

    const data: any = await response.json();
    if (data.status) {
      if (items) {
        pendingTransactions.set(reference, { email, items });
      }

      res.json({
        success: true,
        reference,
        isMock: false,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code
      });
    } else {
      res.status(400).json({ error: data.message || "Failed to initialize real Paystack transaction." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Paystack integration failure." });
  }
});

// 9. Real/Mock Paystack: Verify Transaction & Auto-grant License
app.post("/api/paystack/verify", async (req, res) => {
  try {
    const { reference, email, items, billing } = req.body;
    if (!reference || !email || !items) {
      return res.status(400).json({ error: "Reference, email and items payload are required." });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    let paymentVerified = false;
    let actualAmount = 0;

    if (!paystackSecret) {
      // Mock Sandbox Verification success
      console.log(`[PAYSTACK] PAYSTACK_SECRET_KEY not defined. Auto-verifying reference: ${reference} as Sandbox SUCCESS.`);
      paymentVerified = true;
      actualAmount = items.reduce((sum: number, item: any) => {
        const numericPrice = parseFloat(item.price?.replace(/[^0-9.]/g, "")) || 0;
        return sum + (numericPrice * 1500); // 1500 exchange rate NGN
      }, 0);
    } else {
      // Real verify request to Paystack API
      console.log(`[PAYSTACK] Fetching real Paystack verification for reference: ${reference}`);
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecret}`
        }
      });
      const data: any = await response.json();
      if (data.status && data.data.status === "success") {
        paymentVerified = true;
        actualAmount = data.data.amount / 100; // in NGN
      } else {
        return res.status(400).json({ error: data.message || "Real Paystack verification failed." });
      }
    }

    if (paymentVerified) {
      const dbEmail = email.toLowerCase().trim();
      const generatedLicenses: License[] = items.map((item: any) => {
        const uniqueSuffix = Math.floor(100 + Math.random() * 900);
        const uniqueId = `LOMON-OWL-${uniqueSuffix}`;
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        
        return {
          id: uniqueId,
          song: item.name,
          type: item.tierTitle || "Commercial Sync & Broadcast",
          date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
          iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
          email: dbEmail,
          signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
          hash: contractHash
        };
      });

      const generatedRequests: RequestItem[] = items.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const newPayment: Payment = {
        id: reference,
        email: dbEmail,
        amount: actualAmount,
        currency: "NGN",
        status: "success",
        gateway: paystackSecret ? "paystack" : "paystack_sandbox",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items
      };

      // Persistence
      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
        mockPayments.push(newPayment);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(newPayment);
      }

      // Dispatch license confirmation email (real SMTP or auto-simulated sandbox preview URL)
      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, reference);

      res.json({
        success: true,
        reference,
        licenses: generatedLicenses,
        requests: generatedRequests,
        payment: newPayment,
        emailPreviewUrl,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } else {
      res.status(400).json({ error: "Could not authorize transaction with standard Paystack protocols." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error during verification." });
  }
});

// 9b. Real/Mock Paystack: Callback Redirect Redirects user back to client with success parameters
app.get("/api/paystack/callback", async (req, res) => {
  try {
    const reference = (req.query.reference || req.query.trxref) as string;
    if (!reference) {
      return res.redirect("/?payment_error=Missing reference code.");
    }

    const pending = pendingTransactions.get(reference);
    const email = pending?.email || "guest@lomon.local";
    const items = pending?.items || [];

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    let paymentVerified = false;
    let actualAmount = 0;

    if (!paystackSecret) {
      console.log(`[PAYSTACK CALLBACK] Sandbox mode verify for reference: ${reference}`);
      paymentVerified = true;
      actualAmount = items.reduce((sum: number, item: any) => {
        const numericPrice = parseFloat(item.price?.replace(/[^0-9.]/g, "")) || 0;
        return sum + (numericPrice * 1500);
      }, 0);
    } else {
      console.log(`[PAYSTACK CALLBACK] Real Paystack verify for reference: ${reference}`);
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecret}`
        }
      });
      const data: any = await response.json();
      if (data.status && data.data.status === "success") {
        paymentVerified = true;
        actualAmount = data.data.amount / 100;
      }
    }

    if (paymentVerified) {
      const dbEmail = email.toLowerCase().trim();
      const generatedLicenses: License[] = items.map((item: any) => {
        const uniqueSuffix = Math.floor(100 + Math.random() * 900);
        const uniqueId = `LOMON-OWL-${uniqueSuffix}`;
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        
        return {
          id: uniqueId,
          song: item.name,
          type: item.tierTitle || "Commercial Sync & Broadcast",
          date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
          iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
          email: dbEmail,
          signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
          hash: contractHash
        };
      });

      const generatedRequests: RequestItem[] = items.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const newPayment: Payment = {
        id: reference,
        email: dbEmail,
        amount: actualAmount,
        currency: "NGN",
        status: "success",
        gateway: paystackSecret ? "paystack" : "paystack_sandbox",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items
      };

      if (useMockDb) {
        mockLicenses.push(...generatedLicenses);
        mockRequests.push(...generatedRequests);
        mockPayments.push(newPayment);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(newPayment);
      }

      // Dispatch license confirmation email (real SMTP or auto-simulated sandbox preview URL)
      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, reference);

      // Generate a session token for this user so they are automatically authenticated upon returning!
      const sessionToken = crypto.randomBytes(32).toString("hex");
      if (useMockDb) {
        mockSessions.set(sessionToken, dbEmail);
        // Ensure user account exists in mock accounts
        if (!mockUsers.has(dbEmail)) {
          mockUsers.set(dbEmail, {
            email: dbEmail,
            passwordHash: hashPassword("123456"),
            createdAt: new Date()
          });
        }
      } else {
        // Find or create user
        const existingUser = await db!.collection("users").findOne({ email: dbEmail });
        if (!existingUser) {
          await db!.collection("users").insertOne({
            email: dbEmail,
            passwordHash: hashPassword("123456"), // Default placeholder password
            role: "user",
            createdAt: new Date()
          });
        }
        await db!.collection("sessions").insertOne({
          token: sessionToken,
          email: dbEmail,
          createdAt: new Date()
        });
      }

      // Clean up the pending map
      pendingTransactions.delete(reference);

      // Redirect back to our site with payment_success=true, session token, email, and the preview url!
      return res.redirect(`/?payment_success=true&reference=${reference}&auth_token=${sessionToken}&email=${encodeURIComponent(dbEmail)}&email_preview_url=${encodeURIComponent(emailPreviewUrl)}`);
    } else {
      return res.redirect("/?payment_error=Transaction could not be authorized.");
    }
  } catch (err: any) {
    console.error("[PAYSTACK CALLBACK ERROR]", err);
    return res.redirect("/?payment_error=" + encodeURIComponent(err.message || "Callback internal server error."));
  }
});

// 10. Database Action: Secure License Transfer CRUD action
app.post("/api/licenses/transfer", async (req, res) => {
  try {
    const ownerEmail = await getEmailFromToken(req);
    if (!ownerEmail) {
      return res.status(401).json({ error: "Terminal unauthorized. Authorization token required." });
    }

    const { licenseId, recipientEmail } = req.body;
    if (!licenseId || !recipientEmail) {
      return res.status(400).json({ error: "License ID and recipient email address are required fields." });
    }

    const targetRecipient = recipientEmail.toLowerCase().trim();
    const cleanLicenseId = licenseId.trim();

    // Check if recipient is a registered user
    let recipientExists = false;
    if (useMockDb) {
      recipientExists = mockUsers.has(targetRecipient) || targetRecipient === "evianaconcepts1@gmail.com";
    } else {
      const recipientUser = await db!.collection("users").findOne({ email: targetRecipient });
      recipientExists = !!recipientUser;
    }

    if (!recipientExists) {
      return res.status(404).json({ error: `Transfer recipient terminal "${targetRecipient}" is not a registered user on the LOMON security network.` });
    }

    // Verify ownership and perform transfer
    let success = false;
    let transferredLicense: License | null = null;

    if (useMockDb) {
      const idx = mockLicenses.findIndex(lic => lic.id === cleanLicenseId && lic.email === ownerEmail);
      if (idx !== -1) {
        mockLicenses[idx].email = targetRecipient;
        // Update signature to reflect transfer
        mockLicenses[idx].signature = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${mockLicenses[idx].hash}`;
        transferredLicense = mockLicenses[idx];
        success = true;

        // Register requests log for transfer audit
        mockRequests.push({
          ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
          type: "License Transfer Audit Log",
          target: mockLicenses[idx].song,
          status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
          date: new Date().toISOString().split("T")[0],
          email: ownerEmail
        });
        mockRequests.push({
          ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
          type: "License Received Audit Log",
          target: mockLicenses[idx].song,
          status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
          date: new Date().toISOString().split("T")[0],
          email: targetRecipient
        });
      }
    } else {
      const licensesCol = db!.collection("licenses");
      const license = await licensesCol.findOne({ id: cleanLicenseId, email: ownerEmail });
      if (license) {
        const newSig = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${license.hash}`;
        await licensesCol.updateOne(
          { id: cleanLicenseId },
          { $set: { email: targetRecipient, signature: newSig } }
        );
        transferredLicense = (await licensesCol.findOne({ id: cleanLicenseId })) as any;
        success = true;

        // Log transfer audit requests
        await db!.collection("requests").insertMany([
          {
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Transfer Audit Log",
            target: license.song,
            status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: ownerEmail
          },
          {
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Received Audit Log",
            target: license.song,
            status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: targetRecipient
          }
        ]);
      }
    }

    if (success && transferredLicense) {
      res.json({ success: true, message: `License ${cleanLicenseId} successfully transferred to ${targetRecipient}.`, license: transferredLicense });
    } else {
      res.status(403).json({ error: "Access denied. You do not own this license or it does not exist." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to execute license transfer protocol." });
  }
});

// 11. Payments CRUD: Read (All payments)
app.get("/api/admin/payments", async (req, res) => {
  try {
    let payments: Payment[] = [];
    if (useMockDb) {
      payments = mockPayments;
    } else {
      payments = (await db!.collection("payments").find({}).toArray()) as any[];
    }
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve payments." });
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
        status: "SECURED TERMINAL"
      }));
      // ensure we also list the hardcoded evianaconcepts email if it's accessed
      if (!mockUsers.has("evianaconcepts1@gmail.com")) {
        inMemoryUsers.push({
          email: "evianaconcepts1@gmail.com",
          createdAt: new Date("2026-06-01T00:00:00Z"),
          status: "SEED ADMIN"
        });
      }
      usersList = inMemoryUsers;
    } else {
      usersList = await db!.collection("users").find({}, { projection: { passwordHash: 0 } }).toArray();
    }
    res.json({ success: true, users: usersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve terminal users." });
  }
});

// 12. User CRUD: Create (Add terminal manually)
app.post("/api/admin/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and cipher password are required." });
    }

    const targetEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    if (useMockDb) {
      if (mockUsers.has(targetEmail)) {
        return res.status(400).json({ error: "Email terminal already exists." });
      }
      mockUsers.set(targetEmail, {
        email: targetEmail,
        passwordHash,
        createdAt: new Date()
      });
    } else {
      const usersCol = db!.collection("users");
      const existingUser = await usersCol.findOne({ email: targetEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email terminal already exists." });
      }
      await usersCol.insertOne({
        email: targetEmail,
        passwordHash,
        createdAt: new Date()
      });
    }

    res.json({ success: true, user: { email: targetEmail, createdAt: new Date() } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create terminal user." });
  }
});

// 12. User CRUD: Update (Change cipher key / terminal details)
app.put("/api/admin/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and new cipher password are required." });
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
        { email: targetEmail },
        { $set: { passwordHash: newPasswordHash } }
      );
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Access cipher for terminal ${targetEmail} successfully updated.` });
    } else {
      res.status(404).json({ error: `Terminal ${targetEmail} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update terminal user." });
  }
});

// 12. User CRUD: Delete (Wipe user terminal)
app.delete("/api/admin/users", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Terminal email is required for purging." });
    }

    const targetEmail = email.toLowerCase().trim();
    let deleted = false;

    if (useMockDb) {
      deleted = mockUsers.delete(targetEmail);
    } else {
      const result = await db!.collection("users").deleteOne({ email: targetEmail });
      deleted = result.deletedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `Terminal ${targetEmail} successfully wiped from LOMON directory.` });
    } else {
      res.status(404).json({ error: `Terminal ${targetEmail} not found in directory.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to purge terminal user." });
  }
});


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  await initializeDatabase();

  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Mounting Vite in development middleware mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Mounting static asset serve for production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
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

export default app;
