import * as XLSX from "xlsx";

export interface BomSupplier {
  name: string;
  orderNumber: string;
}

export interface BomLineItem {
  id: string;
  section: string;
  value: string;
  shorttext: string;
  quantity: number;
  supplier1: BomSupplier | null;
  supplier2: BomSupplier | null;
}

export interface ParsedBom {
  fileName: string;
  totalLines: number;
  totalQuantity: number;
  sections: string[];
  items: BomLineItem[];
}

/**
 * Detects whether a row is a section header.
 * Section headers only have a value in the first column with no shorttext.
 */
function isSectionHeader(row: (string | number | undefined)[]): boolean {
  const value = row[0];
  const shorttext = row[1];
  const qty = row[2];
  const supplier = row[3];

  return (
    !!value &&
    typeof value === "string" &&
    !shorttext &&
    !qty &&
    !supplier
  );
}

/**
 * Checks if a row has any meaningful data (non-empty cells).
 */
function isEmptyRow(row: (string | number | undefined)[]): boolean {
  return row.every((cell) => cell === undefined || cell === null || cell === "");
}

/**
 * Parse an XLSX BOM file (matching the Stückliste format) into structured data.
 *
 * Expected columns:
 *   A: Value (component value / identifier)
 *   B: Shorttext (description)
 *   C: n (quantity)
 *   D: Supplier 1
 *   E: Order-# 1
 *   F: Supplier 2
 *   G: Order-# 2
 */
export function parseBomFile(buffer: ArrayBuffer, fileName: string): ParsedBom {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (skip header row)
  const rawData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(
    sheet,
    { header: 1, defval: undefined }
  );

  // Skip the header row (Value, Shorttext, n, ...)
  const dataRows = rawData.slice(1);

  const items: BomLineItem[] = [];
  const sections: string[] = [];
  let currentSection = "General";
  let idCounter = 0;

  for (const row of dataRows) {
    if (isEmptyRow(row)) continue;

    if (isSectionHeader(row)) {
      currentSection = String(row[0]).trim();
      if (!sections.includes(currentSection)) {
        sections.push(currentSection);
      }
      continue;
    }

    const value = row[0] != null ? String(row[0]).trim() : "";
    const shorttext = row[1] != null ? String(row[1]).trim() : "";

    // Skip rows with no shorttext (no real component data)
    if (!shorttext) continue;

    const rawQty = row[2];
    const quantity =
      rawQty != null && rawQty !== "" ? Number(rawQty) : 0;

    const sup1Name = row[3] != null ? String(row[3]).trim() : "";
    const sup1Order = row[4] != null ? String(row[4]).trim() : "";
    const sup2Name = row[5] != null ? String(row[5]).trim() : "";
    const sup2Order = row[6] != null ? String(row[6]).trim() : "";

    idCounter++;
    items.push({
      id: `bom-${idCounter}`,
      section: currentSection,
      value,
      shorttext,
      quantity,
      supplier1: sup1Name
        ? { name: sup1Name, orderNumber: sup1Order }
        : null,
      supplier2: sup2Name
        ? { name: sup2Name, orderNumber: sup2Order }
        : null,
    });
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    fileName,
    totalLines: items.length,
    totalQuantity,
    sections,
    items,
  };
}
