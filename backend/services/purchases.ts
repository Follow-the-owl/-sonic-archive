// License numbering and purchase side-effects (building license records, marking exclusive beats sold).
import crypto from "crypto";
import { CANONICAL_TONAL_KEYS, db, mockFragments, normalizeFragmentId, useMockDb } from "../db.js";
import { License } from "../types.js";

export function generateLicenseNumber(tierId?: string, tierTitle?: string): string {
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

export function createLicenseDataHelper(item: any, dbEmail: string, legalName: string, billing: any, transactionRef: string, formattedDate: string): License {
  const uniqueSuffix = Math.floor(100 + Math.random() * 900);
  const uniqueId = `TOC-LIC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uniqueSuffix}`;
  const contractHash = `0x${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  const rawId = item.id || item.fragmentId || "";
  const archiveId = rawId ? `TOC-${rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001` : "TOC-FRAG-001";
  const tierId = (item.tierId || "access").toLowerCase();
  
  const fragMatch = mockFragments.find(f => f.id === rawId || f.name === item.name || f.timestamp === item.name);

  let tierTitle = "Archive Access License [TOC-AAL] ($150 USD)";
  let feeFormatted = item.price || "$150 USD";
  let feeAmount = 150;
  let permittedUsage = "Single Commercial Audio Release (Digital & Physical)";
  let streamingLimit = "100,000 Cumulative Audio Streams / 2,000 Sales";
  let composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";

  if (tierId.includes("exclusive") || tierId === "exclusive" || tierId === "ex" || tierId === "eaa" || item.price === "$5,000" || item.price === "$5000") {
    tierTitle = "Exclusive Archive Acquisition [TOC-EAA] ($5,000 USD)";
    feeFormatted = "$5,000.00 USD";
    feeAmount = 5000;
    permittedUsage = "Sole Exclusive Master Acquisition, Permanent Archive De-listing & Unlimited Exploitation";
    streamingLimit = "Unlimited Streams, Broadcasts, and Physical/Digital Copies";
    composerSplits = "100% Exclusive Master Rights Transferred / 50% Underlying Composition Share";
  } else if (tierId.includes("commercial") || tierId.includes("exploit") || tierId === "cx" || tierId === "cel" || item.price === "$1,000" || item.price === "$1000") {
    tierTitle = "Commercial Exploitation License [TOC-CEL] ($1,000 USD)";
    feeFormatted = "$1,000.00 USD";
    feeAmount = 1000;
    permittedUsage = "Full Commercial Synchronization, Global Broadcast, Paid Advertising & Film/TV";
    streamingLimit = "1,000,000 Cumulative Audio Streams / Unlimited Broadcast Impressions";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  } else if (tierId.includes("release") || tierId === "cr" || tierId === "crl" || item.price === "$500") {
    tierTitle = "Commercial Release License [TOC-CRL] ($500 USD)";
    feeFormatted = "$500.00 USD";
    feeAmount = 500;
    permittedUsage = "Commercial Record Release, DSPs, Official Music Video & Radio";
    streamingLimit = "500,000 Cumulative Audio Streams / 10,000 Sales";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  } else if (tierId.includes("sync") || tierId === "sml") {
    tierTitle = "Synchronization and Master License [TOC-SML]";
    feeFormatted = "CUSTOM PROPOSAL";
    feeAmount = 0;
    permittedUsage = "Film, Television, Advertising, Brand Campaigns, Games, and Broadcast Media";
    streamingLimit = "Per Approved Media Schedule";
    composerSplits = "Negotiated Per Project";
  } else if (tierId.includes("collab") || tierId === "pcol") {
    tierTitle = "Producer Collaboration [TOC-PCOL]";
    feeFormatted = "COLLABORATION";
    feeAmount = 0;
    permittedUsage = "Collaborative Production & Commercial Release per Individual Agreement";
    streamingLimit = "Per Agreement";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  } else {
    tierTitle = "Archive Access License [TOC-AAL] ($150 USD)";
    feeFormatted = "$150.00 USD";
    feeAmount = 150;
    permittedUsage = "Single Commercial Audio Release (Digital & Physical)";
    streamingLimit = "100,000 Cumulative Audio Streams / 2,000 Sales";
    composerSplits = "50% Christopher Solomon Paul (BMI 01305977829) / 50% Licensee";
  }

  const addressParts = billing ? [
    billing.streetAddress,
    billing.aptNumber,
    billing.city,
    billing.stateProvince,
    billing.zipCode,
    billing.country
  ].filter(Boolean) : [];

  const licenseeAddress = addressParts.length > 0 
    ? addressParts.join(", ")
    : "12 Broad Street, Suite 4B, Lagos 100001, Nigeria (NG)";

  return {
    id: uniqueId,
    song: item.name || "Recovered Fragment",
    type: tierTitle,
    date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    purchaseDate: formattedDate,
    effectiveDate: formattedDate,
    isrc: `US-LMN-26-${Math.floor(10000 + Math.random() * 90000)}`,
    iswc: `T-302.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-1`,
    email: dbEmail,
    licenseeLegalName: legalName,
    licenseeEmail: dbEmail,
    licenseeAddress: licenseeAddress,
    licensor: "LOMON LLC / The Owl Clock",
    licensorEmail: "licensing@theowlclock.io",
    licensorOrganization: "LOMON LLC (d/b/a The Owl Clock)",
    legalContactName: "Christopher Solomon Paul",
    producerCredit: "Produced by Lomon Christopher / The Owl Clock",
    pro: "BMI",
    writerIpi: "01305977829",
    archiveIdentifier: archiveId,
    hash: contractHash,
    audioHash: contractHash,
    keySignature: fragMatch?.tonalSignature || (fragMatch?.id ? CANONICAL_TONAL_KEYS[normalizeFragmentId(fragMatch.id)] : "Eb Major"),
    tempoBpm: fragMatch?.bpm || 110,
    duration: fragMatch?.duration || "02:49",
    tierId: tierId,
    amount: feeAmount,
    price: feeFormatted,
    paymentStatus: "Completed via PayPal",
    permittedUsage: permittedUsage,
    streamingLimit: streamingLimit,
    distributionTerritory: "Worldwide",
    termDuration: "Perpetual",
    composerSplits: composerSplits,
    signature: `DIGITALLY REGISTERED COVENANT VIA LOMON SECURE CRYPTOGRAPHIC PROTOCOL FOR ${dbEmail.toUpperCase()}`,
    transactionRef: transactionRef,
    artwork: item.artwork
  };
}

// Helper: Check license type and immediately update beat's status in database (isSold: true) upon payment settlement
export async function markBeatExclusivelySold(items: any[], buyerEmail: string) {
  if (!items || !Array.isArray(items)) return;
  for (const item of items) {
    const rawId = item.id || item.fragmentId || "";
    const tierId = (item.tierId || item.licenseTierId || item.type || "").toLowerCase();
    const priceNum = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, ""));
    const isExclusivePurchase = tierId.includes("exclusive") || tierId === "eaa" || priceNum >= 4500;
    
    if (isExclusivePurchase) {
      console.log(`[EXCLUSIVE LICENSE SOLD] Updating beat status in database: isSold = true for ${rawId || item.name} (Buyer: ${buyerEmail})`);
      const matchIdx = mockFragments.findIndex(f => 
        f.id === rawId || 
        f.name === item.name || 
        f.timestamp === item.name ||
        (item.timestamp && f.timestamp === item.timestamp) ||
        (item.name && f.name && item.name.toLowerCase().includes(f.name.toLowerCase())) ||
        (item.name && f.timestamp && item.name.toLowerCase().includes(f.timestamp.toLowerCase()))
      );
      if (matchIdx !== -1) {
        mockFragments[matchIdx] = {
          ...mockFragments[matchIdx],
          isExclusive: true,
          recoveryState: "Exclusively Acquired",
          availability: "sold",
          isSold: true,
          exclusiveAcquired: true,
          exclusiveBuyer: buyerEmail,
          soldAt: new Date().toISOString()
        } as any;
      }
      if (!useMockDb && db) {
        try {
          await db.collection("fragments").updateMany(
            { 
              $or: [
                { id: rawId }, 
                { name: item.name }, 
                { timestamp: item.name },
                { timestamp: item.timestamp },
                { fragmentTimestamp: item.name },
                { fragmentTimestamp: item.timestamp },
                { compositionTitle: item.name }
              ] 
            },
            { 
              $set: { 
                isExclusive: true, 
                recoveryState: "Exclusively Acquired", 
                availability: "sold", 
                isSold: true, 
                exclusiveAcquired: true, 
                exclusiveBuyer: buyerEmail,
                soldAt: new Date().toISOString(),
                "licenses.access.enabled": false,
                "licenses.release.enabled": false,
                "licenses.commercial.enabled": false,
                "licenses.exclusive.enabled": false
              } 
            }
          );
        } catch (dbErr) {
          console.error("Error updating exclusive status in MongoDB fragments collection:", dbErr);
        }
      }
    }
  }
}
