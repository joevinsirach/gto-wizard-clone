/**
 * CSV Export utilities for hand history data.
 */

import type { HandRecord } from "./HandTable";

export interface ExportColumn {
  key: keyof HandRecord | string;
  label: string;
}

/**
 * Converts a hand record to a CSV row string.
 */
function handToCSVRow(hand: HandRecord, columns: ExportColumn[]): string {
  return columns
    .map((col) => {
      const value = (hand as unknown as Record<string, unknown>)[col.key as string];
      const str = value === null || value === undefined ? "" : String(value);
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

/**
 * Exports an array of hand records to a CSV string and triggers a browser download.
 */
export function exportHandsToCSV(
  hands: HandRecord[],
  columns?: ExportColumn[],
  filename = "hands_export.csv"
): void {
  const defaultColumns: ExportColumn[] = [
    { key: "id", label: "hand_id" },
    { key: "created_at", label: "date" },
    { key: "spot_category", label: "spot_category" },
    { key: "ev_loss", label: "ev_loss" },
    { key: "gto_action", label: "gto_action" },
    { key: "user_action", label: "user_action" },
  ];

  const cols = columns ?? defaultColumns;

  const header = cols.map((c) => c.label).join(",");
  const rows = hands.map((h) => handToCSVRow(h, cols));
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a filename with current date for exports.
 */
export function generateExportFilename(prefix: string, extension = "csv"): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}_${dateStr}.${extension}`;
}
