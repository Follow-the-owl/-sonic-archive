// ============================================================================
// THE OWL CLOCK / LOMON LLC — AUTOMATED DYNAMIC LICENSE AGREEMENT GENERATOR
// ============================================================================

export interface LicenseAgreementData {
  licenseId: string; // Unique auto-generated ID, e.g., "TOC-LIC-20260804-4837"
  transactionRef: string; // e.g., "LMN-PS-178654291"
  purchaseDate: string; // e.g., "August 4, 2026"
  licenseeLegalName: string; // e.g., "John Smith"
  licenseeEmail: string;
  licenseeAddress?: string;
  fragmentTitle: string; // e.g., "10:00 PM"
  archiveIdentifier: string; // e.g., "TOC-1000PM-001" or "00:50"
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

/**
 * Dynamically computes Schedule A from purchase data & fragment metadata.
 * Customer NEVER manually inputs this.
 */
export function getScheduleAData(data: LicenseAgreementData): ScheduleAData {
  const tierId = (data.licenseTierId || "access").toLowerCase();
  
  let tierTitle = "Archive Access License ($150 USD)";
  let feeStr = "USD $150.00";
  let scope: string[] = [
    "1 Licensed Project",
    "Private creative development, demo creation, songwriting, and rehearsals",
    "0 Commercial Streams (No public release permitted)",
    "0 Commercial Physical or Digital Units",
    "No commercial monetization"
  ];

  if (tierId === "release") {
    tierTitle = "Commercial Release License ($500 USD)";
    feeStr = "USD $500.00";
    scope = [
      "1 Commercial Release Project",
      "Up to 500,000 Audio Streams across digital service providers",
      "Up to 5,000 Physical/Digital Units (CD, Vinyl, Downloads)",
      "Approved Music Video & Social Content Use (Up to 1,000,000 views)",
      "Digital Platform Monetization Permitted"
    ];
  } else if (tierId === "commercial") {
    tierTitle = "Commercial Exploitation License ($1,000 USD)";
    feeStr = "USD $1,000.00";
    scope = [
      "Unlimited Commercial Release Projects",
      "Unlimited Audio Streams across all digital service providers",
      "Unlimited Physical/Digital Units",
      "Full Monetization & Commercial Video Exploitation",
      "Live Performance Rights Permitted",
      "Production Stems Package Included"
    ];
  } else if (tierId === "exclusive") {
    tierTitle = "Exclusive Archive Acquisition ($5,000 USD)";
    feeStr = "USD $5,000.00";
    scope = [
      "100% Exclusive Acquisition & Catalog Removal",
      "Permanent Retirement of Fragment from Public Licensing Catalog",
      "Unlimited Commercial Exploitation Across All Media Worldwide",
      "Full Master Audio Files, Production Stems, and Metadata Package Transferred"
    ];
  } else if (tierId === "sync") {
    tierTitle = "Synchronization & Master License (Project Proposal)";
    feeStr = data.price ? `USD $${data.price}` : "Custom Project Quoted";
    scope = [
      "Project-Specific Synchronization License",
      "Approved Film, Television, Advertising, or Game Integration",
      "Worldwide Broadcast & VoD Rights Per Project Schedule"
    ];
  }

  if (data.price !== undefined && typeof data.price === "number") {
    feeStr = `USD $${data.price.toFixed(2)}`;
  }

  // Derive Archive Identifier if not formatted
  let formattedArchiveId = data.archiveIdentifier || "TOC-FRAG-001";
  if (!formattedArchiveId.startsWith("TOC-")) {
    const cleanId = formattedArchiveId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    formattedArchiveId = `TOC-${cleanId || "FRAG"}-001`;
  }

  return {
    licensor: "LOMON LLC d/b/a The Owl Clock",
    licenseeLegalName: data.licenseeLegalName || "Valued Licensee",
    licensedFragmentTitle: data.fragmentTitle || "The Owl Clock Archive Fragment",
    archiveIdentifier: formattedArchiveId,
    licenseTier: data.licenseTierTitle || tierTitle,
    permittedScope: scope,
    purchaseDate: data.purchaseDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    licenseId: data.licenseId || `TOC-LIC-${Date.now()}`,
    transactionRef: data.transactionRef || `LMN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
    licenseFee: feeStr
  };
}

/**
 * Dynamically computes Schedule B from purchase data & fragment metadata.
 * Pulls ownership information directly from fragment database. Customer NEVER types this manually.
 */
export function getScheduleBData(data: LicenseAgreementData): ScheduleBData {
  const tierId = (data.licenseTierId || "access").toLowerCase();

  if (tierId === "exclusive") {
    return {
      masterOwnership: data.masterOwnership || "Transferred 100% to Licensee per executed agreement",
      compositionOwnership: data.compositionOwnership || "Transferred / Executed Split Agreement",
      publishingShare: data.publishingShare || "Transferred per executed agreement",
      writerShare: data.writerShare || "Transferred per executed agreement",
      exclusivity: data.exclusivity || "100% Exclusive Acquisition",
      contractVersion: data.contractVersion || "v3.0-2026"
    };
  }

  if (tierId === "commercial") {
    return {
      masterOwnership: data.masterOwnership || "100% LOMON LLC",
      compositionOwnership: data.compositionOwnership || "50% LOMON LLC / 50% Licensee",
      publishingShare: data.publishingShare || "50% Publisher (LOMON LLC) / 50% Writer (Licensee)",
      writerShare: data.writerShare || "50% Writer (Licensee) / 50% LOMON LLC",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.5-2026"
    };
  }

  if (tierId === "release") {
    return {
      masterOwnership: data.masterOwnership || "100% LOMON LLC",
      compositionOwnership: data.compositionOwnership || "50% LOMON LLC / 50% Licensee",
      publishingShare: data.publishingShare || "50% Publisher (LOMON LLC) / 50% Writer (Licensee)",
      writerShare: data.writerShare || "50% Writer (Licensee) / 50% LOMON LLC",
      exclusivity: data.exclusivity || "Non-Exclusive",
      contractVersion: data.contractVersion || "v1.2-2026"
    };
  }

  // Default: Access Tier
  return {
    masterOwnership: data.masterOwnership || "100% LOMON LLC",
    compositionOwnership: data.compositionOwnership || "100% LOMON LLC",
    publishingShare: data.publishingShare || "100% LOMON LLC",
    writerShare: data.writerShare || "100% LOMON LLC",
    exclusivity: data.exclusivity || "Non-Exclusive",
    contractVersion: data.contractVersion || "v1.0-2026"
  };
}

/**
 * Generates the complete agreement text including dynamic Schedules A and B.
 */
export function generateFullAgreementText(data: LicenseAgreementData): string {
  const schedA = getScheduleAData(data);
  const schedB = getScheduleBData(data);
  const tierId = (data.licenseTierId || "access").toLowerCase();

  let agreementTitle = "ARCHIVE ACCESS LICENSE AGREEMENT";
  let noticeNotice = "This Agreement grants limited, non-exclusive commercial rights to incorporate the identified Archived Fragment into one original musical release. This Agreement does not sell or transfer ownership of the Archived Fragment, its underlying musical composition, its original master recording, The Owl Clock archive entry, or any related intellectual property.";

  if (tierId === "release") {
    agreementTitle = "COMMERCIAL RELEASE LICENSE AGREEMENT";
    noticeNotice = "This Agreement grants non-exclusive commercial rights to incorporate the identified Archived Fragment into one commercial musical release across streaming platforms and digital distribution channels within the limits specified herein.";
  } else if (tierId === "commercial") {
    agreementTitle = "COMMERCIAL EXPLOITATION LICENSE AGREEMENT";
    noticeNotice = "This Agreement grants broad, non-exclusive commercial rights to incorporate the identified Archived Fragment into professional musical releases, monetized content, live performances, and media broadcasts within the terms executed below.";
  } else if (tierId === "exclusive") {
    agreementTitle = "EXCLUSIVE ARCHIVE ACQUISITION LICENSE AGREEMENT";
    noticeNotice = "This Agreement grants exclusive commercial rights and catalog removal for the identified Archived Fragment. The Licensed Fragment will be permanently retired from future public licensing on The Owl Clock upon execution.";
  }

  return `THE OWL CLOCK
${agreementTitle}
FIRST EDITION

Issued by:
LOMON LLC
A Georgia Limited Liability Company
Operating through THE OWL CLOCK

License Tier: ${schedA.licenseTier}
License Fee: ${schedA.licenseFee}

ARCHIVE LICENSE NUMBER: ${schedA.licenseId}
TRANSACTION REFERENCE: ${schedA.transactionRef}
PURCHASE DATE: ${schedA.purchaseDate}
LICENSEE: ${schedA.licenseeLegalName}
LICENSED FRAGMENT: ${schedA.licensedFragmentTitle}
ARCHIVE IDENTIFIER: ${schedA.archiveIdentifier}

================================================================================
IMPORTANT LICENSE NOTICE
================================================================================
${noticeNotice}

================================================================================
TERMS AND CONDITIONS
================================================================================

1. GRANT OF RIGHTS
LOMON LLC ("Licensor") hereby grants to Licensee a non-exclusive, non-transferable (except as provided herein) license to use, reproduce, modify, adapt, mix, and integrate the sound recording and underlying composition contained within the Licensed Fragment into Licensee's new original work subject strictly to the parameters defined in Schedule A and Schedule B.

2. SCOPE OF PERMITTED USES
Licensee shall have the right to exploit the new integrated work across digital streaming, digital downloads, physical media, social channels, and public performances strictly within the limits prescribed by the selected License Tier. Any use exceeding the permitted scope shall constitute copyright infringement and breach of this Agreement.

3. PAYMENT AND DELIVERABLES
Full payment of the License Fee is a mandatory condition precedent to the grant of rights hereunder. Upon receipt of cleared funds, Licensor delivers access to high-resolution audio master assets and this executed Agreement. All sales are final pursuant to The Owl Clock Refund Policy.

4. OWNERSHIP AND COPYRIGHT
Except as expressly transferred under an Exclusive Archive Acquisition, Licensor retains 100% full sole ownership, master recording rights, and copyright in and to the original Archived Fragment, its underlying composition, stems, and archive entries.

5. CREDIT AND METADATA OBLIGATIONS
Licensee agrees to list "The Owl Clock / LOMON LLC" in all commercial metadata, cue sheets, and liner notes as a co-writer or producer where applicable, preserving the ISRC and ISWC identifiers associated with the Licensed Fragment.

6. WARRANTIES & REPRESENTATIONS
Licensor warrants that it possesses all necessary rights, power, and authority to enter into this Agreement and grant the rights herein without violating any third-party intellectual property or copyright.

7. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of Georgia, United States of America, without regard to conflict of law principles.

================================================================================
SCHEDULE A — TRANSACTION & LICENSED ASSET DETAILS
================================================================================

Licensor: ${schedA.licensor}
Licensee Legal Name: ${schedA.licenseeLegalName}
Licensed Fragment Title: ${schedA.licensedFragmentTitle}
Archive Identifier: ${schedA.archiveIdentifier}
License Tier: ${schedA.licenseTier}
Permitted Scope:
${schedA.permittedScope.map(s => `• ${s}`).join("\n")}
Purchase Date: ${schedA.purchaseDate}
License ID: ${schedA.licenseId}
Transaction Reference: ${schedA.transactionRef}
License Fee: ${schedA.licenseFee}

================================================================================
SCHEDULE B — PUBLISHING & MASTER SPLITS
================================================================================

Master Ownership: ${schedB.masterOwnership}
Composition Ownership: ${schedB.compositionOwnership}
Publishing Share: ${schedB.publishingShare}
Writer Share: ${schedB.writerShare}
Exclusivity: ${schedB.exclusivity}
Contract Version: ${schedB.contractVersion}

================================================================================
DIGITAL EXECUTION & AUTHENTICATION
================================================================================
Executed automatically upon completion of transaction reference ${schedA.transactionRef}.
Digitally recorded and sealed in LOMON LLC Archive System.
© 2026 LOMON LLC. All Rights Reserved.`;
}

/**
 * Renders HTML for viewing or printing the agreement as a formal document.
 */
export function generateAgreementHTML(data: LicenseAgreementData): string {
  const schedA = getScheduleAData(data);
  const schedB = getScheduleBData(data);
  const tierId = (data.licenseTierId || "access").toLowerCase();

  let title = "ARCHIVE ACCESS LICENSE AGREEMENT";
  if (tierId === "release") title = "COMMERCIAL RELEASE LICENSE AGREEMENT";
  if (tierId === "commercial") title = "COMMERCIAL EXPLOITATION LICENSE AGREEMENT";
  if (tierId === "exclusive") title = "EXCLUSIVE ARCHIVE ACQUISITION LICENSE AGREEMENT";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — ${schedA.licenseId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Poppins:wght@300;400;500;600;700&display=swap');
    body {
      font-family: 'Poppins', sans-serif;
      background-color: #080808;
      color: #E2DFD2;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }
    .agreement-card {
      max-width: 850px;
      margin: 0 auto;
      background: #0d0d0d;
      border: 1px solid #222;
      padding: 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }
    .header-logo {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #FFFFFF;
      border-bottom: 2px solid #222;
      padding-bottom: 15px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-subtitle {
      font-size: 11px;
      letter-spacing: 0.15em;
      color: #888;
      text-transform: uppercase;
    }
    .badge {
      font-size: 10px;
      background: #181818;
      border: 1px solid #333;
      padding: 4px 10px;
      color: #00E676;
      font-weight: 600;
      letter-spacing: 0.1em;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 5px;
    }
    .edition {
      font-size: 10px;
      letter-spacing: 0.2em;
      color: #777;
      text-transform: uppercase;
      margin-bottom: 25px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      background: #121212;
      border: 1px solid #222;
      padding: 20px;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .info-label {
      font-size: 10px;
      letter-spacing: 0.15em;
      color: #777;
      text-transform: uppercase;
    }
    .info-value {
      font-weight: 600;
      color: #FFF;
      margin-top: 2px;
    }
    .notice-box {
      border-left: 3px solid #D9D6CA;
      background: #141414;
      padding: 15px 20px;
      font-size: 12px;
      color: #BBB;
      margin-bottom: 35px;
      line-height: 1.6;
    }
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      letter-spacing: 0.15em;
      color: #FFFFFF;
      border-bottom: 1px solid #222;
      padding-bottom: 8px;
      margin-top: 35px;
      margin-bottom: 15px;
      text-transform: uppercase;
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
      padding: 12px 15px;
      text-align: left;
    }
    table.schedule-table th {
      background-color: #161616;
      color: #AAA;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    table.schedule-table td.label-col {
      width: 35%;
      color: #888;
      font-weight: 500;
      background: #111;
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
      margin-bottom: 6px;
    }
    .footer-seal {
      margin-top: 50px;
      border-top: 1px solid #222;
      padding-top: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #666;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    @media print {
      body { background-color: #FFF; color: #000; padding: 0; }
      .agreement-card { border: none; box-shadow: none; background: #FFF; color: #000; width: 100%; max-width: 100%; padding: 20px; }
      .header-logo, h1, .section-title { color: #000; border-color: #CCC; }
      .info-grid, table.schedule-table th, table.schedule-table td { background: #F9F9F9; color: #000; border-color: #DDD; }
      .notice-box { background: #F0F0F0; border-color: #000; color: #333; }
      .info-value, table.schedule-table td.val-col { color: #000; }
    }
  </style>
</head>
<body>
  <div class="agreement-card">
    <div class="header-logo">
      <div>THE OWL CLOCK</div>
      <div class="badge">EXECUTED & SEALED</div>
    </div>

    <h1>${title}</h1>
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
      <strong>IMPORTANT LICENSE NOTICE:</strong> This Agreement grants rights to incorporate the identified Archived Fragment into Licensee's release according to the exact parameters in Schedule A and Schedule B below. This document is dynamically generated and legally executed upon cleared transaction reference ${schedA.transactionRef}.
    </div>

    <div class="section-title">SCHEDULE A — TRANSACTION & LICENSED ASSET DETAILS</div>
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

    <div class="section-title">SCHEDULE B — PUBLISHING & MASTER SPLITS</div>
    <table class="schedule-table">
      <tr>
        <td class="label-col">Master Ownership</td>
        <td class="val-col">${schedB.masterOwnership}</td>
      </tr>
      <tr>
        <td class="label-col">Composition Ownership</td>
        <td class="val-col">${schedB.compositionOwnership}</td>
      </tr>
      <tr>
        <td class="label-col">Publishing Share</td>
        <td class="val-col">${schedB.publishingShare}</td>
      </tr>
      <tr>
        <td class="label-col">Writer Share</td>
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
      <div>DIGITALLY REGISTERED & ENCRYPTED</div>
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
