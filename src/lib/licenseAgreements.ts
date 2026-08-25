// ============================================================================
// THE OWL CLOCK / LOMON LLC — OFFICIAL LEGAL LICENSE AGREEMENT ENGINE
// Exact First Edition Legal Contracts for $150, $500, $1,000, $5,000 Tiers
// ============================================================================

export interface LicenseAgreementData {
  licenseId: string; // Unique auto-generated ID, e.g., "TOC-LIC-20260804-4837"
  transactionRef: string; // e.g., "LMN-PS-178654291"
  purchaseDate: string; // e.g., "August 4, 2026"
  licenseeLegalName: string; // e.g., "John Smith"
  licenseeEmail: string;
  licenseeAddress?: string;
  fragmentTitle: string; // e.g., "9:41 PM"
  archiveIdentifier: string; // e.g., "TOC-0941PM-001" or "09:41"
  licenseTierId: "access" | "release" | "commercial" | "exclusive" | "sync" | string;
  licenseTierTitle?: string;
  price?: number | string;
  
  // Custom Metadata / Schedule B Overrides
  masterOwnership?: string;
  compositionOwnership?: string;
  publishingShare?: string;
  writerShare?: string;
  exclusivity?: string;
  contractVersion?: string;
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
  masterOwnership: string;
  compositionOwnership: string;
  publishingShare: string;
  writerShare: string;
  exclusivity: string;
  contractVersion: string;
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
export function normalizeTierId(tierIdOrPrice?: string | number): "access" | "release" | "commercial" | "exclusive" | "sync" {
  if (!tierIdOrPrice) return "access";
  const str = String(tierIdOrPrice).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (str.includes("5000") || str.includes("exclusive") || str.includes("acqui")) return "exclusive";
  if (str.includes("1000") || str.includes("commercial") || str.includes("exploit")) return "commercial";
  if (str.includes("500") || str.includes("release")) return "release";
  if (str.includes("sync") || str.includes("custom")) return "sync";
  return "access";
}

/**
 * Dynamically computes Schedule A from purchase data & fragment metadata.
 */
export function getScheduleAData(data: LicenseAgreementData): ScheduleAData {
  const tierId = normalizeTierId(data.licenseTierId || (typeof data.price === "number" || typeof data.price === "string" ? String(data.price) : "access"));
  
  let tierTitle = "Archive Access License ($150.00 USD)";
  let feeStr = "USD $150.00";
  let deliveryPackage = "Tagged Reference MP3, Watermarked WAV, Archive Access Certificate";
  let catalogStatus = "Active in Public Archive (Non-Exclusive Access)";
  let scope: string[] = [
    "1 Licensed Project",
    "Private creative development, demo creation, songwriting, and rehearsals",
    "0 Commercial Streams (No public release permitted)",
    "0 Commercial Physical or Digital Units",
    "No commercial monetization or public distribution"
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
      "Master Ownership remains 100% with Lomon LLC"
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
      "Master Ownership remains 100% with Lomon LLC (50/50 Publishing Split)"
    ];
  } else if (tierId === "exclusive") {
    tierTitle = "Exclusive Archive Acquisition ($5,000.00 USD)";
    feeStr = "USD $5,000.00";
    deliveryPackage = "Full Production Files, Production Stems, High-Resolution WAV, Metadata Transfer, Exclusive Clearance Certificate, Ownership Documentation";
    catalogStatus = "Retired / Removed from Public Licensing";
    scope = [
      "100% Exclusive Commercial Rights & Worldwide Exploitation",
      "Permanent Catalog Removal & Retirement from The Owl Clock public licensing platform",
      "Full Production Files & Multi-track Stems Included",
      "Master Ownership Transferred & Assigned to Licensee per executed terms",
      "Automated Content Identification System (Content ID) registration permitted",
      "Prior lawfully issued non-exclusive licenses remain valid per Section 3.8"
    ];
  } else if (tierId === "sync") {
    tierTitle = "Synchronization & Master License (Project Schedule)";
    feeStr = data.price ? `USD $${data.price}` : "Custom Project Quoted";
    deliveryPackage = "High-Resolution Master WAV, Production Stems, Project Clearance Schedule";
    catalogStatus = "Project Specific Clearance";
    scope = [
      "Project-Specific Synchronization License",
      "Approved Film, Television, Advertising, Streaming Series, or Video Game integration",
      "Worldwide Broadcast & VoD Rights Per Executed Project Schedule"
    ];
  }

  if (data.price !== undefined && data.price !== null) {
    if (typeof data.price === "number") {
      feeStr = `USD $${data.price.toFixed(2)}`;
    } else if (String(data.price).startsWith("$")) {
      feeStr = `USD ${data.price}`;
    }
  }

  // Derive Archive Identifier if not formatted
  let formattedArchiveId = data.archiveIdentifier || "TOC-FRAG-001";
  if (!formattedArchiveId.startsWith("TOC-")) {
    const cleanId = formattedArchiveId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    formattedArchiveId = `TOC-${cleanId || "FRAG"}-001`;
  }

  return {
    licensor: "Lomon LLC d/b/a The Owl Clock",
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
 */
export function getScheduleBData(data: LicenseAgreementData): ScheduleBData {
  const tierId = normalizeTierId(data.licenseTierId || (typeof data.price === "number" || typeof data.price === "string" ? String(data.price) : "access"));

  if (tierId === "exclusive") {
    return {
      masterOwnership: data.masterOwnership || "Transferred per executed agreement (Schedule A/B)",
      compositionOwnership: data.compositionOwnership || "Negotiable Transfer (as specified: __% Licensor / __% Licensee)",
      publishingShare: data.publishingShare || "Negotiable Transfer (as specified: __% Licensor / __% Licensee)",
      writerShare: data.writerShare || "Negotiable Transfer per executed agreement",
      exclusivity: data.exclusivity || "100% Exclusive Acquisition",
      contractVersion: data.contractVersion || "v3.0-2026"
    };
  }

  if (tierId === "commercial") {
    return {
      masterOwnership: data.masterOwnership || "100% Lomon LLC",
      compositionOwnership: data.compositionOwnership || "50% Writer / Publisher (Lomon LLC) | 50% Writer / Publisher (Licensee)",
      publishingShare: data.publishingShare || "50% Publisher (Lomon LLC) / 50% Licensee's publisher",
      writerShare: data.writerShare || "50% Writer (Lomon LLC) / 50% Licensee's writers",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.5-2026"
    };
  }

  if (tierId === "release") {
    return {
      masterOwnership: data.masterOwnership || "100% Lomon LLC",
      compositionOwnership: data.compositionOwnership || "50% Writer / Publisher (Lomon LLC) | 50% Writer / Publisher (Licensee)",
      publishingShare: data.publishingShare || "50% Publisher (Lomon LLC) / 50% Licensee's publisher",
      writerShare: data.writerShare || "50% Writer (Lomon LLC) / 50% Licensee's writers",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.2-2026"
    };
  }

  // Default: Access Tier ($150)
  return {
    masterOwnership: data.masterOwnership || "100% Lomon LLC",
    compositionOwnership: data.compositionOwnership || "100% Lomon LLC",
    publishingShare: data.publishingShare || "100% Lomon LLC",
    writerShare: data.writerShare || "100% Lomon LLC",
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
      "This Agreement grants non-exclusive, internal development rights to incorporate the identified Archived Fragment into private songwriting, demo creation, rehearsals, and creative exploration.",
      "This Agreement does NOT grant commercial release, public streaming monetization, broadcast synchronization, or commercial distribution rights. Master ownership and publishing remain 100% with Lomon LLC.",
      "The Licensed Fragment may remain available for licensing to other parties unless subsequently acquired under an exclusive agreement."
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
            text: "This Agreement governs the Licensee's purchase of an Archive Access License for the Archived Fragment identified in Schedule A. The license fee for this tier is one hundred fifty United States dollars (USD $150.00). The license becomes effective upon confirmation of payment and acceptance of this Agreement."
          },
          {
            heading: "1.3 Purpose & Non-Commercial Scope",
            text: "The purpose of this Agreement is to provide Licensee access to reference master materials for internal artistic development, demo composition, and rehearsals only."
          }
        ]
      },
      {
        title: "ARTICLE 2: DEFINITIONS & DELIVERABLES",
        sections: [
          {
            heading: "2.1 Deliverables",
            text: "\"Licensed Materials\" under this tier include Tagged Reference MP3, Watermarked WAV, and Archive Access Certificate."
          },
          {
            heading: "2.2 Master & Composition",
            text: "Licensor retains 100% full master ownership and 100% writer/publisher share in the Archived Fragment."
          }
        ]
      },
      {
        title: "ARTICLE 3: RESTRICTIONS & PROHIBITIONS",
        sections: [
          {
            heading: "3.1 No Commercial Release",
            text: "Licensee shall not distribute, monetize, or publicly stream any work incorporating the Archived Fragment without upgrading to a Commercial Release or Commercial Exploitation License."
          },
          {
            heading: "3.2 Content ID & AI Training Prohibition",
            text: "Licensee shall not upload or fingerprint the Licensed Materials into Content ID systems or public AI generative training models."
          }
        ]
      },
      {
        title: "ARTICLE 4: GOVERNING LAW",
        sections: [
          {
            heading: "4.1 Jurisdiction",
            text: "This Agreement is governed by the laws of the State of Georgia, USA."
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
  out += `SCHEDULE B: OWNERSHIP & SPLITS\n`;
  out += `================================================================================\n`;
  out += `• Master Ownership: ${schedB.masterOwnership}\n`;
  out += `• Publishing Split: ${schedB.publishingShare}\n`;
  out += `• Writer Split: ${schedB.writerShare}\n`;
  out += `• Exclusivity: ${schedB.exclusivity}\n`;
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
        <td class="label-col">Licensor</td>
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

    <div class="article-title">SCHEDULE B: OWNERSHIP & SPLITS</div>
    <table class="schedule-table">
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
        <td class="label-col">Exclusivity</td>
        <td class="val-col">${schedB.exclusivity}</td>
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
 * Triggers browser download or popup print window for the license agreement.
 */
export function openOrDownloadLicenseAgreement(data: LicenseAgreementData) {
  const html = generateAgreementHTML(data);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // Fallback download if popup blocked
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `License_Agreement_${data.licenseId || "OwlClock"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

