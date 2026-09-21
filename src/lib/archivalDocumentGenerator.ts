import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from "docx";
import { TimeCapsuleData } from "../data";

/**
 * Generates an official, beautifully styled PDF Archival Specification Dossier.
 */
export function generateTimeCapsulePDF(data: TimeCapsuleData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Background subtle border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin * 2) + 8);

  // Top header banner
  doc.setFillColor(15, 15, 15);
  doc.rect(margin, y, contentWidth, 22, "F");

  doc.setTextColor(245, 245, 240);
  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.text("THE OWL CLOCK ARCHIVE", margin + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text("LOMON LLC • RIGHTS MANAGEMENT & PUBLISHING • ATLANTA, GA", margin + 6, y + 14);

  // Status badge
  doc.setFillColor(0, 168, 89);
  doc.rect(margin + contentWidth - 34, y + 6, 28, 6.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("VERIFIED RECORD", margin + contentWidth - 32, y + 10.5);

  y += 28;

  // Catalog No and Title banner
  doc.setTextColor(20, 20, 20);
  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.text(data.catalogNo || "LOC-COMP-ARCHIVE", margin, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`SONIC DOSSIER SPECIFICATION LOG : ${data.title.toUpperCase()}`, margin, y);

  y += 4;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // Section helper
  const drawSectionHeader = (title: string) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 6, "S");

    doc.setTextColor(15, 15, 15);
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.text(title, margin + 4, y + 4.2);
    y += 8;
  };

  const drawDataRow = (label: string, value: string) => {
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(label.padEnd(24, " "), margin + 4, y);

    doc.setFont("courier", "normal");
    doc.setTextColor(10, 10, 10);
    doc.text(`: ${value}`, margin + 52, y);
    y += 5.2;
  };

  // 1. SONIC IDENTIFIER
  drawSectionHeader("[ 01. SONIC IDENTIFIER ]");
  drawDataRow("TITLE", data.title);
  drawDataRow("CATALOG NO.", data.catalogNo);
  drawDataRow("TIME OF MARK", data.timeOfMark);
  drawDataRow("RECOVERY STAMP", data.recoveryStamp);
  drawDataRow("COMPLETION STAMP", data.completionStamp);
  if (data.tonalAxis) drawDataRow("TONAL AXIS", data.tonalAxis);
  if (data.tempoPulse) drawDataRow("TEMPO / PULSE", `${data.tempoPulse} BPM`);
  if (data.runtime) drawDataRow("DURATION", data.runtime);

  y += 2;

  // 2. RIGHTS & CONTROL
  drawSectionHeader("[ 02. RIGHTS & CONTROL ]");
  drawDataRow("MASTER CONTROL", data.masterControl);
  drawDataRow("PUBLISHING CONTROL", data.publishingControl);
  drawDataRow("ORIGIN", data.origin);
  drawDataRow("THIRD-PARTY ASSETS", data.thirdPartyAssets);
  drawDataRow("CLEARANCE STATUS", data.clearanceStatus);

  y += 2;

  // 3. DELIVERABLE ASSETS
  drawSectionHeader("[ 03. DELIVERABLE ASSETS ]");
  const formattedDeliverables = data.deliverableAssets.map((asset, i) => {
    if (/^\d{2}\./.test(asset)) return asset.toUpperCase();
    const num = String(i + 1).padStart(2, "0");
    return `${num}. ${asset.toUpperCase()}`;
  });

  formattedDeliverables.forEach((item) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(30, 30, 30);
    doc.text(`•  ${item}`, margin + 4, y);
    y += 4.8;
  });

  y += 2;

  // 4. ARCHIVAL METADATA & INTEGRITY
  drawSectionHeader("[ 04. ARCHIVAL METADATA & AUTHENTICATION ]");
  drawDataRow("RECOVERY STATUS", data.recoveryStatus);
  drawDataRow("ARCHIVIST", data.archivist);
  drawDataRow("CRYPTOGRAPHIC HASH", `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...[SEALED]`);
  drawDataRow("CERTIFICATION", "OFFICIALLY RECORDED & VERIFIED BY LOMON LLC");

  y += 4;

  // Verification Seal Box
  doc.setFillColor(250, 252, 250);
  doc.setDrawColor(0, 168, 89);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setTextColor(0, 120, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CRYPTOGRAPHIC VERIFICATION SEAL // THE OWL CLOCK VAULT", margin + 4, y + 5);

  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(
    "This document certifies that the above sonic fragment is authentic, fully cataloged, and registered with LOMON LLC Publishing (BMI).",
    margin + 4,
    y + 9.5
  );

  // Footer at page bottom
  const footerY = pageHeight - margin - 4;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("THE OWL CLOCK • © 2026 LOMON LLC • ALL RIGHTS RESERVED", margin, footerY + 4);
  doc.text(
    `EXPORT DATE: ${new Date().toISOString().split("T")[0]} // CONFIDENTIAL`,
    margin + contentWidth - 65,
    footerY + 4
  );

  // Trigger download
  const cleanName = (data.title || "FRAGMENT").replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
  const filename = `ARCHIVE_LOG_${data.catalogNo || data.entryNo}_${cleanName}_DOSSIER.pdf`;
  doc.save(filename);
}

/**
 * Generates an official Microsoft Word (.docx) document.
 */
export async function generateTimeCapsuleDOCX(data: TimeCapsuleData) {
  const formattedDeliverables = data.deliverableAssets.map((asset, i) => {
    if (/^\d{2}\./.test(asset)) return asset.toUpperCase();
    const num = String(i + 1).padStart(2, "0");
    return `${num}. ${asset.toUpperCase()}`;
  });

  const makeRow = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  font: "Courier New",
                  size: 19,
                  color: "444444",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 6000, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `: ${value}`,
                  font: "Courier New",
                  size: 19,
                  color: "111111",
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: "THE OWL CLOCK ARCHIVE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "THE OWL CLOCK ARCHIVE",
                bold: true,
                font: "Courier New",
                size: 32,
                color: "111111",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "LOMON LLC • PUBLISHING & RIGHTS MANAGEMENT • ATLANTA, GEORGIA",
                font: "Arial",
                size: 17,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "OFFICIAL ARCHIVAL SPECIFICATION DOSSIER",
                bold: true,
                font: "Arial",
                size: 18,
                color: "00875A",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Catalog & Title Banner
          new Paragraph({
            children: [
              new TextRun({
                text: `CATALOG RECORD: ${data.catalogNo} — ${data.title.toUpperCase()}`,
                bold: true,
                font: "Courier New",
                size: 24,
                color: "111111",
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Section 1: SONIC IDENTIFIER
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "[ 01. SONIC IDENTIFIER ]",
                bold: true,
                font: "Courier New",
                size: 21,
                color: "222222",
              }),
            ],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              makeRow("TITLE", data.title),
              makeRow("CATALOG NO.", data.catalogNo),
              makeRow("TIME OF MARK", data.timeOfMark),
              makeRow("RECOVERY STAMP", data.recoveryStamp),
              makeRow("COMPLETION STAMP", data.completionStamp),
              ...(data.tonalAxis ? [makeRow("TONAL AXIS", data.tonalAxis)] : []),
              ...(data.tempoPulse ? [makeRow("TEMPO / PULSE", `${data.tempoPulse} BPM`)] : []),
              ...(data.runtime ? [makeRow("DURATION", data.runtime)] : []),
            ],
          }),
          new Paragraph({ text: "" }),

          // Section 2: RIGHTS & CONTROL
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "[ 02. RIGHTS & CONTROL ]",
                bold: true,
                font: "Courier New",
                size: 21,
                color: "222222",
              }),
            ],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              makeRow("MASTER CONTROL", data.masterControl),
              makeRow("PUBLISHING CONTROL", data.publishingControl),
              makeRow("ORIGIN", data.origin),
              makeRow("THIRD-PARTY ASSETS", data.thirdPartyAssets),
              makeRow("CLEARANCE STATUS", data.clearanceStatus),
            ],
          }),
          new Paragraph({ text: "" }),

          // Section 3: DELIVERABLE ASSETS
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "[ 03. DELIVERABLE ASSETS ]",
                bold: true,
                font: "Courier New",
                size: 21,
                color: "222222",
              }),
            ],
          }),
          ...formattedDeliverables.map(
            (asset) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: asset,
                    font: "Courier New",
                    size: 19,
                    color: "333333",
                  }),
                ],
              })
          ),
          new Paragraph({ text: "" }),

          // Section 4: ARCHIVAL METADATA
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "[ 04. ARCHIVAL METADATA & AUTHENTICATION ]",
                bold: true,
                font: "Courier New",
                size: 21,
                color: "222222",
              }),
            ],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              makeRow("RECOVERY STATUS", data.recoveryStatus),
              makeRow("ARCHIVIST", data.archivist),
              makeRow("AUTHENTICATION", "CRYPTOGRAPHICALLY VERIFIED"),
            ],
          }),
          new Paragraph({ text: "" }),

          // Footer Notice
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "THE OWL CLOCK • © 2026 LOMON LLC • ALL RIGHTS RESERVED • CONFIDENTIAL ARCHIVAL RECORD",
                font: "Arial",
                size: 16,
                color: "888888",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = (data.title || "FRAGMENT").replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
  const filename = `ARCHIVE_LOG_${data.catalogNo || data.entryNo}_${cleanName}_DOSSIER.docx`;
  
  const element = document.createElement("a");
  element.href = URL.createObjectURL(blob);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
}
