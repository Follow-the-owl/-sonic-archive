// Shared TypeScript types used across the backend.


// --- Types ---
export interface User {
  email: string;
  passwordHash: string;
  role?: string;
  createdAt: Date;
}

export interface License {
  id: string; // License Reference Number
  song: string; // Composition / Fragment Title
  type: string; // License Tier Title
  date: string; // ISO / UTC timestamp
  purchaseDate?: string; // Auto-populated Transaction Date
  effectiveDate?: string;
  isrc: string;
  iswc: string;
  email: string; // Licensee Email
  licenseeLegalName?: string; // Licensee Full Name
  licenseeEmail?: string;
  licenseeAddress?: string; // Licensee Address
  licensor?: string; // LOMON LLC / The Owl Clock
  licensorEmail?: string; // licensing@theowlclock.io
  licensorOrganization?: string; // LOMON LLC (d/b/a The Owl Clock)
  legalContactName?: string; // Christopher Solomon Paul
  producerCredit?: string; // Produced by Lomon Christopher / The Owl Clock
  pro?: string; // BMI
  writerIpi?: string; // 01305977829
  archiveIdentifier?: string; // Fragment Catalog ID
  hash: string; // Audio File Hash / Stamp
  audioHash?: string;
  keySignature?: string; // Key Signature variable
  tempoBpm?: number | string; // Tempo BPM variable
  duration?: string; // Duration Seconds variable
  tierId?: string;
  amount?: number; // Total Fee Paid in USD
  price?: string | number;
  paymentStatus?: string; // Payment Status (Completed via Payment Gateway)
  permittedUsage?: string; // Permitted Rights Summary variable
  streamingLimit?: string; // Streaming Cap or Unlimited variable
  distributionTerritory?: string; // Distribution Territory (Worldwide)
  termDuration?: string; // Term Duration (Perpetual)
  composerSplits?: string; // Composer / PRO Splits variable
  signature: string;
  transactionRef?: string;
  masterOwnership?: string;
  compositionOwnership?: string;
  publishingShare?: string;
  writerShare?: string;
  exclusivity?: string;
  contractVersion?: string;
  artwork?: string;
}

export interface RequestItem {
  ref: string;
  type: string;
  target: string;
  status: string;
  date: string;
  email: string;
}

export interface Payment {
  id: string;
  userId?: string;
  email: string;
  clientEmail?: string;
  clientName?: string;
  paypalOrderId?: string;
  orderID?: string;
  amount: number;
  currency: string;
  status: string;
  paymentStatus?: string;
  gateway: string;
  paymentMethod?: string;
  transactionRef?: string;
  date: string;
  transactionDate?: string;
  createdAt?: Date | string;
  refundStatus?: string;
  items: any[];
}

export interface EmailLog {
  id: string;
  email: string;
  reference: string;
  subject: string;
  previewUrl?: string;
  html: string;
  date: string;
}

export interface Fragment {
  id: string;
  name: string;
  timestamp: string;
  classification: string;
  observation: string;
  duration: string;
  description: string;
  isExclusive: boolean;
  isSold?: boolean;
  exclusiveAcquired?: boolean;
  exclusiveBuyer?: string;
  soldAt?: string;
  availability?: "available" | "sold" | "reserved";
  frequency: number;
  synthType: "drone" | "keys" | "bell" | "noise" | "pulse";
  bpm: number;
  status?: string;
  plays?: number;
  revenue?: number;
  artwork?: string;
  mp3Preview?: string;
  audioUrl?: string;
  previewAudioUrl?: string;
  wavMaster?: string;
  wavUrl?: string;
  stemsZip?: string;
  zipUrl?: string;
  audioFiles?: any[];
  tonalSignature?: string;
  key?: string;
  recoveryState?: string;
  fullRecoveryDate?: string;
  archivist?: string;
  timeCapsule?: any;
}
