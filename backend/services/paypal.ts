// PayPal configuration, hosted payment plans, access-token helper and server-side cart price verification.


// PayPal Gateway Configuration
export const PAYPAL_MODE = (process.env.PAYPAL_MODE || "sandbox").toLowerCase().trim();

export const isLivePayPal = PAYPAL_MODE === "live" || PAYPAL_MODE === "production";

export const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || "").trim();

export const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn("[CONFIG WARNING] PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set. PayPal checkout will not work until they are configured.");
}

export const PAYPAL_BASE_URL = isLivePayPal ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export const PAYPAL_HOSTED_PAYMENT_URL = (process.env.PAYPAL_HOSTED_PAYMENT_URL || "https://www.paypal.com/ncp/payment/CFHDJFEV6Y7WJ").trim();

// Official LOMON Archive Clearance PayPal Hosted Payment Plans
export interface PayPalHostedPlan {
  code: string;
  tierId: string;
  title: string;
  price: number;
  priceDisplay: string;
  hostedId: string;
  url: string;
}

export const PAYPAL_HOSTED_PLANS: Record<string, PayPalHostedPlan> = {
  "TOC-AAL": {
    code: "TOC-AAL",
    tierId: "access",
    title: "Archive Access License",
    price: 150,
    priceDisplay: "$150",
    hostedId: "CFHDJFEV6Y7WJ",
    url: "https://www.paypal.com/ncp/payment/CFHDJFEV6Y7WJ"
  },
  "TOC-CRL": {
    code: "TOC-CRL",
    tierId: "release",
    title: "Commercial Release License",
    price: 500,
    priceDisplay: "$500",
    hostedId: "D7BRUR9T5CPNA",
    url: "https://www.paypal.com/ncp/payment/D7BRUR9T5CPNA"
  },
  "TOC-CEL": {
    code: "TOC-CEL",
    tierId: "commercial",
    title: "Commercial Exploitation License",
    price: 1000,
    priceDisplay: "$1,000",
    hostedId: "KKUAY9LJHBKCE",
    url: "https://www.paypal.com/ncp/payment/KKUAY9LJHBKCE"
  },
  "TOC-SML": {
    code: "TOC-SML",
    tierId: "sync",
    title: "Synchronization and Master License",
    price: 0,
    priceDisplay: "CUSTOM PROPOSAL",
    hostedId: "MLHYEFHQY8494",
    url: "https://www.paypal.com/ncp/payment/MLHYEFHQY8494"
  },
  "TOC-EAA": {
    code: "TOC-EAA",
    tierId: "exclusive",
    title: "Exclusive Archive Acquisition",
    price: 5000,
    priceDisplay: "$5,000",
    hostedId: "KCXV2FHADXRDL",
    url: "https://www.paypal.com/ncp/payment/KCXV2FHADXRDL"
  },
  "TOC-PCOL": {
    code: "TOC-PCOL",
    tierId: "collaboration",
    title: "Producer Collaboration",
    price: 0,
    priceDisplay: "COLLABORATION",
    hostedId: "UZY4LJVGTHQC4",
    url: "https://www.paypal.com/ncp/payment/UZY4LJVGTHQC4"
  }
};

export function resolvePayPalHostedPlan(params: { paymentId?: string; tierId?: string; licenseCode?: string; amount?: number; items?: any[] }): PayPalHostedPlan {
  const { paymentId, tierId, licenseCode, amount, items } = params;
  
  if (paymentId) {
    const cleanPaymentId = paymentId.trim();
    for (const plan of Object.values(PAYPAL_HOSTED_PLANS)) {
      if (plan.hostedId === cleanPaymentId) return plan;
    }
  }

  if (licenseCode) {
    const upperCode = licenseCode.trim().toUpperCase();
    if (PAYPAL_HOSTED_PLANS[upperCode]) return PAYPAL_HOSTED_PLANS[upperCode];
  }

  const candidateTier = (tierId || items?.[0]?.tierId || "").toLowerCase();
  if (candidateTier.includes("exclus") || candidateTier === "exclusive" || candidateTier === "eaa") return PAYPAL_HOSTED_PLANS["TOC-EAA"];
  if (candidateTier.includes("exploit") || candidateTier.includes("commercial") || candidateTier === "cel") return PAYPAL_HOSTED_PLANS["TOC-CEL"];
  if (candidateTier.includes("release") || candidateTier === "crl") return PAYPAL_HOSTED_PLANS["TOC-CRL"];
  if (candidateTier.includes("sync") || candidateTier === "sml") return PAYPAL_HOSTED_PLANS["TOC-SML"];
  if (candidateTier.includes("collab") || candidateTier === "pcol") return PAYPAL_HOSTED_PLANS["TOC-PCOL"];
  if (candidateTier.includes("access") || candidateTier === "aal") return PAYPAL_HOSTED_PLANS["TOC-AAL"];

  const numAmount = Math.round(Number(amount) || 0);
  if (numAmount >= 4500) return PAYPAL_HOSTED_PLANS["TOC-EAA"];
  if (numAmount >= 900 && numAmount <= 1500) return PAYPAL_HOSTED_PLANS["TOC-CEL"];
  if (numAmount >= 400 && numAmount <= 600) return PAYPAL_HOSTED_PLANS["TOC-CRL"];
  if (numAmount > 0 && numAmount <= 200) return PAYPAL_HOSTED_PLANS["TOC-AAL"];

  return PAYPAL_HOSTED_PLANS["TOC-AAL"];
}

console.log(`[API SERVER] PayPal Gateway Mode: ${isLivePayPal ? "LIVE (PRODUCTION)" : "SANDBOX (TESTING)"} -> ${PAYPAL_BASE_URL}`);

// Pending transactions store to retrieve items on callback redirect
export const pendingTransactions = new Map<string, { email: string; items: any[]; billing?: any; reference?: string; amount?: number; orderId?: string; planCode?: string; hostedId?: string }>();

export async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const rawText = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(rawText);
  } catch (_e) {
    throw new Error(`PayPal OAuth gateway error (${response.status}): ${rawText.substring(0, 120)}`);
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || `PayPal OAuth failed with status ${response.status}`);
  }
  return data.access_token;
}

// Cart Pricing Verification Helpers (Strict Server-Side Validation)
function getVerifiedItemPrice(item: any): number {
  const tierId = (item.tierId || "").toLowerCase();
  const rawPrice = typeof item.price === "number" ? item.price : parseFloat(String(item.price || "").replace(/[^0-9.]/g, ""));
  if (tierId.includes("exclusive") || tierId === "exclusive" || tierId === "eaa" || rawPrice >= 4500) return 5000;
  if (tierId.includes("commercial") || tierId === "commercial" || tierId === "cel" || tierId === "sync" || (rawPrice >= 900 && rawPrice <= 1500)) return 1000;
  if (tierId.includes("release") || tierId === "release" || tierId === "crl" || (rawPrice >= 400 && rawPrice <= 600)) return 500;
  if (tierId.includes("access") || tierId === "access" || tierId === "aal" || rawPrice <= 200) return 150;
  return rawPrice > 0 ? rawPrice : 150;
}

export function verifyCartPricing(items: any[], couponCode?: string): { verifiedItems: any[]; verifiedTotal: number } {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart items array cannot be empty.");
  }
  let subtotal = 0;
  const verifiedItems = items.map(item => {
    const verifiedPrice = getVerifiedItemPrice(item);
    subtotal += verifiedPrice;
    return {
      ...item,
      verifiedPrice,
      price: `$${verifiedPrice.toLocaleString()}`
    };
  });

  let discount = 0;
  const code = (couponCode || "").toUpperCase().trim();
  if (code === "OWL20") {
    discount = subtotal * 0.20;
  } else if (code === "SIGNAL15") {
    discount = subtotal * 0.15;
  }
  const verifiedTotal = Math.max(0, subtotal - discount);
  return { verifiedItems, verifiedTotal };
}
