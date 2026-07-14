export interface LicenseTemplate {
  id: string;
  title: string;
  subtitle: string;
  price: number; // Numeric value, e.g. 100
  fileDelivery: string;
  distributionLimit: string;
  streamingLimit: string;
  videoUse: string;
  monetization: string;
  performanceRights: string;
  term: string;
  territory: string;
  publishingSplit: string;
  masterOwnership: string;
  exclusivity: string;
  contractVersion: string;
}

export const DEFAULT_LICENSE_TEMPLATES: LicenseTemplate[] = [
  {
    id: "access",
    title: "ACCESS LICENSE",
    subtitle: "For artists testing concepts.",
    price: 100,
    fileDelivery: "MP3 Download Only",
    distributionLimit: "Up to 10,000 copies",
    streamingLimit: "Up to 100,000 streams",
    videoUse: "1 Music Video (Non-monetized)",
    monetization: "Non-monetized platforms only",
    performanceRights: "Limited non-paying performances",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% Writer / 50% Publisher",
    masterOwnership: "100% Lomon LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.2-2026"
  },
  {
    id: "release",
    title: "RELEASE LICENSE",
    subtitle: "For professional independent releases.",
    price: 250,
    fileDelivery: "WAV Stereo Master + MP3",
    distributionLimit: "Up to 1,000,000 copies",
    streamingLimit: "Up to 1,000,000 streams",
    videoUse: "2 Music Videos (Monetized)",
    monetization: "Independent commercial platforms",
    performanceRights: "Unlimited live performances",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% Writer / 50% Publisher",
    masterOwnership: "100% Lomon LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.2-2026"
  },
  {
    id: "commercial",
    title: "COMMERCIAL LICENSE",
    subtitle: "For brands, creators, and campaigns.",
    price: 500,
    fileDelivery: "Full WAV Stems + Master WAV",
    distributionLimit: "Unlimited copies",
    streamingLimit: "Unlimited streams",
    videoUse: "Unlimited Video Integrations",
    monetization: "Full commercial monetization",
    performanceRights: "Unlimited public performance",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% Writer / 50% Publisher",
    masterOwnership: "100% Lomon LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.2-2026"
  },
  {
    id: "exclusive",
    title: "EXCLUSIVE ACQUISITION",
    subtitle: "Exclusive rights and beat removal.",
    price: 2500,
    fileDelivery: "Full WAV Stems + WAV + MP3",
    distributionLimit: "Unlimited",
    streamingLimit: "Unlimited streams",
    videoUse: "Unlimited Videos",
    monetization: "Full commercial exploitation",
    performanceRights: "Unlimited public performance",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "Negotiable / Split Sheets",
    masterOwnership: "Transferred to Client",
    exclusivity: "100% Exclusive",
    contractVersion: "v2.0-2026"
  },
  {
    id: "sync",
    title: "SYNC LICENSE",
    subtitle: "For film, TV, and advertisement sync.",
    price: 750,
    fileDelivery: "WAV Stereo Master",
    distributionLimit: "N/A (Broadcast only)",
    streamingLimit: "Unlimited (Ad-supported streaming platforms)",
    videoUse: "1 Production Integration",
    monetization: "Synchronized film, series, or video advertisement",
    performanceRights: "Broadcast and cue sheet registration rights",
    term: "Perpetual",
    territory: "Worldwide",
    publishingSplit: "50% Writer / 50% Publisher",
    masterOwnership: "100% Lomon LLC",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.5-2026"
  },
  {
    id: "clearance",
    title: "CUSTOM CLEARANCE",
    subtitle: "Custom audit and joint venture clearance.",
    price: 150,
    fileDelivery: "Custom Audit Pack (WAV + Stems)",
    distributionLimit: "Custom Agreement",
    streamingLimit: "Subject to clearance agreement",
    videoUse: "Subject to clearance agreement",
    monetization: "Custom Clearance Required",
    performanceRights: "Subject to clearance agreement",
    term: "Custom / Deal dependent",
    territory: "Custom / Deal dependent",
    publishingSplit: "Custom / Split Sheets",
    masterOwnership: "Lomon LLC (Joint Venture)",
    exclusivity: "Non-exclusive",
    contractVersion: "v1.0-2026"
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
