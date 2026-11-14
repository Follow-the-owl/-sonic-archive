export interface LicenseTemplate {
  id: string;
  code?: string; // e.g. "TOC-AAL", "TOC-CRL", "TOC-CEL", "TOC-SML", "TOC-EAA", "TOC-PCOL"
  title: string;
  subtitle: string;
  description: string;
  price: number; // Numeric value, e.g. 150, 500, 1000, 5000, 0
  priceDisplay?: string;
  paypalHostedId?: string;
  paypalLiveUrl?: string;
  usageTerms: string[];
  buttonText: string;
  fileDelivery?: string;
  distributionLimit?: string;
  streamingLimit?: string;
  videoUse?: string;
  monetization?: string;
  performanceRights?: string;
  term?: string;
  territory?: string;
  publishingSplit?: string;
  masterOwnership?: string;
  exclusivity?: string;
  contractVersion?: string;
}

export const PAYPAL_HOSTED_PLANS = {
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
} as const;

export const DEFAULT_LICENSE_TEMPLATES: LicenseTemplate[] = [
  {
    id: "access",
    code: "TOC-AAL",
    title: "Archive Access License",
    subtitle: "Limited commercial release rights for one musical work up to 100,000 streams and 2,000 units.",
    description: "This Agreement grants limited, non-exclusive commercial rights to incorporate the identified Archived Fragment into one original musical release. Digital Audio Streams: Up to 100,000 cumulative streams. Physical & Digital Sales: Up to 2,000 units sold.",
    price: 150,
    priceDisplay: "$150",
    paypalHostedId: "CFHDJFEV6Y7WJ",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/CFHDJFEV6Y7WJ",
    usageTerms: [
      "High-Resolution WAV Master",
      "Tagged Reference MP3",
      "Clearance Certificate",
      "Executed Agreement",
      "1 Licensed Musical Release Project",
      "Up to 100,000 Digital Audio Streams",
      "Up to 2,000 Physical & Digital Units Sold",
      "50/50 Publishing (50% LOMON / 50% Licensee)",
      "100% Master Retained by LOMON LLC",
      "PayPal Hosted ID: CFHDJFEV6Y7WJ"
    ],
    buttonText: "REQUEST ACCESS — $150",
    fileDelivery: "High-Resolution WAV, Tagged Reference MP3",
    distributionLimit: "Up to 2,000 physical & digital sales",
    streamingLimit: "Up to 100,000 cumulative streams",
    videoUse: "Artist-controlled social media previews",
    monetization: "Digital music streaming up to 100,000 streams",
    performanceRights: "Live concert performance permitted",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% LOMON LLC / 50% Licensee",
    masterOwnership: "100% Retained by LOMON LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.0-2026"
  },
  {
    id: "release",
    code: "TOC-CRL",
    title: "Commercial Release License",
    subtitle: "For approved commercial releases on digital music platforms.",
    description: "For approved commercial releases on digital music platforms.",
    price: 500,
    priceDisplay: "$500",
    paypalHostedId: "D7BRUR9T5CPNA",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/D7BRUR9T5CPNA",
    usageTerms: [
      "High-Resolution WAV",
      "Reference MP3",
      "License Agreement",
      "Metadata Package",
      "Clearance Certificate",
      "Commercial distribution permitted within the executed agreement",
      "PayPal Hosted ID: D7BRUR9T5CPNA"
    ],
    buttonText: "REQUEST LICENSE — $500",
    fileDelivery: "High-Resolution WAV, Reference MP3",
    distributionLimit: "Commercial distribution permitted within agreement",
    streamingLimit: "Per executed agreement",
    videoUse: "Approved Video Use",
    monetization: "Digital music platforms",
    performanceRights: "Permitted within agreement",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% LOMON LLC / 50% Licensee",
    masterOwnership: "100% Retained by LOMON LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.2-2026"
  },
  {
    id: "commercial",
    code: "TOC-CEL",
    title: "Commercial Exploitation License",
    subtitle: "For professional releases, monetized content, live performance, and promotional use.",
    description: "For professional releases, monetized content, live performance, and promotional use.",
    price: 1000,
    priceDisplay: "$1,000",
    paypalHostedId: "KKUAY9LJHBKCE",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/KKUAY9LJHBKCE",
    usageTerms: [
      "High-Resolution WAV",
      "Production Stems",
      "License Agreement",
      "Metadata Package",
      "Documentation Package",
      "Clearance Certificate",
      "Commercial use permitted within the executed agreement",
      "PayPal Hosted ID: KKUAY9LJHBKCE"
    ],
    buttonText: "REQUEST LICENSE — $1,000",
    fileDelivery: "High-Resolution WAV, Production Stems",
    distributionLimit: "Full Commercial Exploitation",
    streamingLimit: "Unlimited",
    videoUse: "Monetized Content & Promotional Use",
    monetization: "Full Commercial Monetization",
    performanceRights: "Live Performance Allowed",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% LOMON LLC / 50% Licensee",
    masterOwnership: "100% Retained by LOMON LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.5-2026"
  },
  {
    id: "sync",
    code: "TOC-SML",
    title: "Synchronization & Master License",
    subtitle: "For film, television, advertising, brand campaigns, games, and broadcast media.",
    description: "For film, television, advertising, brand campaigns, games, and broadcast media.",
    price: 0,
    priceDisplay: "CUSTOM PROPOSAL",
    paypalHostedId: "MLHYEFHQY8494",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/MLHYEFHQY8494",
    usageTerms: [
      "Project-Specific License",
      "Approved Media Usage",
      "Territory & Term Schedule",
      "Master & Composition Clearance",
      "Pricing quoted per project",
      "PayPal Hosted ID: MLHYEFHQY8494"
    ],
    buttonText: "REQUEST PROPOSAL",
    fileDelivery: "Custom Delivery Package (WAV + Stems)",
    distributionLimit: "Per Project Schedule",
    streamingLimit: "Broadcast / Ad-supported / VoD",
    videoUse: "Approved Film / TV / Ad / Game Integration",
    monetization: "Synchronized Broadcast & Media",
    performanceRights: "Broadcast & Cue Sheet Rights",
    term: "Per Schedule",
    territory: "Per Schedule",
    publishingSplit: "Negotiated Per Project",
    masterOwnership: "Negotiated Per Project",
    exclusivity: "Project-Specific / Negotiable",
    contractVersion: "v2.0-2026"
  },
  {
    id: "exclusive",
    code: "TOC-EAA",
    title: "Exclusive Archive Acquisition",
    subtitle: "For exclusive control and permanent removal from future public licensing.",
    description: "For exclusive control and permanent removal from future public licensing.",
    price: 5000,
    priceDisplay: "$5,000",
    paypalHostedId: "KCXV2FHADXRDL",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/KCXV2FHADXRDL",
    usageTerms: [
      "Exclusive Acquisition Agreement",
      "Full Production Files",
      "Production Stems",
      "Metadata Transfer",
      "Exclusive Clearance Certificate",
      "Ownership Documentation (where applicable)",
      "Existing non-exclusive licenses remain valid",
      "Rights transfer only as stated in the executed agreement",
      "PayPal Hosted ID: KCXV2FHADXRDL"
    ],
    buttonText: "REQUEST ACQUISITION — $5,000",
    fileDelivery: "Full Production Files, Production Stems",
    distributionLimit: "Unlimited / Catalog Removal",
    streamingLimit: "Unlimited",
    videoUse: "Unlimited",
    monetization: "Full Ownership / Exploitation",
    performanceRights: "Unlimited",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% LOMON LLC / 50% Licensee",
    masterOwnership: "100% Transferred and Assigned to Licensee",
    exclusivity: "100% Exclusive Acquisition",
    contractVersion: "v3.0-2026"
  },
  {
    id: "collaboration",
    code: "TOC-PCOL",
    title: "Producer Collaboration",
    subtitle: "Selected projects may qualify for collaboration without an upfront licensing fee.",
    description: "Selected projects may qualify for collaboration without an upfront licensing fee. Writer shares, publishing participation, master ownership, royalties, credits, and administrative responsibilities are negotiated individually and documented before commercial release.",
    price: 0,
    priceDisplay: "COLLABORATION",
    paypalHostedId: "UZY4LJVGTHQC4",
    paypalLiveUrl: "https://www.paypal.com/ncp/payment/UZY4LJVGTHQC4",
    usageTerms: [
      "Selected projects may qualify for collaboration without an upfront licensing fee",
      "Writer shares, publishing participation, master ownership, royalties, credits, and administrative responsibilities are negotiated individually and documented before commercial release.",
      "PayPal Hosted ID: UZY4LJVGTHQC4"
    ],
    buttonText: "SUBMIT PROJECT FOR REVIEW",
    fileDelivery: "Production Files upon execution",
    distributionLimit: "Per Negotiation",
    streamingLimit: "Per Negotiation",
    videoUse: "Per Negotiation",
    monetization: "Shared Royalty / Publishing Participation",
    performanceRights: "Per Split Sheet",
    term: "Per Agreement",
    territory: "Worldwide",
    publishingSplit: "50% LOMON LLC / 50% Licensee",
    masterOwnership: "50% LOMON LLC / 50% Licensee",
    exclusivity: "Collaborative Co-Ownership",
    contractVersion: "v1.0-Collab"
  }
];

export function getLicensesForFragment(fragment: any): LicenseTemplate[] {
  let templates = DEFAULT_LICENSE_TEMPLATES;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("lomon_license_templates");
    if (saved) {
      try {
        templates = JSON.parse(saved);
      } catch (e) {}
    }
  }

  if (!fragment) return templates;
  
  // If the fragment does not have licenseOverrides, return all default templates
  if (!fragment.licenseOverrides) {
    return templates;
  }

  return templates.map(template => {
    const override = fragment.licenseOverrides[template.id];
    if (override) {
      if (override.enabled === false) {
        return null; // This template is disabled
      }
      return {
        ...template,
        price: override.priceOverride !== undefined ? override.priceOverride : template.price,
        ...override.overrides
      };
    }
    return template;
  }).filter((t): t is LicenseTemplate => t !== null);
}
