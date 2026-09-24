import { jsPDF } from "jspdf";

// ============================================================================
// THE OWL CLOCK / LOMON LLC — OFFICIAL LEGAL LICENSE AGREEMENT ENGINE
// Exact Legal Contracts for $150, $500, $1,000, $5,000, Sync, and Collab Tiers
// ============================================================================

export const LICENSOR_GLOBAL_METADATA = {
  legalEntity: "LOMON LLC d/b/a The Owl Clock",
  pro: "BMI",
  writerName: "CHRISTOPHER SOLOMON PAUL",
  writerIpi: "01305977829",
  publisherName: "CHRISTOPHER SOLOMON PAUL (d/b/a The Owl Clock)",
  publisherIpi: "01305977829"
} as const;

export interface LicenseAgreementData {
  licenseId: string; // Unique auto-generated ID, e.g., "TOC-LIC-20260804-4837"
  transactionRef: string; // e.g., "LMN-PS-178654291"
  purchaseDate: string; // e.g., "August 4, 2026"
  licenseeLegalName: string; // e.g., "John Smith"
  licenseeEmail: string;
  licenseeAddress?: string;
  fragmentTitle: string; // e.g., "9:41 PM"
  archiveIdentifier: string; // e.g., "TOC-0941PM-001" or "09:41"
  licenseTierId: "access" | "release" | "commercial" | "exclusive" | "sync" | "collaboration" | string;
  licenseTierTitle?: string;
  price?: number | string;
  
  // Custom Metadata / Schedule B Overrides
  masterOwnership?: string;
  compositionOwnership?: string;
  publishingShare?: string;
  writerShare?: string;
  contentIdRegistration?: string;
  exclusivity?: string;
  contractVersion?: string;

  // Custom Clauses, Scope & Package Overrides (CRUD Support)
  customScope?: string[] | string;
  customCredit?: string;
  customRestrictions?: string;
  customClauses?: string;
  customDeliveryPackage?: string;
}

export interface ScheduleAData {
  licensor: string;
  licenseeLegalName: string;
  licensedFragmentTitle: string;
  archiveIdentifier: string;
  licenseTier: string;
  permittedScope: string[];
  deliveryPackage: string;
  catalogStatus?: string;
  purchaseDate: string;
  licenseId: string;
  transactionRef: string;
  licenseFee: string;
}

export interface ScheduleBData {
  licensorEntity: string;
  masterOwnership: string;
  publishingShare: string;
  writerShare: string;
  contentIdRegistration: string;
  exclusivity: string;
  licensorPro: string;
  licensorWriterName: string;
  licensorWriterIpi: string;
  licensorPublisherName: string;
  licensorPublisherIpi: string;
  contractVersion: string;
  compositionOwnership?: string;
}

export interface LegalArticle {
  title: string;
  sections: {
    heading: string;
    text: string;
  }[];
}

/**
 * Normalizes tier ID from price or tier string
 */
export function normalizeTierId(tierIdOrPrice?: string | number): "access" | "release" | "commercial" | "exclusive" | "sync" | "collaboration" {
  if (!tierIdOrPrice && tierIdOrPrice !== 0) return "access";
  const str = String(tierIdOrPrice).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (str.includes("5000") || str.includes("exclusive") || str.includes("acqui")) return "exclusive";
  if (str.includes("1000") || str.includes("commercial") || str.includes("exploit")) return "commercial";
  if (str.includes("500") || str.includes("release")) return "release";
  if (str.includes("150") || str.includes("access")) return "access";
  if (str.includes("collab") || str.includes("collaboration") || str.includes("producer")) return "collaboration";
  if (str.includes("sync") || str.includes("custom") || str.includes("proposal")) return "sync";
  return "access";
}

/**
 * Dynamically computes Schedule A from purchase data & fragment metadata.
 */
export function getScheduleAData(data: LicenseAgreementData): ScheduleAData {
  const tierId = normalizeTierId(data.licenseTierId || (data.price !== undefined ? String(data.price) : "access"));
  
  let tierTitle = "Archive Access License ($150.00 USD)";
  let feeStr = "USD $150.00";
  let deliveryPackage = "High-Resolution WAV Master, Tagged Reference MP3, Clearance Certificate, Executed Agreement";
  let catalogStatus = "Active in Public Archive (Non-Exclusive Licensing)";
  let scope: string[] = [
    "1 Licensed Project",
    "Digital Audio Streams: Up to 100,000 cumulative streams",
    "Physical & Digital Sales: Up to 2,000 units sold",
    "Master Ownership: 100% Retained by LOMON LLC",
    "Publishing Split: 50% LOMON LLC / 50% Licensee",
    "Exceeding caps requires upgrading to Commercial Release or Commercial Exploitation"
  ];

  if (tierId === "release") {
    tierTitle = "Commercial Release License ($500.00 USD)";
    feeStr = "USD $500.00";
    deliveryPackage = "High-Resolution WAV, Reference MP3, Metadata Package, Clearance Certificate";
    catalogStatus = "Active in Public Archive (Non-Exclusive Licensing)";
    scope = [
      "1 Commercial Musical Release Project",
      "Worldwide Commercial Distribution across major Digital Music Services (Spotify, Apple Music, Tidal, etc.)",
      "Approved Promotional Video use (one official music video, lyric video, visualizer)",
      "Live Public Concert & Venue Performances Permitted",
      "Performance Rights Organizations (PRO) Registration (50/50 Split)",
      "Master Ownership retained 100% by LOMON LLC"
    ];
  } else if (tierId === "commercial") {
    tierTitle = "Commercial Exploitation License ($1,000.00 USD)";
    feeStr = "USD $1,000.00";
    deliveryPackage = "High-Resolution WAV, Production Stems, License Agreement, Metadata Package, Documentation Package, Clearance Certificate";
    catalogStatus = "Active in Public Archive (Non-Exclusive Licensing)";
    scope = [
      "1 Professional Musical Release across all commercial channels",
      "Unlimited Audio Streams across all Digital Music Services",
      "Unlimited Physical & Digital Sales across commercial retail channels",
      "Full Production Stems Package included for advanced mixing & rearrangement",
      "Monetized Video, Social Media Promotional Campaigns & Live Performances",
      "Master Ownership retained 100% by LOMON LLC (50/50 Publishing Split)"
    ];
  } else if (tierId === "exclusive") {
    tierTitle = "Exclusive Archive Acquisition ($5,000.00 USD)";
    feeStr = "USD $5,000.00";
    deliveryPackage = "Full Production Files, Production Stems, High-Resolution WAV, Metadata Transfer, Exclusive Clearance Certificate, Ownership Documentation";
    catalogStatus = "Retired & Permanently Removed from Archive";
    scope = [
      "100% Exclusive Commercial Rights & Worldwide Exploitation",
      "Permanent Catalog Removal & Retirement from The Owl Clock public licensing platform",
      "Full Production Files & Multi-track Stems Included",
      "Master Ownership 100% Transferred and Assigned to Licensee per executed terms",
      "Publishing & Writer Split: 50% LOMON LLC / 50% Licensee",
      "Automated Content Identification System (Content ID) registration permitted per Section 3.8",
      "Prior lawfully issued non-exclusive licenses remain valid per Section 3.8"
    ];
  } else if (tierId === "collaboration") {
    tierTitle = "Producer Collaboration License (Collaboration Tier)";
    feeStr = "USD $0.00 (Collaboration)";
    deliveryPackage = "Production Stems, High-Resolution WAV, Metadata Package, Co-Publishing Agreement";
    catalogStatus = "Collaborative Archive Project";
    scope = [
      "1 Collaborative Music Release Project",
      "Upfront Fee: $0.00",
      "Master Ownership: 50% LOMON LLC / 50% Licensee",
      "Publishing Split: 50% LOMON LLC / 50% Licensee",
      "Writer Split: 50% LOMON LLC / 50% Licensee",
      "Commercial distribution permitted subject to joint clearance execution"
    ];
  } else if (tierId === "sync") {
    tierTitle = "Synchronization & Master License (Custom Proposal)";
    feeStr = data.price ? `USD $${data.price}` : "Custom Project Quoted";
    deliveryPackage = "High-Resolution Master WAV, Production Stems, Project Clearance Schedule";
    catalogStatus = "Project-Specific Clearance";
    scope = [
      "Project-Specific Synchronization & Master License",
      "Approved Film, Television, Advertising, Streaming Series, or Video Game integration",
      "Worldwide Broadcast & VoD Rights Per Executed Project Schedule",
      "Master Ownership & Publishing Splits Negotiated Per Project Schedule"
    ];
  }

  if (data.price !== undefined && data.price !== null) {
    if (typeof data.price === "number") {
      feeStr = `USD $${data.price.toFixed(2)}`;
    } else if (String(data.price).startsWith("$")) {
      feeStr = `USD ${data.price}`;
    }
  }

  // Allow custom scope & delivery overrides from CRUD editor
  if (data.customScope) {
    scope = Array.isArray(data.customScope) ? data.customScope : [String(data.customScope)];
  }
  if (data.customDeliveryPackage) {
    deliveryPackage = data.customDeliveryPackage;
  }

  // Derive Archive Identifier if not formatted
  let formattedArchiveId = data.archiveIdentifier || "TOC-FRAG-001";
  if (!formattedArchiveId.startsWith("TOC-")) {
    const cleanId = formattedArchiveId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    formattedArchiveId = `TOC-${cleanId || "FRAG"}-001`;
  }

  return {
    licensor: LICENSOR_GLOBAL_METADATA.legalEntity,
    licenseeLegalName: data.licenseeLegalName || "Valued Licensee",
    licensedFragmentTitle: data.fragmentTitle || "The Owl Clock Archive Fragment",
    archiveIdentifier: formattedArchiveId,
    licenseTier: data.licenseTierTitle || tierTitle,
    permittedScope: scope,
    deliveryPackage,
    catalogStatus,
    purchaseDate: data.purchaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    licenseId: data.licenseId || `TOC-LIC-${Date.now()}`,
    transactionRef: data.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
    licenseFee: feeStr
  };
}

/**
 * Dynamically computes Schedule B from purchase data & fragment metadata.
 * Strictly populated with explicit baseline percentages and PRO/IPI metadata.
 */
export function getScheduleBData(data: LicenseAgreementData): ScheduleBData {
  const tierId = normalizeTierId(data.licenseTierId || (data.price !== undefined ? String(data.price) : "access"));

  // Common PRO / Entity metadata
  const basePro = {
    licensorEntity: LICENSOR_GLOBAL_METADATA.legalEntity,
    licensorPro: LICENSOR_GLOBAL_METADATA.pro,
    licensorWriterName: LICENSOR_GLOBAL_METADATA.writerName,
    licensorWriterIpi: LICENSOR_GLOBAL_METADATA.writerIpi,
    licensorPublisherName: LICENSOR_GLOBAL_METADATA.publisherName,
    licensorPublisherIpi: LICENSOR_GLOBAL_METADATA.publisherIpi,
  };

  // Tier 5: Exclusive Archive Acquisition ($5,000)
  if (tierId === "exclusive") {
    return {
      ...basePro,
      masterOwnership: data.masterOwnership || "100% Transferred and Assigned to Licensee (per executed Schedule A/B)",
      publishingShare: data.publishingShare || "50% LOMON LLC / 50% Licensee",
      writerShare: data.writerShare || "50% LOMON LLC / 50% Licensee",
      contentIdRegistration: data.contentIdRegistration || "Permitted (Subject to Section 3.8 prior non-exclusive rights)",
      exclusivity: data.exclusivity || "100% Exclusive Acquisition",
      contractVersion: data.contractVersion || "v3.0-2026"
    };
  }

  // Tier 3: Commercial Exploitation License ($1,000)
  if (tierId === "commercial") {
    return {
      ...basePro,
      masterOwnership: data.masterOwnership || "Retained by LOMON LLC (100%)",
      publishingShare: data.publishingShare || "50% LOMON LLC / 50% Licensee",
      writerShare: data.writerShare || "50% LOMON LLC / 50% Licensee",
      contentIdRegistration: data.contentIdRegistration || "Restricted / Prohibited",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.5-2026"
    };
  }

  // Tier 2: Commercial Release License ($500)
  if (tierId === "release") {
    return {
      ...basePro,
      masterOwnership: data.masterOwnership || "Retained by LOMON LLC (100%)",
      publishingShare: data.publishingShare || "50% LOMON LLC / 50% Licensee",
      writerShare: data.writerShare || "50% LOMON LLC / 50% Licensee",
      contentIdRegistration: data.contentIdRegistration || "Restricted / Prohibited",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.2-2026"
    };
  }

  // Tier 6: Producer Collaboration ($0)
  if (tierId === "collaboration") {
    return {
      ...basePro,
      masterOwnership: data.masterOwnership || "50% LOMON LLC / 50% Licensee",
      publishingShare: data.publishingShare || "50% LOMON LLC / 50% Licensee",
      writerShare: data.writerShare || "50% LOMON LLC / 50% Licensee",
      contentIdRegistration: data.contentIdRegistration || "Restricted / Subject to Joint Written Approval",
      exclusivity: data.exclusivity || "Collaborative Project Allocation",
      contractVersion: data.contractVersion || "v1.0-Collab-2026"
    };
  }

  // Tier 4: Synchronization & Master License (Custom Proposal)
  if (tierId === "sync") {
    return {
      ...basePro,
      masterOwnership: data.masterOwnership || "Negotiated Per Project",
      publishingShare: data.publishingShare || "Negotiated Per Project",
      writerShare: data.writerShare || "Negotiated Per Project",
      contentIdRegistration: data.contentIdRegistration || "Per Project Agreement / Negotiated",
      exclusivity: data.exclusivity || "Project-Specific / Negotiable",
      contractVersion: data.contractVersion || "v2.0-2026"
    };
  }

  // Tier 1: Archive Access License ($150) — Default
  return {
    ...basePro,
    masterOwnership: data.masterOwnership || "100% LOMON LLC",
    publishingShare: data.publishingShare || "50% LOMON LLC | 50% Licensee",
    writerShare: data.writerShare || "50% LOMON LLC | 50% Licensee",
    contentIdRegistration: data.contentIdRegistration || "Strictly Prohibited",
    exclusivity: data.exclusivity || "Non-Exclusive",
    contractVersion: data.contractVersion || "v1.0-2026"
  };
}

/**
 * Returns structured legal articles corresponding to the exact PDF text for each license tier.
 */
export function getLegalArticlesForTier(tierIdOrPrice: string | number): {
  agreementTitle: string;
  importantNotice: string[];
  articles: LegalArticle[];
  contractVersion: string;
} {
  const tier = normalizeTierId(tierIdOrPrice);

  if (tier === "release") {
    return {
      agreementTitle: "COMMERCIAL RELEASE LICENSE AGREEMENT",
      contractVersion: "v1.2-2026",
      importantNotice: [
        "This Agreement grants non-exclusive commercial rights to incorporate the identified Archived Fragment into one commercial musical release across digital music platforms.",
        "This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, or its original master recording. Master ownership remains 100% with Lomon LLC, and publishing is split 50% Writer / 50% Publisher as outlined herein.",
        "The Licensed Fragment may remain available for licensing to other parties unless it is subsequently removed from the Archive or acquired under a separate exclusive agreement."
      ],
      articles: [
        {
          title: "ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE",
          sections: [
            {
              heading: "1.1 Parties",
              text: "This Commercial Release License Agreement (\"Agreement\") is entered into between LOMON LLC, a Georgia limited liability company operating through The Owl Clock (\"Licensor\"), and the individual or legal entity identified in the purchase record and Schedule A (\"Licensee\"). The Licensor and Licensee may individually be referred to as a \"Party\" and collectively as the \"Parties.\""
            },
            {
              heading: "1.2 Licensed Transaction",
              text: "This Agreement governs the Licensee's purchase of a Commercial Release License for the Archived Fragment identified in Schedule A. The license fee for this tier is five hundred United States dollars (USD $500.00), excluding applicable taxes, processing charges, or currency-conversion fees. The license becomes effective only upon:\n  a. successful completion and confirmation of payment;\n  b. provision of accurate Licensee legal information;\n  c. formal identification of the Licensed Fragment; and\n  d. acceptance of this Agreement by the Licensee."
            },
            {
              heading: "1.3 Acceptance",
              text: "The Licensee accepts and agrees to be bound by this Agreement by completing the purchase transaction, selecting an electronic acceptance checkbox, applying a digital signature, downloading the Licensed Materials, accessing the delivery package, or commercially exploiting the Licensed Fragment."
            },
            {
              heading: "1.4 Purpose & Electronic Execution",
              text: "The Owl Clock maintains and licenses a curated archive of original audio fragments. This Agreement grants the Licensee commercial release authority for one new musical work while preserving the Licensor's master ownership, archive records, and publishing shares. This Agreement may be executed and stored electronically."
            }
          ]
        },
        {
          title: "ARTICLE 2: DEFINITIONS",
          sections: [
            {
              heading: "2.1 Archive",
              text: "\"Archive\" means The Owl Clock and its system of audio fragments, records, identifiers, timestamps, metadata, files, visual assets, and intellectual property."
            },
            {
              heading: "2.2 Archived Fragment",
              text: "\"Archived Fragment\" means the specific original audio fragment identified in Schedule A, including the audio recording delivered by Licensor and any protectable musical material embodied within it."
            },
            {
              heading: "2.3 Composition",
              text: "\"Composition\" means the underlying musical work embodied in the Archived Fragment, including any protectable melody, harmony, rhythm, arrangement, or structure owned or controlled by Licensor."
            },
            {
              heading: "2.4 Original Master",
              text: "\"Original Master\" means the original sound recording of the Archived Fragment owned exclusively by Licensor."
            },
            {
              heading: "2.5 Licensed Materials",
              text: "\"Licensed Materials\" means the high-resolution WAV file, Reference MP3, Metadata Package, Clearance Certificate, and Executed Agreement delivered under this tier."
            },
            {
              heading: "2.6 Licensed Project",
              text: "\"Licensed Project\" means one new and original musical work created by or for Licensee incorporating the Archived Fragment (\"New Song\")."
            },
            {
              heading: "2.7 Release",
              text: "\"Release\" means the commercially distributed version of the Licensed Project authorized under this Agreement."
            },
            {
              heading: "2.8 Licensee Contribution",
              text: "\"Licensee Contribution\" means original vocals, lyrics, performances, instrumentation, and production created or lawfully provided by Licensee and added to the Archived Fragment."
            },
            {
              heading: "2.9 Digital Music Services",
              text: "\"Digital Music Services\" means legitimate streaming platforms, digital-download stores, and social-media music systems (e.g., Spotify, Apple Music, Tidal, Amazon Music, iTunes)."
            },
            {
              heading: "2.10 Content Identification System",
              text: "\"Content Identification System\" means any automated audio-recognition or copyright-claiming service (e.g., YouTube Content ID, Meta Rights Manager)."
            },
            {
              heading: "2.11 Non-Exclusive",
              text: "\"Non-Exclusive\" means Licensor retains ownership and may continue using and licensing the Archived Fragment to third parties."
            }
          ]
        },
        {
          title: "ARTICLE 3: GRANT OF LICENSE & RIGHTS",
          sections: [
            {
              heading: "3.1 Conditional Grant",
              text: "Subject to full payment and compliance with this Agreement, Licensor grants Licensee a worldwide, non-exclusive, non-transferable, and non-sublicensable license to incorporate the Archived Fragment into one Licensed Project and commercially distribute it across Digital Music Services."
            },
            {
              heading: "3.2 Permitted Production & Editing",
              text: "Licensee may record vocals and instrumentation over the Archived Fragment, alter tempo/key/arrangement, mix and master, and produce clean, explicit, radio, or performance edits of the Licensed Project. Such edits do not grant Licensee ownership in the original Archived Fragment."
            },
            {
              heading: "3.3 Commercial Release & Streaming Rights",
              text: "Licensee is authorized to distribute and monetize the Licensed Project commercially on all major Digital Music Services within the executed scope of this Agreement."
            },
            {
              heading: "3.4 Promotional Video Rights",
              text: "Licensee may use the Licensed Project in connection with artist-controlled promotional channels, social media previews, and approved video formats (e.g., one official music video, lyric video, or visualizer created specifically to promote the Release). Third-party broadcast or commercial sync placements remain strictly prohibited without a separate Synchronization License."
            },
            {
              heading: "3.5 Live Performance",
              text: "Licensee may publicly perform the Licensed Project in live concerts, venues, and broadcasts."
            },
            {
              heading: "3.6 Registration Rights",
              text: "Licensee may register the Licensed Project with Performance Rights Organizations (PROs) and distributors, provided registrations reflect the exact publishing splits, master ownership, and credit terms mandated by this Agreement."
            },
            {
              heading: "3.7 No Master Ownership Transfer",
              text: "This Agreement is a license only. Licensee acquires no ownership in the Original Master, the underlying Composition, or Licensor's trademarks. Master ownership remains 100% with Lomon LLC."
            }
          ]
        },
        {
          title: "ARTICLE 4: PUBLISHING SPLITS, ROYALTIES AND OWNERSHIP",
          sections: [
            {
              heading: "4.1 Master Ownership",
              text: "Lomon LLC retains 100% Master Ownership of the sound recording embodied in the Archived Fragment and its underlying stems. Licensee owns only the separable Licensee Contribution."
            },
            {
              heading: "4.2 Publishing & Writer Share Allocation",
              text: "The underlying Composition of the Archived Fragment shall be allocated as follows for registration and royalty administration purposes:\n• Writer Share: 50% Allocated to Lomon LLC (or designated writer) / 50% Allocated to Licensee (or Licensee's writers).\n• Publisher Share: 50% Allocated to Lomon LLC (or designated publisher) / 50% Allocated to Licensee's publisher."
            },
            {
              heading: "4.3 Royalty Collection",
              text: "Licensee is entitled to collect master distribution earnings generated by the Licensed Project on Digital Music Services, subject to the proper administration of publishing shares through PROs and mechanical royalty collection agencies."
            }
          ]
        },
        {
          title: "ARTICLE 5: PROHIBITED USES & RESTRICTIONS",
          sections: [
            {
              heading: "5.1 Content ID Restriction",
              text: "Because this license is non-exclusive, Licensee shall not register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform. Doing so generates false copyright strikes against other non-exclusive licensees and constitutes a material breach of this Agreement."
            },
            {
              heading: "5.2 AI Dataset & Voice Cloning Prohibition",
              text: "Licensee shall not upload, feed, or process the Archived Fragment or Licensed Materials through any Artificial Intelligence System, generative model, voice-cloning tool, or audio training dataset."
            },
            {
              heading: "5.3 No Standalone Resale",
              text: "Licensee shall not sell, license, share, or re-distribute the Archived Fragment as stock audio, sample packs, loops, virtual instruments, or standalone audio files."
            }
          ]
        },
        {
          title: "ARTICLE 6: SYNCHRONIZATION AND MEDIA RESTRICTIONS",
          sections: [
            {
              heading: "6.1 Excluded Broadcast & Commercial Sync",
              text: "This Commercial Release License does not grant commercial Synchronization rights. Integration of the Licensed Project into feature films, TV shows, streaming series, commercial advertisements, brand campaigns, video games, or mobile apps requires a separate Synchronization & Master License negotiated directly with Lomon LLC."
            }
          ]
        },
        {
          title: "ARTICLE 7: METADATA, CREDITS AND GOVERNING LAW",
          sections: [
            {
              heading: "7.1 Mandatory Credit",
              text: "Licensee shall ensure proper producer and composition credit is included across all digital distribution platforms, physical packaging, and streaming metadata. Credit must appear as:\n\"Produced by Lomon / The Owl Clock\" or \"Contains elements of '[Fragment Title]' provided by The Owl Clock / Lomon LLC.\""
            },
            {
              heading: "7.2 Governing Law & Jurisdiction",
              text: "This Agreement is governed by and construed in accordance with the laws of the State of Georgia, USA. Any legal disputes arising under this Agreement shall be resolved exclusively in the state or federal courts located in Georgia."
            }
          ]
        }
      ]
    };
  }

  if (tier === "commercial") {
    return {
      agreementTitle: "COMMERCIAL EXPLOITATION LICENSE AGREEMENT",
      contractVersion: "v1.5-2026",
      importantNotice: [
        "This Agreement grants non-exclusive, unlimited commercial exploitation rights to incorporate the identified Archived Fragment into one professional musical release across all commercial channels.",
        "This Agreement includes full Production Stems and High-Resolution WAV files for advanced mixing and arrangements.",
        "This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, or its original master recording. Master ownership remains 100% with Lomon LLC, and publishing is split 50% Writer / 50% Publisher as outlined herein.",
        "The Licensed Fragment may remain available for licensing to other parties unless it is subsequently removed from the Archive or acquired under a separate exclusive agreement."
      ],
      articles: [
        {
          title: "ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE",
          sections: [
            {
              heading: "1.1 Parties",
              text: "This Commercial Exploitation License Agreement (\"Agreement\") is entered into between LOMON LLC, a Georgia limited liability company operating through The Owl Clock (\"Licensor\"), and the individual or legal entity identified in the purchase record and Schedule A (\"Licensee\"). The Licensor and Licensee may individually be referred to as a \"Party\" and collectively as the \"Parties.\""
            },
            {
              heading: "1.2 Licensed Transaction",
              text: "This Agreement governs the Licensee's purchase of a Commercial Exploitation License for the Archived Fragment identified in Schedule A. The license fee for this tier is one thousand United States dollars (USD $1,000.00), excluding applicable taxes, processing charges, or checkout fees. The license becomes effective only upon:\n  a. successful completion and confirmation of payment;\n  b. provision of accurate Licensee legal information;\n  c. formal identification of the Licensed Fragment; and\n  d. acceptance of this Agreement by the Licensee."
            },
            {
              heading: "1.3 Acceptance",
              text: "The Licensee accepts and agrees to be bound by this Agreement by completing the purchase transaction, selecting an electronic acceptance checkbox, applying a digital signature, downloading the Licensed Materials, accessing the delivery package, or commercially exploiting the Licensed Fragment."
            },
            {
              heading: "1.4 Purpose & Electronic Execution",
              text: "The Owl Clock maintains and licenses a curated archive of original audio fragments. This Agreement grants the Licensee full commercial exploitation and monetization authority for one new musical work while preserving the Licensor's master ownership, archive records, and publishing shares. This Agreement may be executed and stored electronically."
            }
          ]
        },
        {
          title: "ARTICLE 2: DEFINITIONS",
          sections: [
            {
              heading: "2.1 Archive",
              text: "\"Archive\" means The Owl Clock and its system of audio fragments, records, identifiers, timestamps, metadata, files, visual assets, and intellectual property."
            },
            {
              heading: "2.2 Archived Fragment",
              text: "\"Archived Fragment\" means the specific original audio fragment identified in Schedule A, including the audio recording and individual multi-track stems delivered by Licensor and any protectable musical material embodied within it."
            },
            {
              heading: "2.3 Composition",
              text: "\"Composition\" means the underlying musical work embodied in the Archived Fragment, including any protectable melody, harmony, rhythm, arrangement, or structure owned or controlled by Licensor."
            },
            {
              heading: "2.4 Original Master",
              text: "\"Original Master\" means the original sound recording of the Archived Fragment owned exclusively by Licensor."
            },
            {
              heading: "2.5 Licensed Materials",
              text: "\"Licensed Materials\" means the High-Resolution WAV file, Production Stems, License Agreement, Metadata Package, Documentation Package, and Clearance Certificate delivered under this tier."
            },
            {
              heading: "2.6 Licensed Project",
              text: "\"Licensed Project\" means one new and original musical work created by or for Licensee incorporating the Archived Fragment (\"New Song\")."
            },
            {
              heading: "2.7 Release",
              text: "\"Release\" means the commercially distributed version of the Licensed Project authorized under this Agreement."
            },
            {
              heading: "2.8 Licensee Contribution",
              text: "\"Licensee Contribution\" means original vocals, lyrics, performances, instrumentation, and production created or lawfully provided by Licensee and added to the Archived Fragment."
            },
            {
              heading: "2.9 Digital Music Services",
              text: "\"Digital Music Services\" means legitimate streaming platforms, digital-download stores, and social-media music systems (e.g., Spotify, Apple Music, Tidal, Amazon Music, iTunes)."
            },
            {
              heading: "2.10 Content Identification System",
              text: "\"Content Identification System\" means any automated audio-recognition or copyright-claiming service (e.g., YouTube Content ID, Meta Rights Manager)."
            },
            {
              heading: "2.11 Non-Exclusive",
              text: "\"Non-Exclusive\" means Licensor retains ownership and may continue using and licensing the Archived Fragment to third parties."
            }
          ]
        },
        {
          title: "ARTICLE 3: GRANT OF LICENSE & EXPLOITATION RIGHTS",
          sections: [
            {
              heading: "3.1 Conditional Grant",
              text: "Subject to full payment and compliance with this Agreement, Licensor grants Licensee a worldwide, perpetual, non-exclusive, non-transferable, and non-sublicensable license to incorporate the Archived Fragment into one Licensed Project and commercially exploit, distribute, perform, and monetize it without streaming limits."
            },
            {
              heading: "3.2 Permitted Production & Stem Usage",
              text: "Licensee may utilize the delivered Production Stems to alter, manipulate, chop, re-arrange, mix, master, adjust tempo/key, and incorporate original vocals or instrumentation. Licensee may produce clean, explicit, radio, instrumental, or extended edits of the Licensed Project. Such edits do not grant Licensee ownership in the original Archived Fragment or individual stems."
            },
            {
              heading: "3.3 Unlimited Streaming & Distribution",
              text: "Licensee is granted unlimited audio streams and unlimited physical/digital sales for the Licensed Project across all Digital Music Services and commercial retail channels."
            },
            {
              heading: "3.4 Monetized Video & Promotional Use",
              text: "Licensee is authorized to use the Licensed Project in monetized content, official music videos, visualizers, social media promotional campaigns, online video channels (YouTube, TikTok, Instagram), live performance teasers, and artist-controlled marketing. Broadcast TV commercials, feature film integrations, and major brand ad campaigns require a separate Synchronization & Master License."
            },
            {
              heading: "3.5 Live Performance Rights",
              text: "Licensee is granted full live performance rights to perform the Licensed Project in public concerts, venue tours, festivals, broadcasts, and ticketed livestreams."
            },
            {
              heading: "3.6 Registration Rights",
              text: "Licensee may register the Licensed Project with Performance Rights Organizations (PROs) and distributors, provided registrations reflect the exact publishing splits, master ownership, and credit terms mandated by this Agreement."
            },
            {
              heading: "3.7 No Master Ownership Transfer",
              text: "This Agreement is a license only. Licensee acquires no ownership in the Original Master, the underlying Composition, stems, or Licensor's trademarks. Master ownership remains 100% with Lomon LLC."
            }
          ]
        },
        {
          title: "ARTICLE 4: PUBLISHING SPLITS, ROYALTIES AND OWNERSHIP",
          sections: [
            {
              heading: "4.1 Master Ownership",
              text: "Lomon LLC retains 100% Master Ownership of the sound recording embodied in the Archived Fragment and its underlying stems. Licensee owns only the separable Licensee Contribution."
            },
            {
              heading: "4.2 Publishing & Writer Share Allocation",
              text: "The underlying Composition of the Archived Fragment shall be allocated as follows for registration and royalty administration purposes:\n• Writer Share: 50% Allocated to Lomon LLC (or designated writer) / 50% Allocated to Licensee (or Licensee's writers).\n• Publisher Share: 50% Allocated to Lomon LLC (or designated publisher) / 50% Allocated to Licensee's publisher."
            },
            {
              heading: "4.3 Royalty Collection",
              text: "Licensee is entitled to collect 100% of master distribution revenues generated by the Licensed Project across Digital Music Services, subject to the proper administration of publishing shares through PROs and mechanical royalty collection agencies."
            }
          ]
        },
        {
          title: "ARTICLE 5: PROHIBITED USES & RESTRICTIONS",
          sections: [
            {
              heading: "5.1 Content ID Restriction",
              text: "Because this license is non-exclusive, Licensee shall not register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform. Doing so generates false copyright strikes against other non-exclusive licensees and constitutes a material breach of this Agreement."
            },
            {
              heading: "5.2 AI Dataset & Voice Cloning Prohibition",
              text: "Licensee shall not upload, feed, or process the Archived Fragment, individual stems, or Licensed Materials through any Artificial Intelligence System, generative model, voice-cloning tool, or audio training dataset."
            },
            {
              heading: "5.3 No Standalone Resale",
              text: "Licensee shall not sell, license, share, or re-distribute the Archived Fragment or stems as stock audio, sample packs, loops, virtual instruments, or standalone audio files."
            }
          ]
        },
        {
          title: "ARTICLE 6: SYNCHRONIZATION AND MEDIA RESTRICTIONS",
          sections: [
            {
              heading: "6.1 Third-Party Sync Requirements",
              text: "While monetized video and artist promotional visualizers are approved under Section 3.4, third-party synchronization (e.g., placement in feature films, TV shows, streaming series, commercial ad campaigns, video games, or software apps) requires a dedicated Synchronization & Master License negotiated directly with Lomon LLC."
            }
          ]
        },
        {
          title: "ARTICLE 7: METADATA, CREDITS AND GOVERNING LAW",
          sections: [
            {
              heading: "7.1 Mandatory Credit",
              text: "Licensee shall ensure proper producer and composition credit is included across all digital distribution platforms, physical packaging, and streaming metadata. Credit must appear as:\n\"Produced by Lomon / The Owl Clock\" or \"Contains elements of '[Fragment Title]' provided by The Owl Clock / Lomon LLC.\""
            },
            {
              heading: "7.2 Governing Law & Jurisdiction",
              text: "This Agreement is governed by and construed in accordance with the laws of the State of Georgia, USA. Any legal disputes arising under this Agreement shall be resolved exclusively in the state or federal courts located in Georgia."
            }
          ]
        }
      ]
    };
  }

  if (tier === "exclusive") {
    return {
      agreementTitle: "EXCLUSIVE ARCHIVE ACQUISITION LICENSE AGREEMENT",
      contractVersion: "v3.0-2026",
      importantNotice: [
        "This Agreement grants 100% exclusive commercial rights and catalog removal for the identified Archived Fragment. Upon execution of this Agreement, the Licensed Fragment will be permanently retired and removed from future public licensing by The Owl Clock.",
        "All non-exclusive licenses lawfully issued prior to the execution date of this Agreement shall remain valid and in effect, as specified under U.S. copyright law and Section 3.8 of this Agreement.",
        "Rights, master transfers, and publishing splits are governed strictly by the terms stated herein and executed in Schedule A and Schedule B."
      ],
      articles: [
        {
          title: "ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE",
          sections: [
            {
              heading: "1.1 Parties",
              text: "This Exclusive Archive Acquisition License Agreement (\"Agreement\") is entered into between LOMON LLC, a Georgia limited liability company operating through The Owl Clock (\"Licensor\"), and the individual or legal entity identified in the purchase record and Schedule A (\"Licensee\"). The Licensor and Licensee may individually be referred to as a \"Party\" and collectively as the \"Parties.\""
            },
            {
              heading: "1.2 Licensed Transaction",
              text: "This Agreement governs the Licensee's purchase of an Exclusive Archive Acquisition for the Archived Fragment identified in Schedule A. The acquisition fee for this tier is five thousand United States dollars (USD $5,000.00), excluding applicable taxes, processing charges, or checkout fees. The acquisition becomes effective only upon:\n  a. successful completion and confirmation of payment;\n  b. provision of accurate Licensee legal information;\n  c. formal identification of the Licensed Fragment; and\n  d. acceptance of this Agreement by the Licensee."
            },
            {
              heading: "1.3 Acceptance & Execution",
              text: "The Licensee accepts and agrees to be bound by this Agreement by completing the purchase transaction, selecting an electronic acceptance checkbox, applying a digital signature, downloading the Licensed Materials, or accessing the delivery package."
            },
            {
              heading: "1.4 Purpose & Archive Retirement",
              text: "The Owl Clock maintains a curated archive of original audio fragments. The purpose of this Agreement is to grant the Licensee exclusive control over the identified Archived Fragment and to permanently remove it from future public offering or re-licensing in The Owl Clock archive."
            }
          ]
        },
        {
          title: "ARTICLE 2: DEFINITIONS",
          sections: [
            {
              heading: "2.1 Archive",
              text: "\"Archive\" means The Owl Clock and its system of audio fragments, records, identifiers, timestamps, metadata, files, visual assets, and intellectual property."
            },
            {
              heading: "2.2 Archived Fragment",
              text: "\"Archived Fragment\" means the specific original audio fragment identified in Schedule A, including all multi-track stems, master recordings, and full production project files delivered by Licensor."
            },
            {
              heading: "2.3 Composition",
              text: "\"Composition\" means the underlying musical work embodied in the Archived Fragment, including any protectable melody, harmony, rhythm, arrangement, or structure created or owned by Licensor."
            },
            {
              heading: "2.4 Original Master",
              text: "\"Original Master\" means the original sound recording of the Archived Fragment."
            },
            {
              heading: "2.5 Licensed Materials",
              text: "\"Licensed Materials\" means the Full Production Files, Production Stems, High-Resolution WAV, Metadata Transfer, Exclusive Clearance Certificate, Ownership Documentation, and Executed Agreement delivered under this tier."
            },
            {
              heading: "2.6 Licensed Project",
              text: "\"Licensed Project\" means any musical work, sound recording, or commercial media release created by or for Licensee incorporating the Archived Fragment."
            },
            {
              heading: "2.7 Content Identification System",
              text: "\"Content Identification System\" means any automated audio-recognition or copyright-claiming service (e.g., YouTube Content ID, Meta Rights Manager)."
            },
            {
              heading: "2.8 Exclusive Acquisition",
              text: "\"Exclusive Acquisition\" means that no further licenses for the Archived Fragment will be granted to third parties by Licensor following the purchase date."
            }
          ]
        },
        {
          title: "ARTICLE 3: GRANT OF EXCLUSIVE RIGHTS & CATALOG REMOVAL",
          sections: [
            {
              heading: "3.1 Exclusive Grant",
              text: "Subject to full payment and compliance with this Agreement, Licensor grants Licensee a worldwide, perpetual, 100% exclusive right to incorporate, exploit, modify, perform, distribute, and monetize the Archived Fragment across all media platforms and commercial distribution channels."
            },
            {
              heading: "3.2 Catalog Removal & Retirement",
              text: "Upon execution of this Agreement and delivery of files, Licensor agrees to permanently remove the Archived Fragment from public availability on The Owl Clock licensing platform and to cease all future licensing, leasing, or distribution of the Archived Fragment to new third parties."
            },
            {
              heading: "3.3 Unlimited Exploitation & Stems",
              text: "Licensee is granted unlimited audio streams, unlimited physical/digital sales, unlimited live performances, monetized video creation, and unrestricted use of all delivered Full Production Files and Production Stems."
            },
            {
              heading: "3.4 Master Ownership & Transfer",
              text: "Master ownership of the Archived Fragment sound recording is transferred and assigned to Licensee per the executed terms in Schedule A and Schedule B of this Agreement."
            },
            {
              heading: "3.5 Publishing & Writer Shares",
              text: "Publishing participation and writer splits are negotiable and shall be allocated per the executed terms in Schedule B. Unless explicitly transferred in writing in Schedule B, Licensor retains its negotiated underlying writer/publishing participation interest."
            },
            {
              heading: "3.6 Content ID Rights",
              text: "As the exclusive owner/licensee under this tier, Licensee is permitted to register the Licensed Project into automated Content Identification Systems (e.g., YouTube Content ID, Meta Rights Manager), provided that such registration accounts for pre-existing non-exclusive licenses in accordance with Section 3.8."
            },
            {
              heading: "3.7 Permitted AI & Production Tools",
              text: "Licensee may utilize full production files and stems within its own private mixing, arrangement, and digital audio workstation (DAW) environment. Commercial training of public AI models remains restricted as governed by Article 5."
            },
            {
              heading: "3.8 Prior Non-Exclusive Licenses",
              text: "Licensee expressly acknowledges and agrees that any non-exclusive licenses lawfully issued by Licensor for the Archived Fragment prior to the execution date of this Agreement remain valid, active, and enforceable under their original terms. The existence of prior non-exclusive licensees does not breach Licensor's grant of exclusive rights to future catalog removal under this Agreement."
            }
          ]
        },
        {
          title: "ARTICLE 4: ROYALTIES, CREDITS AND REGISTRATION",
          sections: [
            {
              heading: "4.1 Master Revenues",
              text: "Licensee retains 100% of master distribution revenues generated by the Licensed Project across all commercial streaming platforms and physical formats."
            },
            {
              heading: "4.2 PRO Registration",
              text: "Licensee shall register the Licensed Project with relevant Performing Rights Organizations (PROs) adhering strictly to the publishing split percentages specified in Schedule B."
            },
            {
              heading: "4.3 Credit Line",
              text: "Where credits are rendered in digital liner notes, physical packaging, or media documentation, credit shall be formatted as:\n\"Contains elements created by Lomon / The Owl Clock\" (or as mutually designated in writing)."
            }
          ]
        },
        {
          title: "ARTICLE 5: PROHIBITED USES AND RESTRICTIONS",
          sections: [
            {
              heading: "5.1 Public AI Model Training",
              text: "Licensee shall not upload or feed the Archived Fragment or stems into public generative artificial intelligence platforms or machine-learning datasets for the purpose of creating open-source voice clones or standalone automated music generators."
            },
            {
              heading: "5.2 Rights Limited to Executed Terms",
              text: "Rights transfer only as expressly stated in this executed Agreement and attached schedules."
            }
          ]
        },
        {
          title: "ARTICLE 6: GOVERNING LAW AND LEGAL PROVISIONS",
          sections: [
            {
              heading: "6.1 Governing Law & Jurisdiction",
              text: "This Agreement is governed by and construed in accordance with the laws of the State of Georgia, USA. Any legal disputes arising under this Agreement shall be resolved exclusively in the state or federal courts located in Georgia."
            }
          ]
        }
      ]
    };
  }

  // Default: Archive Access Tier ($150)
  return {
    agreementTitle: "ARCHIVE ACCESS LICENSE AGREEMENT",
    contractVersion: "v1.0-2026",
    importantNotice: [
      "This Agreement grants limited, non-exclusive commercial rights to incorporate the identified Archived Fragment into one original musical release.",
      "This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, its original master recording, The Owl Clock archive entry, or any related intellectual property.",
      "The Licensed Fragment may remain available for licensing to other parties unless it is subsequently removed from the Archive or acquired under a separate exclusive agreement."
    ],
    articles: [
      {
        title: "ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE",
        sections: [
          {
            heading: "1.1 Parties",
            text: "This Archive Access License Agreement (\"Agreement\") is entered into between LOMON LLC, a Georgia limited liability company operating through The Owl Clock (\"Licensor\"), and the individual or legal entity identified in the purchase record and Schedule A (\"Licensee\")."
          },
          {
            heading: "1.2 Licensed Transaction",
            text: "This Agreement governs the Licensee's purchase of an Archive Access License for the Archived Fragment identified in Schedule A. The license fee for this tier is one hundred fifty United States dollars (USD $150.00), excluding applicable taxes or processing charges. The license becomes effective only upon:\na. successful completion and confirmation of payment;\nb. provision of accurate Licensee legal information;\nc. formal identification of the Licensed Fragment; and\nd. acceptance of this Agreement by the Licensee."
          },
          {
            heading: "1.3 Acceptance & Electronic Execution",
            text: "The Licensee accepts and agrees to be bound by this Agreement by completing the purchase transaction, selecting an electronic acceptance checkbox, applying a digital signature, downloading the Licensed Materials, or commercially exploiting the Licensed Fragment."
          }
        ]
      },
      {
        title: "ARTICLE 2: DEFINITIONS",
        sections: [
          {
            heading: "2.1 \"Archive\"",
            text: "\"Archive\" means The Owl Clock system, timestamps, metadata, and files."
          },
          {
            heading: "2.2 \"Archived Fragment\"",
            text: "\"Archived Fragment\" means the specific audio fragment identified in Schedule A."
          },
          {
            heading: "2.3 \"Composition\"",
            text: "\"Composition\" means the underlying musical work embodied in the Archived Fragment."
          },
          {
            heading: "2.4 \"Original Master\"",
            text: "\"Original Master\" means the sound recording owned exclusively by Licensor."
          },
          {
            heading: "2.5 \"Licensed Materials\"",
            text: "\"Licensed Materials\" means the high-resolution WAV file, Tagged Reference MP3, Clearance Certificate, and Executed Agreement delivered under this tier."
          },
          {
            heading: "2.6 \"Licensed Project\"",
            text: "\"Licensed Project\" means one new original song created by Licensee incorporating the Archived Fragment (\"New Song\")."
          }
        ]
      },
      {
        title: "ARTICLE 3: GRANT OF LICENSE & LIMITS",
        sections: [
          {
            heading: "3.1 Conditional Grant",
            text: "Subject to full payment, Licensor grants Licensee a worldwide, non-exclusive, non-transferable license to incorporate the Archived Fragment into one Licensed Project."
          },
          {
            heading: "3.2 Commercial Scope & Streaming Caps",
            text: "Commercial distribution under this Archive Access License is capped strictly at:\n• Digital Audio Streams: Up to 100,000 cumulative streams.\n• Physical & Digital Sales: Up to 2,000 units sold.\nExceeding these thresholds requires upgrading to a higher license tier (Commercial Release or Commercial Exploitation) prior to continued distribution."
          }
        ]
      },
      {
        title: "ARTICLE 4: PUBLISHING SPLITS AND MASTER OWNERSHIP",
        sections: [
          {
            heading: "4.1 Master Ownership",
            text: "LOMON LLC retains 100% Master Ownership of the sound recording embodied in the Archived Fragment. Licensee acquires no master ownership."
          },
          {
            heading: "4.2 Publishing & Composition Splits",
            text: "The underlying Composition of the Archived Fragment shall be allocated as follows for registration and royalty administration purposes:\n• Writer Share: 50% LOMON LLC / 50% Licensee (or Licensee's writers).\n• Publisher Share: 50% LOMON LLC / 50% Licensee's publisher."
          }
        ]
      },
      {
        title: "ARTICLE 5: RESTRICTIONS",
        sections: [
          {
            heading: "5.1 Content ID Prohibition",
            text: "Licensee shall not register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform."
          },
          {
            heading: "5.2 AI Dataset & Voice Cloning Prohibition",
            text: "Licensee shall not upload or feed the Archived Fragment into any Artificial Intelligence System, generative model, voice-cloning tool, or training dataset."
          }
        ]
      },
      {
        title: "ARTICLE 6: METADATA & CREDITS",
        sections: [
          {
            heading: "6.1 Mandatory Credit",
            text: "Credit must appear in all metadata, digital liner notes, and streaming descriptions as:\n\"Contains elements of '[Fragment Title]' provided by The Owl Clock / LOMON LLC.\" or \"Produced by CHRISTOPHER\""
          }
        ]
      },
      {
        title: "ARTICLE 7: GOVERNING LAW",
        sections: [
          {
            heading: "7.1 Governing Law & Jurisdiction",
            text: "This Agreement is governed by the laws of the State of Georgia, USA, without regard to conflict of law principles. Exclusive jurisdiction lies within state or federal courts in Georgia."
          }
        ]
      }
    ]
  };
}

/**
 * Generates the complete agreement text including dynamic Schedules A and B.
 */
export function generateFullAgreementText(data: LicenseAgreementData): string {
  const schedA = getScheduleAData(data);
  const schedB = getScheduleBData(data);
  const tierInfo = getLegalArticlesForTier(data.licenseTierId || data.price || "access");

  let out = `THE OWL CLOCK\n${tierInfo.agreementTitle}\nFIRST EDITION\n\n`;
  out += `Issued by:\nLOMON LLC\nA Georgia Limited Liability Company\nOperating through THE OWL CLOCK\n\n`;
  out += `License Tier: ${schedA.licenseTier}\nLicense Fee: ${schedA.licenseFee}\n\n`;
  out += `• ARCHIVE LICENSE NUMBER: ${schedA.licenseId}\n`;
  out += `• TRANSACTION REFERENCE: ${schedA.transactionRef}\n`;
  out += `• PURCHASE DATE: ${schedA.purchaseDate}\n`;
  out += `• LICENSEE: ${schedA.licenseeLegalName}\n`;
  out += `• LICENSED FRAGMENT: ${schedA.licensedFragmentTitle}\n`;
  out += `• ARCHIVE IDENTIFIER: ${schedA.archiveIdentifier}\n\n`;

  out += `================================================================================\n`;
  out += `IMPORTANT LICENSE NOTICE\n`;
  out += `================================================================================\n`;
  out += tierInfo.importantNotice.join("\n\n") + `\n\n`;

  for (const article of tierInfo.articles) {
    out += `================================================================================\n`;
    out += `${article.title}\n`;
    out += `================================================================================\n`;
    for (const section of article.sections) {
      out += `\n${section.heading}\n${section.text}\n`;
    }
    out += `\n`;
  }

  out += `================================================================================\n`;
  out += `SCHEDULE A: TRANSACTION & ASSET DETAILS\n`;
  out += `================================================================================\n`;
  out += `• Licensor: ${schedA.licensor}\n`;
  out += `• Licensee Legal Name: ${schedA.licenseeLegalName}\n`;
  out += `• Licensed Fragment Title: ${schedA.licensedFragmentTitle}\n`;
  out += `• Archive Identifier: ${schedA.archiveIdentifier}\n`;
  out += `• License Tier: ${schedA.licenseTier}\n`;
  out += `• Delivery Package: ${schedA.deliveryPackage}\n`;
  if (schedA.catalogStatus) {
    out += `• Catalog Status: ${schedA.catalogStatus}\n`;
  }
  out += `• Permitted Scope:\n${schedA.permittedScope.map(s => `  - ${s}`).join("\n")}\n`;
  out += `• Purchase Date: ${schedA.purchaseDate}\n`;
  out += `• Archive License Number: ${schedA.licenseId}\n`;
  out += `• Transaction Reference: ${schedA.transactionRef}\n`;
  out += `• License Fee: ${schedA.licenseFee}\n\n`;

  out += `================================================================================\n`;
  out += `SCHEDULE B: OWNERSHIP, PRO & PUBLISHING SPLITS\n`;
  out += `================================================================================\n`;
  out += `• Licensor Legal Entity: ${schedB.licensorEntity}\n`;
  out += `• Master Ownership: ${schedB.masterOwnership}\n`;
  out += `• Publishing Split: ${schedB.publishingShare}\n`;
  out += `• Writer Split: ${schedB.writerShare}\n`;
  out += `• Content ID Registration: ${schedB.contentIdRegistration}\n`;
  out += `• Exclusivity: ${schedB.exclusivity}\n`;
  out += `• Licensor PRO: ${schedB.licensorPro}\n`;
  out += `• Licensor Writer Name: ${schedB.licensorWriterName} (IPI: ${schedB.licensorWriterIpi})\n`;
  out += `• Licensor Publisher Name: ${schedB.licensorPublisherName} (IPI: ${schedB.licensorPublisherIpi})\n`;
  out += `• Contract Version: ${schedB.contractVersion}\n\n`;

  out += `================================================================================\n`;
  out += `DIGITAL EXECUTION & AUTHENTICATION\n`;
  out += `================================================================================\n`;
  out += `Executed automatically upon confirmed transaction reference ${schedA.transactionRef}.\n`;
  out += `Digitally sealed and registered in LOMON LLC Archive System.\n`;
  out += `Atlanta, Georgia • © 2026 LOMON LLC. All Rights Reserved.`;

  return out;
}

/**
 * Renders HTML for viewing or printing the agreement as a formal document matching the official PDF.
 */
export function generateAgreementHTML(data: LicenseAgreementData): string {
  const schedA = getScheduleAData(data);
  const schedB = getScheduleBData(data);
  const tierInfo = getLegalArticlesForTier(data.licenseTierId || data.price || "access");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${tierInfo.agreementTitle} — ${schedA.licenseId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #050505;
      color: #E2DFD2;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.65;
      font-size: 13px;
    }
    
    .agreement-card {
      max-width: 860px;
      margin: 0 auto;
      background: #0d0d0d;
      border: 1px solid #222;
      padding: 55px 60px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.9);
      position: relative;
    }
    
    .header-logo {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #FFFFFF;
      border-bottom: 2px solid #222;
      padding-bottom: 18px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      background: #141414;
      border: 1px solid #333;
      padding: 4px 10px;
      color: #00E676;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 21px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 4px;
      font-weight: 800;
    }
    
    .edition {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      letter-spacing: 0.2em;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 25px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      background: #121212;
      border: 1px solid #222;
      padding: 20px 24px;
      margin-bottom: 30px;
    }
    
    .info-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      letter-spacing: 0.15em;
      color: #777;
      text-transform: uppercase;
    }
    
    .info-value {
      font-weight: 600;
      color: #FFF;
      margin-top: 3px;
      font-size: 13px;
    }
    
    .notice-box {
      border-left: 3px solid #D9D6CA;
      background: #141414;
      padding: 18px 22px;
      font-size: 12.5px;
      color: #C8C5BA;
      margin-bottom: 35px;
      line-height: 1.7;
    }
    
    .notice-box strong {
      color: #FFF;
      letter-spacing: 0.05em;
    }
    
    .article-block {
      margin-bottom: 28px;
    }
    
    .article-title {
      font-family: 'Cinzel', serif;
      font-size: 13.5px;
      letter-spacing: 0.15em;
      color: #FFFFFF;
      border-bottom: 1px solid #222;
      padding-bottom: 8px;
      margin-top: 32px;
      margin-bottom: 14px;
      text-transform: uppercase;
      font-weight: 700;
    }
    
    .section-item {
      margin-bottom: 14px;
    }
    
    .section-heading {
      font-weight: 700;
      color: #E2DFD2;
      margin-bottom: 4px;
      font-size: 12.5px;
    }
    
    .section-text {
      color: #A09E96;
      font-size: 12px;
      white-space: pre-line;
      line-height: 1.65;
    }
    
    table.schedule-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 25px;
      font-size: 12px;
    }
    
    table.schedule-table th, table.schedule-table td {
      border: 1px solid #222;
      padding: 12px 16px;
      text-align: left;
    }
    
    table.schedule-table th {
      background-color: #161616;
      color: #AAA;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }
    
    table.schedule-table td.label-col {
      width: 35%;
      color: #888;
      font-weight: 500;
      background: #111;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
    }
    
    table.schedule-table td.val-col {
      color: #FFF;
      font-weight: 600;
    }
    
    ul.scope-list {
      margin: 0;
      padding-left: 18px;
    }
    
    ul.scope-list li {
      margin-bottom: 5px;
      color: #CCC;
    }
    
    .footer-seal {
      margin-top: 50px;
      border-top: 1px solid #222;
      padding-top: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #666;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #D9D6CA;
      color: #000;
      border: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 10px 18px;
      cursor: pointer;
      border-radius: 3px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #FFF;
    }
    
    @media print {
      body { background-color: #FFF; color: #000; padding: 0; }
      .agreement-card { border: none; box-shadow: none; background: #FFF; color: #000; width: 100%; max-width: 100%; padding: 15px; }
      .header-logo, h1, .article-title { color: #000; border-color: #CCC; }
      .info-grid, table.schedule-table th, table.schedule-table td { background: #F9F9F9; color: #000; border-color: #DDD; }
      .notice-box { background: #F0F0F0; border-color: #000; color: #333; }
      .info-value, table.schedule-table td.val-col, .section-heading { color: #000; }
      .section-text, ul.scope-list li { color: #333; }
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">PRINT / SAVE AS PDF</button>

  <div class="agreement-card">
    <div class="header-logo">
      <div>THE OWL CLOCK</div>
      <div class="badge">OFFICIAL EXECUTION</div>
    </div>

    <h1>${tierInfo.agreementTitle}</h1>
    <div class="edition">FIRST EDITION — ISSUED BY LOMON LLC (GEORGIA, USA)</div>

    <div class="info-grid">
      <div>
        <div class="info-label">Archive License Number</div>
        <div class="info-value">${schedA.licenseId}</div>
      </div>
      <div>
        <div class="info-label">Transaction Reference</div>
        <div class="info-value">${schedA.transactionRef}</div>
      </div>
      <div>
        <div class="info-label">Purchase Date</div>
        <div class="info-value">${schedA.purchaseDate}</div>
      </div>
      <div>
        <div class="info-label">Licensee Legal Name</div>
        <div class="info-value">${schedA.licenseeLegalName}</div>
      </div>
      <div>
        <div class="info-label">Licensed Fragment</div>
        <div class="info-value">${schedA.licensedFragmentTitle}</div>
      </div>
      <div>
        <div class="info-label">Archive Identifier</div>
        <div class="info-value">${schedA.archiveIdentifier}</div>
      </div>
    </div>

    <div class="notice-box">
      <strong>IMPORTANT LICENSE NOTICE:</strong>
      ${tierInfo.importantNotice.map(n => `<p style="margin: 6px 0 0 0;">${n}</p>`).join("")}
    </div>

    ${tierInfo.articles.map(art => `
      <div class="article-block">
        <div class="article-title">${art.title}</div>
        ${art.sections.map(sec => `
          <div class="section-item">
            <div class="section-heading">${sec.heading}</div>
            <div class="section-text">${sec.text}</div>
          </div>
        `).join("")}
      </div>
    `).join("")}

    <div class="article-title">SCHEDULE A: TRANSACTION & ASSET DETAILS</div>
    <table class="schedule-table">
      <tr>
        <td class="label-col">Licensor Legal Entity</td>
        <td class="val-col">${schedA.licensor}</td>
      </tr>
      <tr>
        <td class="label-col">Licensee Legal Name</td>
        <td class="val-col">${schedA.licenseeLegalName}</td>
      </tr>
      <tr>
        <td class="label-col">Licensed Fragment Title</td>
        <td class="val-col">${schedA.licensedFragmentTitle}</td>
      </tr>
      <tr>
        <td class="label-col">Archive Identifier</td>
        <td class="val-col">${schedA.archiveIdentifier}</td>
      </tr>
      <tr>
        <td class="label-col">License Tier</td>
        <td class="val-col">${schedA.licenseTier}</td>
      </tr>
      <tr>
        <td class="label-col">Delivery Package</td>
        <td class="val-col">${schedA.deliveryPackage}</td>
      </tr>
      ${schedA.catalogStatus ? `
      <tr>
        <td class="label-col">Catalog Status</td>
        <td class="val-col">${schedA.catalogStatus}</td>
      </tr>
      ` : ""}
      <tr>
        <td class="label-col">Permitted Scope</td>
        <td class="val-col">
          <ul class="scope-list">
            ${schedA.permittedScope.map(s => `<li>${s}</li>`).join("")}
          </ul>
        </td>
      </tr>
      <tr>
        <td class="label-col">Purchase Date</td>
        <td class="val-col">${schedA.purchaseDate}</td>
      </tr>
      <tr>
        <td class="label-col">License ID</td>
        <td class="val-col">${schedA.licenseId}</td>
      </tr>
      <tr>
        <td class="label-col">License Fee</td>
        <td class="val-col">${schedA.licenseFee}</td>
      </tr>
    </table>

    <div class="article-title">SCHEDULE B: OWNERSHIP, PRO & PUBLISHING SPLITS</div>
    <table class="schedule-table">
      <tr>
        <td class="label-col">Licensor Legal Entity</td>
        <td class="val-col">${schedB.licensorEntity}</td>
      </tr>
      <tr>
        <td class="label-col">Master Ownership</td>
        <td class="val-col">${schedB.masterOwnership}</td>
      </tr>
      <tr>
        <td class="label-col">Publishing Split</td>
        <td class="val-col">${schedB.publishingShare}</td>
      </tr>
      <tr>
        <td class="label-col">Writer Split</td>
        <td class="val-col">${schedB.writerShare}</td>
      </tr>
      <tr>
        <td class="label-col">Content ID Registration</td>
        <td class="val-col">${schedB.contentIdRegistration}</td>
      </tr>
      <tr>
        <td class="label-col">Exclusivity</td>
        <td class="val-col">${schedB.exclusivity}</td>
      </tr>
      <tr>
        <td class="label-col">Licensor PRO</td>
        <td class="val-col">${schedB.licensorPro}</td>
      </tr>
      <tr>
        <td class="label-col">Licensor Writer Name & IPI</td>
        <td class="val-col">${schedB.licensorWriterName} &bull; IPI: ${schedB.licensorWriterIpi}</td>
      </tr>
      <tr>
        <td class="label-col">Licensor Publisher Name & IPI</td>
        <td class="val-col">${schedB.licensorPublisherName} &bull; IPI: ${schedB.licensorPublisherIpi}</td>
      </tr>
      <tr>
        <td class="label-col">Contract Version</td>
        <td class="val-col">${schedB.contractVersion}</td>
      </tr>
    </table>

    <div class="footer-seal">
      <div>LOMON LLC • ATLANTA, GEORGIA</div>
      <div>DIGITALLY REGISTERED & SECURED</div>
      <div>© 2026 LOMON LLC</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates an official, publication-grade multi-page PDF license agreement.
 */
export function generateLicenseAgreementPDF(data: LicenseAgreementData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNumber = 1;

  const tier = normalizeTierId(data.licenseTierId);
  const legalData = getLegalArticlesForTier(tier);
  const scheduleA = getScheduleAData(data);
  const scheduleB = getScheduleBData(data);

  const drawPageHeader = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, 12, margin + contentWidth, 12);

    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text("THE OWL CLOCK ARCHIVE • LOMON LLC", margin, 10);

    const rightText = `ARCHIVE ID: ${data.archiveIdentifier || "TOC-001"} • LICENSE ID: ${data.licenseId || "TOC-LIC"}`;
    doc.text(rightText, pageWidth - margin, 10, { align: "right" });
  };

  const drawPageFooter = (num: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      "LOMON LLC • RIGHTS MANAGEMENT & PUBLISHING • ATLANTA, GA • EXECUTABLE LEGAL CONTRACT",
      margin,
      pageHeight - 8.5
    );
    doc.text(`Page ${num}`, pageWidth - margin, pageHeight - 8.5, { align: "right" });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      drawPageFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      y = 16;
      drawPageHeader();
    }
  };

  // Header Banner
  doc.setFillColor(12, 12, 12);
  doc.rect(margin, y, contentWidth, 22, "F");

  doc.setTextColor(245, 245, 240);
  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.text("THE OWL CLOCK ARCHIVE", margin + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text("LOMON LLC • PUBLISHING & RIGHTS MANAGEMENT • ATLANTA, GEORGIA", margin + 6, y + 14);

  // Status Badge
  doc.setFillColor(0, 150, 80);
  doc.rect(margin + contentWidth - 36, y + 6, 30, 6.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("OFFICIAL LICENSE", margin + contentWidth - 34, y + 10.5);

  y += 28;

  // Document Title & Metadata
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.licenseTierTitle || legalData.agreementTitle, margin, y);

  y += 5.5;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(`EFFECTIVE DATE: ${data.purchaseDate || new Date().toLocaleDateString()} | VERSION: ${legalData.contractVersion}`, margin, y);

  y += 4;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // IMPORTANT NOTICE BOX
  if (legalData.importantNotice && legalData.importantNotice.length > 0) {
    const noticeText = legalData.importantNotice.join("\n\n");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const splitNotice = doc.splitTextToSize(noticeText, contentWidth - 8);
    const boxHeight = splitNotice.length * 3.5 + 8;

    checkPageBreak(boxHeight);

    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, contentWidth, boxHeight, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, boxHeight, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text("CRITICAL NOTICE & SUMMARY OF RIGHTS:", margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(60, 60, 60);
    doc.text(splitNotice, margin + 4, y + 9);

    y += boxHeight + 6;
  }

  // Helper for Section Headers
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 6, "S");

    doc.setTextColor(15, 15, 15);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text(title, margin + 3, y + 4.2);
    y += 8;
  };

  const drawTableRow = (col1: string, col2: string, width1 = 55) => {
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);

    const splitCol2 = doc.splitTextToSize(col2, contentWidth - width1 - 4);
    const rowHeight = Math.max(splitCol2.length * 3.5, 4.5);

    checkPageBreak(rowHeight + 2);

    doc.text(col1, margin + 2, y + 3.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(splitCol2, margin + width1, y + 3.2);

    y += rowHeight + 1.5;
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + contentWidth, y);
    y += 1;
  };

  // SCHEDULE A
  drawSectionHeader("SCHEDULE A: KEY TRANSACTION TERMS & LICENSED SCOPE");
  drawTableRow("LICENSOR:", scheduleA.licensor);
  drawTableRow("LICENSEE LEGAL NAME:", scheduleA.licenseeLegalName);
  drawTableRow("LICENSED FRAGMENT:", `${scheduleA.licensedFragmentTitle} (${scheduleA.archiveIdentifier})`);
  drawTableRow("LICENSE TIER:", scheduleA.licenseTier);
  drawTableRow("LICENSE FEE:", scheduleA.licenseFee);
  drawTableRow("TRANSACTION REF:", scheduleA.transactionRef);
  drawTableRow("LICENSE ID:", scheduleA.licenseId);
  drawTableRow("DELIVERY ASSETS:", scheduleA.deliveryPackage);
  if (scheduleA.permittedScope && scheduleA.permittedScope.length > 0) {
    drawTableRow("PERMITTED USES:", scheduleA.permittedScope.join("; "));
  }
  if (data.customCredit) {
    drawTableRow("MANDATORY CREDIT:", data.customCredit);
  }
  if (data.customRestrictions) {
    drawTableRow("RESTRICTIONS:", data.customRestrictions);
  }

  y += 4;

  // SCHEDULE B
  drawSectionHeader("SCHEDULE B: COPYRIGHT OWNERSHIP & ROYALTY SPLIT SCHEDULE");
  drawTableRow("MASTER OWNERSHIP:", scheduleB.masterOwnership);
  drawTableRow("PUBLISHING SHARE:", scheduleB.publishingShare);
  drawTableRow("WRITER SHARE:", scheduleB.writerShare);
  drawTableRow("CONTENT ID / FINGERPRINTING:", scheduleB.contentIdRegistration);
  drawTableRow("EXCLUSIVITY STATUS:", scheduleB.exclusivity);
  drawTableRow("LICENSOR PRO:", `${scheduleB.licensorPro} (IPI: ${scheduleB.licensorWriterIpi})`);
  drawTableRow("LICENSOR WRITER:", `${scheduleB.licensorWriterName} (${scheduleB.licensorPro})`);
  drawTableRow("LICENSOR PUBLISHER:", `${scheduleB.licensorPublisherName} (IPI: ${scheduleB.licensorPublisherIpi})`);

  y += 6;

  // LEGAL ARTICLES
  drawSectionHeader("TERMS & CONDITIONS: OFFICIAL LEGAL ARTICLES");

  for (const article of legalData.articles) {
    checkPageBreak(12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(10, 10, 10);
    doc.text(article.title, margin + 2, y + 4);
    y += 7;

    for (const sec of article.sections) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      const splitHeading = doc.splitTextToSize(sec.heading, contentWidth - 4);
      checkPageBreak(splitHeading.length * 3.5 + 4);
      doc.text(splitHeading, margin + 4, y + 3);
      y += splitHeading.length * 3.5 + 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(50, 50, 50);
      const splitText = doc.splitTextToSize(sec.text, contentWidth - 6);
      checkPageBreak(splitText.length * 3.2 + 4);
      doc.text(splitText, margin + 6, y + 3);
      y += splitText.length * 3.2 + 3.5;
    }
    y += 2;
  }

  // CUSTOM COVENANTS & SPECIAL PROVISIONS (CRUD Support)
  if (data.customClauses && data.customClauses.trim()) {
    checkPageBreak(18);
    drawSectionHeader("SPECIAL COVENANTS & CUSTOM LEGAL PROVISIONS");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    const splitCustom = doc.splitTextToSize(data.customClauses.trim(), contentWidth - 6);
    checkPageBreak(splitCustom.length * 3.5 + 4);
    doc.text(splitCustom, margin + 3, y + 3.5);
    y += splitCustom.length * 3.5 + 6;
  }

  // SIGNATURE BLOCK
  checkPageBreak(45);
  y += 4;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 6, "F");
  doc.setDrawColor(210, 210, 210);
  doc.rect(margin, y, contentWidth, 6, "S");
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text("EXECUTION & SIGNATURE CONFIRMATION", margin + 3, y + 4.2);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("IN WITNESS WHEREOF, the Parties have agreed to and entered into this Agreement as of the Effective Date.", margin + 2, y);
  y += 6;

  const colW = (contentWidth - 6) / 2;

  // Box 1: Licensor
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, colW, 28);
  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text("LICENSOR:", margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text("LOMON LLC (d/b/a The Owl Clock)", margin + 3, y + 9);
  doc.text("By: Christopher Solomon Paul", margin + 3, y + 13);
  doc.text("Title: Managing Member / Executive Producer", margin + 3, y + 17);
  doc.setFont("courier", "normal");
  doc.text("Digital Signature Verification: [EXECUTED - VERIFIED]", margin + 3, y + 23);

  // Box 2: Licensee
  const x2 = margin + colW + 6;
  doc.rect(x2, y, colW, 28);
  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text("LICENSEE:", x2 + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text(`Legal Name: ${data.licenseeLegalName || "Purchaser Entity"}`, x2 + 3, y + 9);
  doc.text(`Email: ${data.licenseeEmail || "Provided Upon Checkout"}`, x2 + 3, y + 13);
  doc.text(`Status: License Granted & Bound`, x2 + 3, y + 17);
  doc.setFont("courier", "normal");
  doc.text(`Transaction ID: ${data.transactionRef || "LMN-TX-VERIFIED"}`, x2 + 3, y + 23);

  y += 32;

  // Draw footer on final page
  drawPageFooter(pageNumber);

  return doc;
}

/**
 * Direct file download for the official license agreement (PDF by default, with HTML or TXT options).
 * Generates high-fidelity PDF documents that can be downloaded and printed directly.
 */
export function downloadLicenseAgreement(data: LicenseAgreementData, format: 'pdf' | 'html' | 'txt' = 'pdf') {
  const cleanId = (data.licenseId || data.archiveIdentifier || "TOC-LIC").replace(/[^a-zA-Z0-9_-]/g, "_");
  const tierName = (data.licenseTierId || "agreement").toLowerCase();
  const filename = `The_Owl_Clock_${cleanId}_${tierName}_License.${format}`;

  if (format === 'pdf') {
    try {
      const doc = generateLicenseAgreementPDF(data);
      doc.save(filename);
      return;
    } catch (err) {
      console.warn("jsPDF license generation error, falling back to HTML", err);
    }
  }

  let content: string;
  let mimeType: string;

  if (format === 'txt') {
    content = getAutofilledAgreementText(data.licenseTierId || "access", data);
    mimeType = "text/plain;charset=utf-8";
  } else {
    content = generateAgreementHTML(data);
    mimeType = "text/html;charset=utf-8";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers direct browser download for the official license agreement in PDF format.
 */
export function openOrDownloadLicenseAgreement(data: LicenseAgreementData) {
  downloadLicenseAgreement(data, 'pdf');
}

// ============================================================================
// OFFICIAL RAW MARKDOWN TEMPLATES WITH PLACEHOLDERS (AS PROVIDED BY LOMON LLC)
// ============================================================================

export const OFFICIAL_LICENSE_CONTRACT_TEMPLATES: Record<string, string> = {
  access: `# THE OWL CLOCK
## ARCHIVE ACCESS LICENSE AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Archive Access License
**License Fee:** USD $150.00
 * **ARCHIVE LICENSE NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **PURCHASE DATE:** {{PURCHASE_DATE}}
 * **LICENSEE LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **LICENSED FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}

### IMPORTANT LICENSE NOTICE
This Agreement grants limited, non-exclusive commercial rights to incorporate the identified Archived Fragment into one original musical release.
This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, its original master recording, The Owl Clock archive entry, or any related intellectual property.
The Licensed Fragment may remain available for licensing to other parties unless it is subsequently removed from the Archive or acquired under a separate exclusive agreement.

### ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE
**1.1 Parties**
This Archive Access License Agreement (“Agreement”) is entered into between **LOMON LLC**, a Georgia limited liability company operating through The Owl Clock (“Licensor”), and the individual or legal entity identified in the purchase record and Schedule A (“Licensee”).

**1.2 Licensed Transaction**
This Agreement governs the Licensee’s purchase of an Archive Access License for the Archived Fragment identified in Schedule A. The license fee for this tier is one hundred fifty United States dollars (USD $150.00), excluding applicable taxes or processing charges. The license becomes effective only upon:
a. successful completion and confirmation of payment;
b. provision of accurate Licensee legal information;
c. formal identification of the Licensed Fragment; and
d. acceptance of this Agreement by the Licensee.

**1.3 Acceptance & Electronic Execution**
The Licensee accepts and agrees to be bound by this Agreement by completing the purchase transaction, selecting an electronic acceptance checkbox, applying a digital signature, downloading the Licensed Materials, or commercially exploiting the Licensed Fragment.

### ARTICLE 2: DEFINITIONS
 * **2.1 “Archive”** means The Owl Clock system, timestamps, metadata, and files.
 * **2.2 “Archived Fragment”** means the specific audio fragment identified in Schedule A.
 * **2.3 “Composition”** means the underlying musical work embodied in the Archived Fragment.
 * **2.4 “Original Master”** means the sound recording owned exclusively by Licensor.
 * **2.5 “Licensed Materials”** means the high-resolution WAV file, Tagged Reference MP3, Clearance Certificate, and Executed Agreement delivered under this tier.
 * **2.6 “Licensed Project”** means one new original song created by Licensee incorporating the Archived Fragment (“New Song”).

### ARTICLE 3: GRANT OF LICENSE & LIMITS
**3.1 Conditional Grant**
Subject to full payment, Licensor grants Licensee a worldwide, non-exclusive, non-transferable license to incorporate the Archived Fragment into one Licensed Project.

**3.2 Commercial Scope & Streaming Caps**
Commercial distribution under this Archive Access License is capped strictly at:
 * **Digital Audio Streams:** Up to 100,000 cumulative streams.
 * **Physical & Digital Sales:** Up to 2,000 units sold.
Exceeding these thresholds requires upgrading to a higher license tier (Commercial Release or Commercial Exploitation) prior to continued distribution.

### ARTICLE 4: PUBLISHING SPLITS AND MASTER OWNERSHIP
**4.1 Master Ownership**
LOMON LLC retains **100% Master Ownership** of the sound recording embodied in the Archived Fragment. Licensee acquires no master ownership.

**4.2 Publishing & Composition Splits**
The underlying Composition of the Archived Fragment shall be allocated as follows for registration and royalty administration purposes:
 * **Writer Share:** 50% LOMON LLC / 50% Licensee (or Licensee's writers).
 * **Publisher Share:** 50% LOMON LLC / 50% Licensee's publisher.

### ARTICLE 5: RESTRICTIONS
**5.1 Content ID Prohibition**
Licensee **shall not** register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform.
**5.2 AI Dataset & Voice Cloning Prohibition**
Licensee **shall not** upload or feed the Archived Fragment into any Artificial Intelligence System, generative model, voice-cloning tool, or training dataset.

### ARTICLE 6: METADATA & CREDITS
**6.1 Mandatory Credit**
Credit must appear in all metadata, digital liner notes, and streaming descriptions as:
> **"Contains elements of '{{FRAGMENT_TITLE}}' provided by The Owl Clock / LOMON LLC."** or **"Produced by CHRISTOPHER"**

### ARTICLE 7: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA, without regard to conflict of law principles. Exclusive jurisdiction lies within state or federal courts in Georgia.

### SCHEDULE A: ASSET DETAILS
 * **Licensor:** LOMON LLC d/b/a The Owl Clock
 * **Licensee Legal Name:** {{LICENSEE_LEGAL_NAME}}
 * **Licensed Fragment Title:** {{FRAGMENT_TITLE}}
 * **Archive Identifier:** {{ARCHIVE_IDENTIFIER}}
 * **License Tier:** Archive Access License ($150.00 USD)
 * **Permitted Scope:** 1 Licensed Project | 100,000 Streams | 2,000 Physical/Digital Units

### SCHEDULE B: OWNERSHIP & SPLITS
 * **Master Ownership:** 100% LOMON LLC
 * **Publishing Split:** 50% LOMON LLC | 50% Licensee
 * **Exclusivity:** Non-Exclusive
 * **Contract Version:** v1.0-2026`,

  release: `# THE OWL CLOCK
## COMMERCIAL RELEASE LICENSE AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Commercial Release License
**License Fee:** USD $500.00
 * **ARCHIVE LICENSE NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **PURCHASE DATE:** {{PURCHASE_DATE}}
 * **LICENSEE LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **LICENSED FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}

### IMPORTANT LICENSE NOTICE
This Agreement grants non-exclusive commercial release rights to incorporate the identified Archived Fragment into one commercial musical release across digital music platforms.
This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, or its original master recording. Master ownership remains 100% with LOMON LLC, and publishing is split 50% Writer / 50% Publisher.

### ARTICLE 1: AGREEMENT, PARTIES AND ACCEPTANCE
**1.1 Parties**
This Commercial Release License Agreement (“Agreement”) is entered into between **LOMON LLC**, operating through The Owl Clock (“Licensor”), and the licensee identified in Schedule A (“Licensee”).

**1.2 Licensed Transaction**
Purchase of a Commercial Release License for five hundred United States dollars (USD $500.00). Effective upon confirmation of payment, provision of accurate legal info, and agreement acceptance.

### ARTICLE 2: GRANT OF LICENSE & RIGHTS
**2.1 Scope of Distribution**
Licensor grants Licensee a worldwide, non-exclusive, non-transferable license to incorporate the Archived Fragment into one Licensed Project and commercially distribute it across Digital Music Services.

**2.2 Streaming & Physical Limits**
Commercial distribution under this Commercial Release License is capped at:
 * **Digital Audio Streams:** Up to 1,000,000 cumulative streams.
 * **Physical & Digital Sales:** Up to 10,000 units sold.
Exceeding these thresholds requires upgrading to Tier 3 (Commercial Exploitation) prior to continued distribution.

**2.3 Promotional Video Rights**
Licensee may use the Licensed Project in connection with artist-controlled social media previews, official lyric videos, and up to one official promotional music video/visualizer. Third-party broadcast or commercial sync placements remain strictly prohibited.

### ARTICLE 3: PUBLISHING SPLITS AND MASTER OWNERSHIP
**3.1 Master Ownership**
LOMON LLC retains **100% Master Ownership** of the sound recording embodied in the Archived Fragment. Licensee owns only the separable Licensee Contribution.

**3.2 Publishing Allocation**
 * **Writer Share:** 50% LOMON LLC / 50% Licensee
 * **Publisher Share:** 50% LOMON LLC / 50% Licensee

### ARTICLE 4: RESTRICTIONS
**4.1 Content ID Prohibition**
Licensee **shall not** register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform.
**4.2 AI Dataset Restriction**
Licensee **shall not** process the Archived Fragment through any Artificial Intelligence System, generative model, or voice-cloning tool.

### ARTICLE 5: METADATA & CREDITS
**5.1 Mandatory Credit**
Credit must appear across all digital distribution platforms, physical packaging, and streaming metadata as:
> **"Produced by CHRISTOPHER / The Owl Clock"** or **"Contains elements of '{{FRAGMENT_TITLE}}' provided by The Owl Clock / LOMON LLC."**

### ARTICLE 6: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA. Exclusive jurisdiction lies within state or federal courts in Georgia.

### SCHEDULE A: TRANSACTION DETAILS
 * **Licensor:** LOMON LLC d/b/a The Owl Clock
 * **Licensee Legal Name:** {{LICENSEE_LEGAL_NAME}}
 * **Licensed Fragment Title:** {{FRAGMENT_TITLE}}
 * **Archive Identifier:** {{ARCHIVE_IDENTIFIER}}
 * **License Tier:** Commercial Release License ($500.00 USD)
 * **Permitted Scope:** 1 Licensed Project | 1,000,000 Streams | 10,000 Physical/Digital Units

### SCHEDULE B: OWNERSHIP & SPLITS
 * **Master Ownership:** 100% LOMON LLC
 * **Publishing Split:** 50% LOMON LLC | 50% Licensee
 * **Exclusivity:** Non-Exclusive
 * **Contract Version:** v1.2-2026`,

  commercial: `# THE OWL CLOCK
## COMMERCIAL EXPLOITATION LICENSE AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Commercial Exploitation License
**License Fee:** USD $1,000.00
 * **ARCHIVE LICENSE NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **PURCHASE DATE:** {{PURCHASE_DATE}}
 * **LICENSEE LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **LICENSED FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}

### IMPORTANT LICENSE NOTICE
This Agreement grants non-exclusive, unlimited commercial exploitation rights to incorporate the identified Archived Fragment into one professional musical release across all commercial channels.
This tier includes full Production Stems and High-Resolution WAV files.
Master ownership remains 100% with LOMON LLC, and publishing is split 50% Writer / 50% Publisher.

### ARTICLE 1: AGREEMENT & GRANT OF EXPLOITATION RIGHTS
**1.1 Grant of Rights**
Licensor grants Licensee a worldwide, perpetual, non-exclusive, non-transferable license to incorporate the Archived Fragment into one Licensed Project and commercially exploit, distribute, perform, and monetize it without streaming limits.

**1.2 Permitted Production & Stems Usage**
Licensee may utilize the delivered Production Stems to alter, manipulate, chop, re-arrange, mix, master, adjust tempo/key, and incorporate original vocals or instrumentation.

**1.3 Unlimited Streaming & Distribution**
Licensee is granted **unlimited audio streams** and **unlimited physical/digital sales** across all Digital Music Services and commercial retail channels.

**1.4 Monetized Video & Live Performance**
Licensee is authorized to use the Licensed Project in monetized video content (YouTube, TikTok, Instagram) and public live concert venue tours and festivals.

### ARTICLE 2: PUBLISHING SPLITS AND MASTER OWNERSHIP
**2.1 Master Ownership**
LOMON LLC retains **100% Master Ownership** of the sound recording embodied in the Archived Fragment and its underlying stems. Licensee owns only the separable Licensee Contribution.

**2.2 Publishing Allocation**
 * **Writer Share:** 50% LOMON LLC / 50% Licensee
 * **Publisher Share:** 50% LOMON LLC / 50% Licensee

### ARTICLE 3: RESTRICTIONS
**3.1 Content ID Prohibition**
Licensee **shall not** register or upload the Licensed Project or Archived Fragment into YouTube Content ID, Meta Rights Manager, SoundExchange, or any automated copyright fingerprinting platform.
**3.2 AI Prohibition**
Licensee **shall not** process the Archived Fragment through any Artificial Intelligence System, generative model, or voice-cloning tool.

### ARTICLE 4: METADATA & CREDITS
**4.1 Mandatory Credit**
Credit must appear across all digital distribution platforms, physical packaging, and streaming metadata as:
> **"Produced by CHRISTOPHER / The Owl Clock"** or **"Contains elements of '{{FRAGMENT_TITLE}}' provided by The Owl Clock / LOMON LLC."**

### ARTICLE 5: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA. Exclusive jurisdiction lies within state or federal courts in Georgia.

### SCHEDULE A: TRANSACTION DETAILS
 * **Licensor:** LOMON LLC d/b/a The Owl Clock
 * **Licensee Legal Name:** {{LICENSEE_LEGAL_NAME}}
 * **Licensed Fragment Title:** {{FRAGMENT_TITLE}}
 * **Archive Identifier:** {{ARCHIVE_IDENTIFIER}}
 * **License Tier:** Commercial Exploitation License ($1,000.00 USD)
 * **Delivery Package:** High-Resolution WAV, Production Stems, Metadata Package, Clearance Certificate
 * **Permitted Scope:** 1 Licensed Project | Unlimited Streams | Unlimited Sales | Full Stems Exploitation

### SCHEDULE B: OWNERSHIP & SPLITS
 * **Master Ownership:** 100% LOMON LLC
 * **Publishing Split:** 50% LOMON LLC | 50% Licensee
 * **Exclusivity:** Non-Exclusive
 * **Contract Version:** v1.5-2026`,

  exclusive: `# THE OWL CLOCK
## EXCLUSIVE ARCHIVE ACQUISITION LICENSE AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Exclusive Archive Acquisition
**License Fee:** USD \${{ACQUISITION_FEE_AMOUNT}} (Min. $5,000.00)
 * **ARCHIVE LICENSE NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **PURCHASE DATE:** {{PURCHASE_DATE}}
 * **LICENSEE LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **LICENSED FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}
 * **ENTITY CLASSIFICATION:** {{ENTITY_TYPE_LABEL_OR_INDIE}}

### IMPORTANT LICENSE NOTICE
This Agreement grants 100% exclusive commercial rights and catalog removal for the identified Archived Fragment. Upon execution, the Licensed Fragment is permanently retired and removed from future public licensing by The Owl Clock.
Prior lawfully issued non-exclusive licenses remain valid and in effect under their existing terms.

### ARTICLE 1: GRANT OF EXCLUSIVE RIGHTS & CATALOG RETIREMENT
**1.1 Exclusive Grant**
Licensor grants Licensee a worldwide, perpetual, 100% exclusive right to incorporate, exploit, modify, perform, distribute, and monetize the Archived Fragment across all media platforms.

**1.2 Catalog Retirement**
Upon execution and full payment, Licensor permanently removes the Archived Fragment from public availability on The Owl Clock and ceases all future licensing to third parties.

**1.3 Stems & Full Production Files**
Licensee receives unrestricted access to all delivered Full Production Files and Production Stems.

**1.4 Prior Non-Exclusive Licenses**
Licensee acknowledges that any non-exclusive licenses lawfully issued prior to the execution date of this Agreement remain valid and active.

### ARTICLE 2: MASTER ROYALTY POINTS & PUBLISHING ALLOCATION
**2.1 Structure Selection**
Per Schedule B, Master Ownership is transferred/assigned to Licensee subject to retained producer royalty points (default 4 points) or revenue splits, with Composition Publishing allocated 50% LOMON LLC / 50% Licensee.

### ARTICLE 3: CONTENT ID & AI RESTRICTIONS
**3.1 Content ID Registration**
As exclusive owner/licensee, Licensee is permitted to register the Licensed Project into automated Content Identification Systems, provided pre-existing non-exclusive licenses are respected.
**3.2 Public AI Restriction**
Commercial open-source training of public generative AI voice clones remains strictly restricted.

### ARTICLE 4: METADATA & CREDITS
**4.1 Mandatory Credit**
Credit shall be formatted as:
> **"Produced by CHRISTOPHER"** or **"Contains elements created by CHRISTOPHER / The Owl Clock"**

### ARTICLE 5: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA. Exclusive jurisdiction lies within state or federal courts in Georgia.

### SCHEDULE A: TRANSACTION & ASSET DETAILS
 * **Licensor:** LOMON LLC d/b/a The Owl Clock
 * **Licensee Legal Name:** {{LICENSEE_LEGAL_NAME}}
 * **Licensed Fragment Title:** {{FRAGMENT_TITLE}}
 * **Archive Identifier:** {{ARCHIVE_IDENTIFIER}}
 * **License Tier:** Exclusive Archive Acquisition ($5,000.00+ USD)
 * **Catalog Status:** Retired & Permanently Removed from Archive

### SCHEDULE B: EXECUTED DEAL TERMS
 * **Deal Architecture:** {{DEAL_ARCHITECTURE_TYPE}}
 * **Master Terms:** {{EXECUTED_MASTER_TERMS}}
 * **Publishing Split:** {{LOMON_PUBLISHING_SHARE}}% LOMON LLC | {{LICENSEE_PUBLISHING_SHARE}}% Licensee
 * **Exclusivity:** 100% Exclusive Acquisition & Catalog Retirement
 * **Contract Version:** v3.0-2026`,

  collaboration: `# THE OWL CLOCK
## PRODUCER COLLABORATION AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Producer Collaboration (Backend Split Model)
**Upfront Fee:** USD $0.00
 * **AGREEMENT NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **AGREEMENT DATE:** {{AGREEMENT_DATE}}
 * **COLLABORATOR LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **COLLABORATION FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}

### IMPORTANT AGREEMENT NOTICE
This Agreement establishes a collaborative production partnership for the development and commercial release of one original musical work. In lieu of an upfront licensing fee, the Parties establish a backend revenue participation and master/publishing co-ownership structure.

### ARTICLE 1: COLLABORATIVE RIGHTS & PRODUCTION
**1.1 Collaborative Grant**
Licensor delivers full stems and master audio to Collaborator for songwriting, vocal recording, mixing, and collaborative finalization.
**1.2 Commercial Exploitation**
Commercial release is permitted across all major digital music streaming platforms upon joint sign-off of the completed master.

### ARTICLE 2: MASTER REVENUE & PUBLISHING SPLITS
**2.1 Master Ownership & Revenue**
Master ownership and net master distribution earnings are allocated:
 * **LOMON LLC:** {{LOMON_MASTER_SPLIT}}%
 * **Collaborator:** {{COLLABORATOR_MASTER_SPLIT}}%

**2.2 Composition & Publishing Allocation**
 * **Writer Share:** 50% LOMON LLC / 50% Collaborator
 * **Publisher Share:** 50% LOMON LLC / 50% Collaborator

### ARTICLE 3: RESTRICTIONS
**3.1 Content ID**
Content ID claiming must be jointly coordinated to avoid unauthorized copyright strikes.
**3.2 AI Prohibition**
No training of public generative AI voice models is permitted.

### ARTICLE 4: METADATA & CREDITS
**4.1 Mandatory Credit**
Production credit must appear in all metadata and track listings as:
> **"[Song Title] (prod. CHRISTOPHER)"** or **"Produced by CHRISTOPHER / The Owl Clock"**

### ARTICLE 5: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA.

### SCHEDULE A & B: COLLABORATION TERMS
 * **Upfront License Fee:** $0.00 USD
 * **Master Split:** {{LOMON_MASTER_SPLIT}}% LOMON LLC | {{COLLABORATOR_MASTER_SPLIT}}% Collaborator
 * **Publishing Split:** 50% LOMON LLC | 50% Collaborator
 * **Contract Version:** v1.0-2026`,

  sync: `# THE OWL CLOCK
## SYNCHRONIZATION & MASTER LICENSE AGREEMENT
**Issued by:**
**LOMON LLC**
A Georgia Limited Liability Company
Operating through **THE OWL CLOCK**

**License Tier:** Synchronization & Master License
**Sync License Fee:** USD \${{SYNC_FEE_AMOUNT}}
 * **ARCHIVE LICENSE NUMBER:** {{LICENSE_NUMBER}}
 * **TRANSACTION REFERENCE:** {{TRANSACTION_ID}}
 * **EFFECTIVE DATE:** {{EFFECTIVE_DATE}}
 * **LICENSEE LEGAL NAME:** {{LICENSEE_LEGAL_NAME}}
 * **LICENSED FRAGMENT TITLE:** {{FRAGMENT_TITLE}}
 * **ARCHIVE IDENTIFIER:** {{ARCHIVE_IDENTIFIER}}
 * **DESIGNATED MEDIA PROJECT:** {{MEDIA_PROJECT_TITLE}}

### IMPORTANT LICENSE NOTICE
This Agreement grants one-stop synchronization and master synchronization rights to integrate the identified Archived Fragment into one designated visual media production across approved territories and terms.

### ARTICLE 1: GRANT OF SYNCHRONIZATION RIGHTS
**1.1 Master & Synchronization Grant**
Licensor grants Licensee the non-exclusive right to synchronize and record the Archived Fragment in timed relation with the visual elements of the Designated Media Project.
**1.2 Approved Media & Scope**
Approved Media Types: {{APPROVED_MEDIA_TYPES}}
Approved Territory: {{APPROVED_TERRITORY}}
Approved Term: {{APPROVED_TERM}}

### ARTICLE 2: RESERVATION OF RIGHTS & CUE SHEETS
**2.1 Public Performance**
Performance royalties are administered through PROs; Licensee shall timely file music cue sheets reflecting Licensor's 100% BMI writer and publisher credits.

### ARTICLE 3: METADATA & CREDITS
**3.1 Screen Credits**
Credit shall appear in rolling end credits as:
> **"Music by CHRISTOPHER / Courtesy of LOMON LLC / The Owl Clock"**

### ARTICLE 4: GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia, USA.

### SCHEDULE A: SYNCHRONIZATION SCHEDULE
 * **Designated Project:** {{MEDIA_PROJECT_TITLE}}
 * **Approved Media:** {{APPROVED_MEDIA_TYPES}}
 * **Territory:** {{APPROVED_TERRITORY}}
 * **Term:** {{APPROVED_TERM}}
 * **One-Stop Fee:** USD \${{SYNC_FEE_AMOUNT}}
 * **Contract Version:** v1.0-2026`
};

/**
 * Replaces all {{PLACEHOLDER}} tags in templateText with data or sensible defaults.
 */
export function autofillAgreementTemplate(
  templateText: string,
  data: Partial<LicenseAgreementData> & Record<string, any>
): string {
  const purchaseDate = data.purchaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fragmentTitle = data.fragmentTitle || "Archived Fragment";
  let archiveId = data.archiveIdentifier || "TOC-001";
  if (!archiveId.startsWith("TOC-")) {
    archiveId = `TOC-${archiveId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-001`;
  }
  const licenseNumber = data.licenseId || `TOC-LIC-${Date.now().toString().slice(-8)}`;
  const transactionId = data.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const licenseeName = data.licenseeLegalName || "VALUED LICENSEE / PENDING ASSIGNMENT";

  const replacements: Record<string, string> = {
    "{{LICENSE_NUMBER}}": licenseNumber,
    "{{TRANSACTION_ID}}": transactionId,
    "{{PURCHASE_DATE}}": purchaseDate,
    "{{AGREEMENT_DATE}}": purchaseDate,
    "{{EFFECTIVE_DATE}}": purchaseDate,
    "{{LICENSEE_LEGAL_NAME}}": licenseeName,
    "{{FRAGMENT_TITLE}}": fragmentTitle,
    "{{ARCHIVE_IDENTIFIER}}": archiveId,
    "{{ENTITY_TYPE_LABEL_OR_INDIE}}": data.entityType || "Major Label / Independent Release Entity",
    "{{ACQUISITION_FEE_AMOUNT}}": data.acquisitionFee || (typeof data.price === "number" ? data.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "5,000.00"),
    "{{PRODUCER_ROYALTY_POINTS}}": data.producerRoyaltyPoints || "4.0",
    "{{LOMON_PUBLISHING_SHARE}}": "50",
    "{{LICENSEE_PUBLISHING_SHARE}}": "50",
    "{{MASTER_REVENUE_SPLIT}}": data.masterRevenueSplit || "20",
    "{{DEAL_ARCHITECTURE_TYPE}}": data.dealArchitectureType || "Catalog Retirement & Exclusive Acquisition",
    "{{EXECUTED_MASTER_TERMS}}": data.executedMasterTerms || "100% Exclusive Master Ownership assigned to Licensee subject to retained 4% Producer Royalty Points and 50/50 Publishing Split",
    "{{LOMON_MASTER_SPLIT}}": data.lomonMasterSplit || "50",
    "{{COLLABORATOR_MASTER_SPLIT}}": data.collaboratorMasterSplit || "50",
    "{{SYNC_FEE_AMOUNT}}": data.syncFeeAmount || (typeof data.price === "number" && data.price > 0 ? data.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "1,500.00"),
    "{{MEDIA_PROJECT_TITLE}}": data.mediaProjectTitle || "Designated Media Production",
    "{{APPROVED_TERRITORY}}": data.approvedTerritory || "Worldwide",
    "{{APPROVED_TERM}}": data.approvedTerm || "Perpetuity",
    "{{APPROVED_MEDIA_TYPES}}": data.approvedMediaTypes || "Film, Television, Streaming, Ad Campaigns, Video Games, Digital Web Media"
  };

  let result = templateText;
  for (const [placeholder, val] of Object.entries(replacements)) {
    result = result.split(placeholder).join(val);
  }
  return result;
}

/**
 * Returns the filled contract text for a given tier and purchase data.
 */
export function getAutofilledAgreementText(
  tierIdOrPrice: string | number,
  data: Partial<LicenseAgreementData> & Record<string, any>
): string {
  const norm = normalizeTierId(tierIdOrPrice);
  const raw = OFFICIAL_LICENSE_CONTRACT_TEMPLATES[norm] || OFFICIAL_LICENSE_CONTRACT_TEMPLATES.access;
  let filled = autofillAgreementTemplate(raw, data);
  if (data.customCredit && data.customCredit.trim()) {
    filled += `\n\n### MANDATORY DIGITAL CREDIT\n${data.customCredit.trim()}\n`;
  }
  if (data.customRestrictions && data.customRestrictions.trim()) {
    filled += `\n\n### SPECIAL RESTRICTIONS & TERMS\n${data.customRestrictions.trim()}\n`;
  }
  if (data.customClauses && data.customClauses.trim()) {
    filled += `\n\n### SPECIAL COVENANTS & CUSTOM LEGAL PROVISIONS\n${data.customClauses.trim()}\n`;
  }
  return filled;
}

