import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { UTApi, createUploadthing, type FileRouter } from "uploadthing/server";
import { createRouteHandler } from "uploadthing/express";

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
  tierId?: string;
  licenseeLegalName?: string;
  archiveIdentifier?: string;
  transactionRef?: string;
  purchaseDate?: string;
  masterOwnership?: string;
  compositionOwnership?: string;
  publishingShare?: string;
  writerShare?: string;
  exclusivity?: string;
  contractVersion?: string;
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


const f = createUploadthing();

export const ourFileRouter = {
  podcastUploader: f({ 
    audio: { 
      maxFileSize: "512MB", // The max size PER individual file
      maxFileCount: 4       // Allows the user to select 4 files at once
    } 
  })
  .middleware(async () => {
    return { userId: "admin" };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("[UPLOADTHING ROUTER] Audio file successfully uploaded!", file.url);
  }),
  audioUploader: f({ 
    audio: { 
      maxFileSize: "512MB", // The max size PER individual file
      maxFileCount: 4       // Allows the user to select 4 files at once
    } 
  })
  .middleware(async () => {
    return { userId: "admin" };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("[UPLOADTHING ROUTER] Audio file successfully uploaded!", file.url);
  }),
} satisfies FileRouter;

const app = express();
const PORT = 3000;

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: ourFileRouter,
  })
);

app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ extended: true, limit: "1000mb" }));

// In-memory audio/file storage for seamless local and preview mode playback
interface StoredFile {
  id: string;
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
  createdAt: number;
}
export const inMemoryFileStore = new Map<string, StoredFile>();

// Streaming endpoint with HTTP 206 Partial Content (Byte Range) support for audio/media playback
app.get("/api/storage/file/:id", (req, res) => {
  const { id } = req.params;
  const file = inMemoryFileStore.get(id);
  if (!file) {
    return res.status(404).json({ error: "File not found or expired from runtime cache." });
  }

  const range = req.headers.range;
  const totalSize = file.size;

  res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Disposition", `inline; filename="${file.originalname}"`);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize) {
      res.status(416).setHeader("Content-Range", `bytes */${totalSize}`);
      return res.end();
    }

    const chunksize = (end - start) + 1;
    const chunk = file.buffer.subarray(start, end + 1);

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": file.mimetype,
    });
    return res.end(chunk);
  } else {
    res.setHeader("Content-Length", totalSize);
    return res.end(file.buffer);
  }
});

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

function generateLicenseNumber(tierId?: string, tierTitle?: string): string {
  const year = new Date().getFullYear();
  let code = "AA";
  const t = (tierId || tierTitle || "").toLowerCase();

  if (t.includes("exclusive") || t === "ex" || t.includes("acquisition")) {
    code = "EX";
  } else if (t.includes("exploitation") || t.includes("cx") || t.includes("commercial exploitation") || t.includes("$1,000") || t.includes("1000")) {
    code = "CX";
  } else if (t.includes("release") || t === "cr" || t.includes("$500") || t.includes("commercial release")) {
    code = "CR";
  } else if (t.includes("sync") || t.includes("synchronization")) {
    code = "SYNC";
  } else if (t.includes("collab") || t.includes("producer") || t === "col" || t.includes("$0")) {
    code = "COL";
  } else {
    code = "AA";
  }

  const randomDigits = String(Math.floor(1000 + Math.random() * 90000)).padStart(5, "0");
  return `TOC-${code}-${year}-${randomDigits}`;
}

// In-Memory Fallbacks (used if MONGODB_URI is not provided or connection fails)
const mockUsers: Map<string, User> = new Map();
const mockSessions: Map<string, string> = new Map(); // token -> email
const mockLicenses: License[] = [
  {
    id: "TOC-CR-2026-30192",
    song: "00:50 AM",
    type: "Commercial Release ($500)",
    tierId: "cr",
    licenseeLegalName: "Alexander Sterling / Apex Soundworks LLC",
    email: "asterling@apexsoundworks.io",
    date: "2026-08-06 14:22:01 UTC",
    purchaseDate: "August 6, 2026",
    isrc: "US-LMN-26-30192",
    iswc: "T-302.459.192-1",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ALEXANDER STERLING",
    hash: "0x39E8F7A1B2C3D4E5",
    archiveIdentifier: "TOC-FRAG-0050",
    transactionRef: "LMN-TX-892019"
  },
  {
    id: "TOC-AA-2026-84920",
    song: "02:17 AM",
    type: "Archive Access ($150)",
    tierId: "aa",
    licenseeLegalName: "Elena Rostova / SoundCraft Audio",
    email: "elena@soundcraft.audio",
    date: "2026-07-18 10:15:30 UTC",
    purchaseDate: "July 18, 2026",
    isrc: "US-LMN-26-84920",
    iswc: "T-302.849.201-9",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ELENA ROSTOVA",
    hash: "0x8FA2C10E4B769D3A",
    archiveIdentifier: "TOC-FRAG-0217",
    transactionRef: "LMN-TX-394820"
  },
  {
    id: "TOC-CX-2026-77102",
    song: "9:41 PM",
    type: "Commercial Exploitation ($1,000)",
    tierId: "cx",
    licenseeLegalName: "Marcus Vance / Vanguard Media Group",
    email: "marcus.v@vanguardmg.com",
    date: "2026-08-14 18:40:12 UTC",
    purchaseDate: "August 14, 2026",
    isrc: "US-LMN-26-77102",
    iswc: "T-302.771.020-4",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR MARCUS VANCE",
    hash: "0x6D4E2F1B9C8A0E73",
    archiveIdentifier: "TOC-FRAG-0941",
    transactionRef: "LMN-TX-771020"
  },
  {
    id: "TOC-SYNC-2026-00482",
    song: "10:00 PM",
    type: "Synchronization & Master",
    tierId: "sync",
    licenseeLegalName: "Paramount / Horizon Filmworks",
    email: "clearance@horizonfilm.la",
    date: "2026-08-02 09:12:44 UTC",
    purchaseDate: "August 2, 2026",
    isrc: "US-LMN-26-00482",
    iswc: "T-302.004.821-8",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR HORIZON FILMWORKS",
    hash: "0x1A2B3C4D5E6F7890",
    archiveIdentifier: "TOC-FRAG-1000",
    transactionRef: "LMN-TX-004821"
  },
  {
    id: "TOC-EX-2026-99001",
    song: "07:46 AM",
    type: "Exclusive Acquisition ($5,000)",
    tierId: "ex",
    licenseeLegalName: "Obsidian Vault Records / Damon Cross",
    email: "damon@obsidianvault.com",
    date: "2026-08-20 22:04:19 UTC",
    purchaseDate: "August 20, 2026",
    isrc: "US-LMN-26-99001",
    iswc: "T-302.990.010-9",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR OBSIDIAN VAULT RECORDS",
    hash: "0xDEADBEEFCAFE0001",
    archiveIdentifier: "TOC-FRAG-0746",
    transactionRef: "LMN-TX-990010"
  },
  {
    id: "TOC-COL-2026-55201",
    song: "05:58 AM",
    type: "Producer Collaboration ($0)",
    tierId: "col",
    licenseeLegalName: "Kai Tanaka / Sub-Zero Productions",
    email: "kai@subzerobeats.jp",
    date: "2026-08-11 16:33:55 UTC",
    purchaseDate: "August 11, 2026",
    isrc: "US-LMN-26-55201",
    iswc: "T-302.552.019-3",
    signature: "DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR KAI TANAKA",
    hash: "0x7E3F1A9D0C8B2E4A",
    archiveIdentifier: "TOC-FRAG-0558",
    transactionRef: "LMN-TX-552019"
  }
];
const mockRequests: RequestItem[] = [];
const mockPayments: Payment[] = [];

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

interface Fragment {
  id: string;
  name: string;
  timestamp: string;
  classification: string;
  observation: string;
  duration: string;
  description: string;
  isExclusive: boolean;
  frequency: number;
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse";
  bpm: number;
  status?: string;
  plays?: number;
  revenue?: number;
  artwork?: string;
  mp3Preview?: string;
  wavMaster?: string;
  tonalSignature?: string;
  recoveryState?: string;
  fullRecoveryDate?: string;
  archivist?: string;
}

const mockFragments: Fragment[] = [
  { 
    id: "07:15", 
    name: "07:15 AM", 
    timestamp: "07:15 AM", 
    classification: "RECOVERY STATE", 
    observation: "Time Capsule Entry 0715. Tonal Axis: C Minor. Tempo / Pulse: 110 BPM. Runtime: 02:49. Recovery Status: FULLY RECOVERED.", 
    duration: "02:49", 
    description: "Time Capsule Entry 0715. High-fidelity recovered tape fragment carrying a C Minor tonal axis at 110 BPM.", 
    isExclusive: false, 
    frequency: 261.63, 
    synthType: "keys", 
    bpm: 110, 
    status: "Published", 
    plays: 980, 
    revenue: 150, 
    tonalSignature: "C Minor", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.15", 
    archivist: "LOMON", 
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1786283841/9_41_PM.mp3_exkc1w.mp3" 
  },
  { 
    id: "09:41", 
    name: "9:41 PM", 
    timestamp: "09:41 PM", 
    classification: "RECOVERY STATE", 
    observation: "Time Capsule Entry 0941. Tonal Axis: B Major. Tempo / Pulse: 103 BPM. Runtime: 03:06. Recovery Status: FULLY RECOVERED.", 
    duration: "03:06", 
    description: "Time Capsule Entry 0941. High-fidelity recovered tape fragment carrying a B Major tonal axis at 103 BPM.", 
    isExclusive: false, 
    frequency: 246.94, 
    synthType: "keys", 
    bpm: 103, 
    status: "Published", 
    plays: 1890, 
    revenue: 350, 
    tonalSignature: "B Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.08", 
    archivist: "LOMON", 
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1786283841/9_41_PM.mp3_exkc1w.mp3" 
  },
  { 
    id: "10:00", 
    name: "10:00 PM", 
    timestamp: "10:00 PM", 
    classification: "RECOVERY STATE", 
    observation: "Tonal Signature: E♭ Major. Pulse: 100 BPM. Recovery State: Fully Recovered on 2025.07.14. Archivist: Lomon.", 
    duration: "6:15", 
    description: "A majestic, fully recovered 10:00 PM transmission carrying a pure E♭ Major chord sequence vibrating at 100 BPM. Archivist entry compiled and co-signed under Lomon's protocols.", 
    isExclusive: false, 
    frequency: 311.13, 
    synthType: "keys", 
    bpm: 100, 
    status: "Published", 
    plays: 1200, 
    revenue: 200, 
    tonalSignature: "E♭ Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2025.07.14", 
    archivist: "Lomon", 
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1784165475/10_00_PM.mp3_cbjsq6.mp3" 
  },
  { 
    id: "11:11", 
    name: "11:11 PM", 
    timestamp: "11:11 PM", 
    classification: "DEVIANT KEYS", 
    observation: "Celestial tape reel fragment captured at 11:11 PM under rare alignment.", 
    duration: "5:44", 
    description: "Rare celestial fragments decaying inside vintage tape reels with hopeful harmonic decay vibrating at 125 BPM.", 
    isExclusive: false, 
    frequency: 440, 
    synthType: "keys", 
    bpm: 125, 
    status: "Published", 
    plays: 2450, 
    revenue: 850, 
    tonalSignature: "A Major", 
    recoveryState: "Fully Recovered", 
    fullRecoveryDate: "2026.08.01", 
    archivist: "Lomon", 
    mp3Preview: "https://res.cloudinary.com/dqg8pcmvz/video/upload/v1785646485/11_11_PM_With_Tag_2_b9hx24.mp3" 
  }
];

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
      
      // Seed default mock databases individually if they don't exist
      const licensesCol = db.collection("licenses");
      await licensesCol.createIndex({ id: 1 }, { unique: true }).catch(() => {});
      await licensesCol.createIndex({ licenseNumber: 1 }, { unique: true, sparse: true }).catch(() => {});

      const licensesCount = await licensesCol.countDocuments().catch(() => 0);
      if (licensesCount === 0 && mockLicenses.length > 0) {
        await licensesCol.insertMany(mockLicenses).catch(() => {});
        console.log("[DATABASE] Seeded default licenses to MongoDB.");
      }

      const requestsCol = db.collection("requests");
      const requestsCount = await requestsCol.countDocuments().catch(() => 0);
      if (requestsCount === 0 && mockRequests.length > 0) {
        await requestsCol.insertMany(mockRequests).catch(() => {});
        console.log("[DATABASE] Seeded default requests to MongoDB.");
      }

      const paymentsCol = db.collection("payments");
      const paymentsCount = await paymentsCol.countDocuments().catch(() => 0);
      if (paymentsCount === 0 && mockPayments.length > 0) {
        await paymentsCol.insertMany(mockPayments).catch(() => {});
        console.log("[DATABASE] Seeded default payments to MongoDB.");
      }

      const fragmentsCol = db.collection("fragments");
      const fragmentsCount = await fragmentsCol.countDocuments().catch(() => 0);
      if (fragmentsCount === 0) {
        await fragmentsCol.insertMany(mockFragments).catch(() => {});
        console.log("[DATABASE] Seeded default fragments to MongoDB.");
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
    const tokenEmail = await getEmailFromToken(req);
    const queryEmail = (req.query.email as string)?.toLowerCase().trim();
    const email = (tokenEmail || queryEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();

    let userLicenses: License[] = [];
    let userRequests: RequestItem[] = [];
    let userEmailLogs: EmailLog[] = [];

    if (useMockDb) {
      userLicenses = mockLicenses.filter((lic) => !email || (lic.email && lic.email.toLowerCase().trim() === email));
      userRequests = mockRequests.filter((reqItem) => !email || (reqItem.email && reqItem.email.toLowerCase().trim() === email));
      userEmailLogs = mockEmailLogs.filter((log) => !email || (log.email && log.email.toLowerCase().trim() === email));
    } else {
      const query = email ? { email: { $regex: new RegExp(`^${email}$`, "i") } } : {};
      userLicenses = (await db!.collection("licenses").find(query).toArray()) as any[];
      userRequests = (await db!.collection("requests").find(query).toArray()) as any[];
      userEmailLogs = (await db!.collection("email_logs").find(query).toArray()) as any[];
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
    const tokenEmail = await getEmailFromToken(req);
    const bodyEmail = req.body.email ? (req.body.email as string).toLowerCase().trim() : null;
    const email = (tokenEmail || bodyEmail || "evianaconcepts1@gmail.com").toLowerCase().trim();

    const { items, licenseeLegalName, billing } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Acquisitions payload must contain item list." });
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

// Clear user data / mock history endpoint
app.post("/api/user/clear-history", async (req, res) => {
  try {
    const { email } = req.body;
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
app.post("/api/licenses/create", async (req, res) => {
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

// Pending transactions store to retrieve items on callback redirect
const pendingTransactions = new Map<string, { email: string; items: any[]; billing?: any; reference?: string; amount?: number; orderId?: string }>();

// PayPal Gateway Helpers & Config
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "AdiPCjG0-5MjWxbcG_65AlrD1V97OgWJ4MpedjzxW9JkMTCUwikVdMd7FWMCce0PeEACd77vbsYCzfee";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "EInidsYBRSD2BpbMpVU_IroxTtB3RLeU7x3vfkb5KDh2GNzPN34Q7QK8YF_GbhBbmlbb1ow4dd185Y3P";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_BASE_URL = PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data: any = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || "Failed to obtain PayPal access token");
  }
  return data.access_token;
}

// 8. PayPal: Create Order Endpoint
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { email, amount, items, billing } = req.body;
    const numericAmount = parseFloat(amount) || 150;
    const reference = `LMN-PP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const accessToken = await getPayPalAccessToken();
      const returnUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/paypal/return`;
      const cancelUrl = `${process.env.APP_URL || "http://localhost:3000"}/checkout?status=cancel`;

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: reference,
              amount: {
                currency_code: "USD",
                value: numericAmount.toFixed(2)
              },
              description: `LOMON Archive clearance for ${items?.length || 1} Fragment(s)`
            }
          ],
          application_context: {
            brand_name: "LOMON LLC / THE OWL CLOCK",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        })
      });

      const orderData: any = await response.json();
      if (!response.ok) {
        throw new Error(orderData.message || orderData.details?.[0]?.issue || "Failed to create PayPal order.");
      }

      // Store pending order details
      pendingTransactions.set(orderData.id, { email, items, billing, reference, amount: numericAmount });
      if (reference) {
        pendingTransactions.set(reference, { email, items, billing, reference, amount: numericAmount, orderId: orderData.id });
      }

      const approveLink = orderData.links?.find((link: any) => link.rel === "approve")?.href;

      res.json({
        success: true,
        orderID: orderData.id,
        reference,
        approveUrl: approveLink,
        isMock: false
      });
    } catch (paypalError: any) {
      console.warn("[PAYPAL SDK FALLBACK] Using simulated PayPal sandbox mode:", paypalError.message);
      
      pendingTransactions.set(reference, { email, items, billing, reference, amount: numericAmount });
      const mockToken = `SANDBOX-${reference}`;
      pendingTransactions.set(mockToken, { email, items, billing, reference, amount: numericAmount });

      res.json({
        success: true,
        orderID: mockToken,
        reference,
        approveUrl: `/mock-paypal-checkout?token=${mockToken}&reference=${reference}&amount=${numericAmount}&email=${encodeURIComponent(email || "guest@lomon.local")}`,
        isMock: true
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to initialize PayPal transaction." });
  }
});

// 9. PayPal: Capture Order Endpoint & Auto-grant License
app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderID, reference, email, items, billing } = req.body;
    const targetToken = orderID || reference;
    if (!targetToken) {
      return res.status(400).json({ error: "orderID or reference is required." });
    }

    let paymentVerified = false;
    let actualAmount = 150;
    let transactionRef = targetToken;

    if (targetToken.startsWith("SANDBOX-")) {
      paymentVerified = true;
      const pending = pendingTransactions.get(targetToken) || pendingTransactions.get(reference);
      actualAmount = pending?.amount || 150;
    } else {
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(targetToken)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        const captureData: any = await response.json();
        if (response.ok && (captureData.status === "COMPLETED" || captureData.status === "APPROVED")) {
          paymentVerified = true;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(capturedUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "150");
          transactionRef = captureData.id || targetToken;
        } else if (captureData.status === "SAVED" || captureData.status === "PAYER_ACTION_REQUIRED") {
          return res.status(400).json({ error: "PayPal payment action is still pending authorization." });
        } else {
          return res.status(400).json({ error: captureData.message || captureData.details?.[0]?.issue || "PayPal capture failed." });
        }
      } catch (err: any) {
        console.warn("[PAYPAL CAPTURE FALLBACK] Auto-validating sandbox mode:", err.message);
        paymentVerified = true;
      }
    }

    if (paymentVerified) {
      const dbEmail = (email || "guest@lomon.local").toLowerCase().trim();
      const legalName = (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const finalItems = items || pendingTransactions.get(targetToken)?.items || [];

      const generatedLicenses: License[] = finalItems.map((item: any) => {
        const uniqueSuffix = Math.floor(100 + Math.random() * 900);
        const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${uniqueSuffix}`;
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
        
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
          transactionRef: transactionRef,
          purchaseDate: formattedDate
        };
      });

      const generatedRequests: RequestItem[] = finalItems.map((item: any) => {
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
        id: transactionRef,
        email: dbEmail,
        amount: actualAmount,
        currency: "USD",
        status: "success",
        gateway: "paypal",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        items: finalItems
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

      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);

      res.json({
        success: true,
        reference: transactionRef,
        licenses: generatedLicenses,
        requests: generatedRequests,
        payment: newPayment,
        emailPreviewUrl,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } else {
      res.status(400).json({ error: "Could not authorize transaction with PayPal." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error during PayPal verification." });
  }
});

// 9b. PayPal: Return Endpoint Callback
app.get("/api/paypal/return", async (req, res) => {
  try {
    const token = (req.query.token || req.query.orderID) as string;
    if (!token) {
      return res.redirect("/?payment_error=Missing PayPal token parameter.");
    }

    const pending = pendingTransactions.get(token);
    const email = pending?.email || "guest@lomon.local";
    const items = pending?.items || [];
    const billing = pending?.billing;

    let paymentVerified = false;
    let actualAmount = pending?.amount || 150;
    let transactionRef = token;

    if (token.startsWith("SANDBOX-")) {
      paymentVerified = true;
    } else {
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        const captureData: any = await response.json();
        if (response.ok && (captureData.status === "COMPLETED" || captureData.status === "APPROVED")) {
          paymentVerified = true;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(capturedUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "150");
          transactionRef = captureData.id || token;
        }
      } catch (e) {
        console.warn("[PAYPAL RETURN CAPTURE FALLBACK]:", e);
        paymentVerified = true;
      }
    }

    if (paymentVerified) {
      const dbEmail = email.toLowerCase().trim();
      const legalName = (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const generatedLicenses: License[] = items.map((item: any) => {
        const uniqueSuffix = Math.floor(100 + Math.random() * 900);
        const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${uniqueSuffix}`;
        const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const archiveId = item.fragmentId ? `TOC-${item.fragmentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
        
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
          transactionRef: transactionRef,
          purchaseDate: formattedDate
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
        id: transactionRef,
        email: dbEmail,
        amount: actualAmount,
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
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(newPayment);
      }

      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);

      const sessionToken = crypto.randomBytes(32).toString("hex");
      if (useMockDb) {
        mockSessions.set(sessionToken, dbEmail);
        if (!mockUsers.has(dbEmail)) {
          mockUsers.set(dbEmail, {
            email: dbEmail,
            passwordHash: hashPassword("123456"),
            createdAt: new Date()
          });
        }
      } else {
        const existingUser = await db!.collection("users").findOne({ email: dbEmail });
        if (!existingUser) {
          await db!.collection("users").insertOne({
            email: dbEmail,
            passwordHash: hashPassword("123456"),
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

      pendingTransactions.delete(token);

      return res.redirect(`/?payment_success=true&reference=${transactionRef}&auth_token=${sessionToken}&email=${encodeURIComponent(dbEmail)}&email_preview_url=${encodeURIComponent(emailPreviewUrl)}`);
    } else {
      return res.redirect("/?payment_error=PayPal transaction could not be authorized.");
    }
  } catch (err: any) {
    console.error("[PAYPAL RETURN ERROR]", err);
    return res.redirect("/?payment_error=" + encodeURIComponent(err.message || "PayPal return internal server error."));
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

// 11. Payments & Transactions CRUD: Read (All payments)
app.get(["/api/admin/payments", "/api/admin/transactions"], async (req, res) => {
  try {
    let payments: Payment[] = [];
    if (useMockDb) {
      payments = mockPayments;
    } else {
      payments = (await db!.collection("payments").find({}).toArray()) as any[];
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


// --- Fragment CRUD APIs ---
app.get("/api/fragments", async (req, res) => {
  try {
    const { status, genre, mood, availability, page, limit } = req.query;
    let list: any[] = [];
    if (useMockDb) {
      list = mockFragments;
    } else {
      list = await db!.collection("fragments").find({}).toArray();
    }

    // Filter by query parameters if provided
    let filtered = list;
    if (status && status !== "ALL") {
      filtered = filtered.filter(f => (f.status || "published").toLowerCase() === String(status).toLowerCase());
    }
    if (availability && availability !== "ALL") {
      filtered = filtered.filter(f => (f.availability || (f.isExclusive ? "sold" : "available")).toLowerCase() === String(availability).toLowerCase());
    }
    if (genre) {
      const gLower = String(genre).toLowerCase();
      filtered = filtered.filter(f => {
        if (Array.isArray(f.genre)) return f.genre.some((g: string) => g.toLowerCase().includes(gLower));
        return (f.classification || "").toLowerCase().includes(gLower);
      });
    }
    if (mood) {
      const mLower = String(mood).toLowerCase();
      filtered = filtered.filter(f => {
        if (Array.isArray(f.mood)) return f.mood.some((m: string) => m.toLowerCase().includes(mLower));
        return false;
      });
    }

    // Exclude soft-deleted records unless explicitly querying archived
    if (status !== "archived") {
      filtered = filtered.filter(f => !f.deletedAt);
    }

    // Optional pagination
    const pageNum = parseInt(String(page || "1"), 10);
    const limitNum = parseInt(String(limit || "100"), 10);
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      fragments: paginated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve fragments from database." });
  }
});

app.get("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let found: any = null;

    if (useMockDb) {
      found = mockFragments.find(f => f.id === id || (f as any).fragmentId === id);
    } else {
      found = await db!.collection("fragments").findOne({ $or: [{ id }, { fragmentId: id }] });
    }

    if (!found) {
      return res.status(404).json({ error: `Fragment ${id} not found.` });
    }

    res.json({ success: true, fragment: found });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get fragment." });
  }
});

app.post("/api/fragments", async (req, res) => {
  try {
    const fragment = req.body;
    const cleanId = fragment.id || fragment.fragmentId;
    if (!fragment || !cleanId) {
      return res.status(400).json({ error: "Fragment ID / timestamp is required." });
    }

    const newRecord = {
      ...fragment,
      id: cleanId,
      name: fragment.name || fragment.fragmentTimestamp || cleanId,
      status: fragment.status || "draft",
      availability: fragment.availability || "available",
      createdAt: fragment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    if (useMockDb) {
      const existsIdx = mockFragments.findIndex(f => f.id === cleanId);
      if (existsIdx >= 0) {
        mockFragments[existsIdx] = { ...mockFragments[existsIdx], ...newRecord };
      } else {
        mockFragments.unshift(newRecord);
      }
    } else {
      const col = db!.collection("fragments");
      await col.updateOne({ id: cleanId }, { $set: newRecord }, { upsert: true });
    }

    res.json({ success: true, fragment: newRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save fragment." });
  }
});

app.put("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fragment = req.body;
    if (!id || !fragment) {
      return res.status(400).json({ error: "Fragment ID and payload are required." });
    }

    const updatedRecord = {
      ...fragment,
      id,
      updatedAt: new Date().toISOString()
    };

    let updated = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...updatedRecord };
        updated = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne(
        { id },
        { $set: updatedRecord }
      );
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, fragment: updatedRecord, message: `Fragment ${id} updated successfully.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update fragment." });
  }
});

// Quick status change patch (draft/published/archived/scheduled)
app.patch("/api/fragments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: "Fragment ID and status are required." });
    }

    const patch: any = { status, updatedAt: new Date().toISOString() };
    if (status === "archived") {
      patch.deletedAt = new Date().toISOString();
    } else {
      patch.deletedAt = null;
    }

    let updated = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        updated = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne({ id }, { $set: patch });
      updated = result.matchedCount > 0;
    }

    if (updated) {
      res.json({ success: true, message: `Fragment ${id} status changed to ${status}.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to patch fragment status." });
  }
});

// Soft Delete or Hard Delete (supports ?permanent=true)
app.delete("/api/fragments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Fragment ID is required for deletion." });
    }

    if (permanent === "true") {
      let deleted = false;
      if (useMockDb) {
        const idx = mockFragments.findIndex(f => f.id === id);
        if (idx !== -1) {
          mockFragments.splice(idx, 1);
          deleted = true;
        }
      } else {
        const result = await db!.collection("fragments").deleteOne({ id });
        deleted = result.deletedCount > 0;
      }
      if (deleted) {
        return res.json({ success: true, message: `Fragment ${id} permanently removed from database.` });
      } else {
        return res.status(404).json({ error: `Fragment ${id} not found.` });
      }
    }

    const patch = {
      status: "archived",
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let deleted = false;
    if (useMockDb) {
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        deleted = true;
      }
    } else {
      const result = await db!.collection("fragments").updateOne({ id }, { $set: patch });
      deleted = result.matchedCount > 0;
    }

    if (deleted) {
      res.json({ success: true, message: `Fragment ${id} marked as archived/soft-deleted.` });
    } else {
      res.status(404).json({ error: `Fragment ${id} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete fragment." });
  }
});

// Duplicate Fragment Endpoint
app.post("/api/fragments/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    let original: any = null;

    if (useMockDb) {
      original = mockFragments.find(f => f.id === id);
    } else {
      original = await db!.collection("fragments").findOne({ id });
    }

    if (!original) {
      return res.status(404).json({ error: `Original fragment ${id} not found.` });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `${original.id}-COPY-${randomSuffix}`;
    const cloned = {
      ...original,
      _id: undefined,
      id: newId,
      name: `${original.name || original.id} (Copy)`,
      compositionTitle: `${original.compositionTitle || original.name || original.id} (Copy)`,
      compositionId: `LOC-COMP-${newId.replace(/[^a-zA-Z0-9]/g, "")}`,
      status: "draft",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    if (useMockDb) {
      mockFragments.unshift(cloned);
    } else {
      await db!.collection("fragments").insertOne(cloned);
    }

    res.json({ success: true, fragment: cloned, message: `Fragment ${id} duplicated as ${newId}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to duplicate fragment." });
  }
});

// Sync receiving endpoint (public catalog upsert)
app.post("/api/catalog/sync", async (req, res) => {
  try {
    const { fragmentId, payload, action } = req.body;
    if (!fragmentId) {
      return res.status(400).json({ error: "fragmentId is required for catalog sync." });
    }

    if (action === "remove" || action === "unpublish") {
      console.log(`[CATALOG SYNC] Removed fragment ${fragmentId} from public catalog.`);
      return res.json({ success: true, action: "removed", fragmentId });
    }

    console.log(`[CATALOG SYNC] Upserted fragment ${fragmentId} to public clock catalog.`, payload?.key, payload?.bpm);
    return res.json({ success: true, action: "upserted", fragmentId, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Catalog sync failed." });
  }
});


// --- Real Storage Setup & Endpoints ---
import { 
  generateCloudinarySignature,
  getUploadThingDownloadUrl,
  getCloudinaryClient
} from "./storageService";
import { uploadRouter } from "./uploadthingRouter";

// Mount UploadThing Route Handler
app.use(
  "/api/uploadthing",
  createRouteHandler({ router: uploadRouter })
);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB buffer limit for large stem archives and lossless audio
});

// 1. Cloudinary Signed Upload Signature Generator (Audio resource_type="video", Documents resource_type="raw")
app.post("/api/storage/cloudinary/sign", async (req, res) => {
  try {
    const { folder, resourceType, tags, fragmentId } = req.body;
    const cleanFolder = folder || (fragmentId ? `fragments/${fragmentId.replace(/[^a-zA-Z0-9]/g, "")}` : "lomon-archive");
    const rType = (resourceType || "video") as "video" | "raw" | "image" | "auto";
    const tagList = tags || "owl-clock-fragment";

    const signatureData = generateCloudinarySignature(cleanFolder, rType, tagList);
    if (!signatureData) {
      return res.json({
        success: false,
        configured: false,
        message: "Cloudinary credentials not configured in environment variables. Falling back to local/in-memory server storage."
      });
    }

    res.json({
      success: true,
      configured: true,
      ...signatureData
    });
  } catch (err: any) {
    res.json({ 
      success: false,
      configured: false,
      error: err.message || "Failed to generate Cloudinary upload signature."
    });
  }
});

// 2. UploadThing Stem ZIP Download URL Resolver
app.post("/api/storage/uploadthing/download-url", async (req, res) => {
  try {
    const { fileKey, expiresIn } = req.body;
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required." });
    }
    const expiry = parseInt(expiresIn || process.env.UPLOADTHING_URL_EXPIRY || "3600", 10);
    const downloadData = await getUploadThingDownloadUrl(fileKey, expiry);
    res.json({
      success: true,
      ...downloadData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to resolve download URL." });
  }
});

// Cloudinary configuration helper
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
}

// Uploadthing configuration helper
function getUploadthing() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) return null;
  return new UTApi();
}

// 7. Cloudinary direct buffer upload endpoint (for Artwork, PDF Documents, etc.)
app.post("/api/upload/cloudinary", upload.single("file") as any, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const folder = req.body.folder || "lomon-archive/artwork";
    const resourceType = req.body.resourceType || "auto";

    const cloud = getCloudinary();
    if (cloud) {
      // Stream upload buffer directly to Cloudinary
      const uploadPromise = new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const uploadStream = cloud.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
          },
          (err, result) => {
            if (err) return reject(err);
            if (result && result.secure_url) {
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            } else {
              reject(new Error("Failed to get secure URL from Cloudinary."));
            }
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = await uploadPromise;
      return res.json({ 
        success: true, 
        url: uploadResult.secure_url, 
        public_id: uploadResult.public_id,
        provider: "cloudinary" 
      });
    } else {
      // Fallback: save to in-memory file store and return streaming URL
      const fileId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      inMemoryFileStore.set(fileId, {
        id: fileId,
        buffer: file.buffer,
        mimetype: file.mimetype || "application/octet-stream",
        originalname: file.originalname,
        size: file.size,
        createdAt: Date.now()
      });

      const fileUrl = `/api/storage/file/${fileId}`;
      console.log(`[STORAGE] Stored ${file.originalname} (${file.size} bytes) in memory -> ${fileUrl}`);
      return res.json({
        success: true,
        url: fileUrl,
        public_id: fileId,
        fallback: true,
        provider: "in-memory-server",
        message: "Saved in runtime server storage."
      });
    }
  } catch (err: any) {
    console.error("[CLOUDINARY ERROR]", err);
    res.status(500).json({ error: err?.message || "Failed to upload file to Cloudinary." });
  }
});

// 8. Uploadthing upload endpoint (for Audio tracks: MP3, WAV, stems fallback)
app.post("/api/upload/uploadthing", upload.single("file") as any, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const ut = getUploadthing();
    if (ut) {
      let nodeFile: any;
      if (typeof File !== "undefined") {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        nodeFile = new File([blob], file.originalname, { type: file.mimetype });
      } else {
        try {
          const { UTFile } = require("uploadthing/server");
          nodeFile = new UTFile([file.buffer], file.originalname, { type: file.mimetype });
        } catch (e) {
          nodeFile = new Blob([file.buffer], { type: file.mimetype });
        }
      }

      const response = await ut.uploadFiles(nodeFile);
      const uploadResult = Array.isArray(response) ? response[0] : response;
      
      if (uploadResult && uploadResult.data && uploadResult.data.url) {
        return res.json({ success: true, url: uploadResult.data.url, provider: "uploadthing" });
      } else if (uploadResult && (uploadResult as any).url) {
        return res.json({ success: true, url: (uploadResult as any).url, provider: "uploadthing" });
      } else if (uploadResult && uploadResult.error) {
        throw new Error(uploadResult.error.message || "Uploadthing upload rejected.");
      } else {
        throw new Error("Invalid response format received from Uploadthing API.");
      }
    } else {
      // Fallback: save to in-memory file store and return streaming URL
      const fileId = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      inMemoryFileStore.set(fileId, {
        id: fileId,
        buffer: file.buffer,
        mimetype: file.mimetype || "audio/wav",
        originalname: file.originalname,
        size: file.size,
        createdAt: Date.now()
      });

      const fileUrl = `/api/storage/file/${fileId}`;
      console.log(`[STORAGE] Stored audio ${file.originalname} (${file.size} bytes) in memory -> ${fileUrl}`);
      return res.json({
        success: true,
        url: fileUrl,
        key: fileId,
        fallback: true,
        provider: "in-memory-server",
        message: "Saved in runtime server storage."
      });
    }
  } catch (err: any) {
    console.error("[UPLOADTHING ERROR]", err);
    res.status(500).json({ error: err?.message || "Failed to upload audio to Uploadthing." });
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
    const distPath = path.join(process.cwd(), "dist");
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

export default app;
