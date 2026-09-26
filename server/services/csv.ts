/**
 * CSV helpers.
 *
 * Separate from the routes so the escaping can be tested directly — it is the
 * part that matters, and it is easy to get subtly wrong.
 */

/**
 * One CSV cell.
 *
 * Two jobs. The first is ordinary escaping: wrap in quotes and double any
 * quote inside, so a comma, a newline or a quotation mark in a description
 * cannot break the row apart.
 *
 * The second is the one people forget. A spreadsheet treats a value starting
 * with =, +, - or @ as a formula, so text a customer chose — a display name,
 * a description — can execute when an admin opens the file. Prefixing with an
 * apostrophe keeps it a string, which is what it always was, and the
 * apostrophe is not shown in the cell.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** A whole row, already escaped, with the line ending CSV readers expect. */
export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",") + "\r\n";
}

/**
 * Excel reads a CSV in the system codepage unless the file starts with a byte
 * order mark, which turns £ and any accented name into mojibake.
 */
export const CSV_BOM = "﻿";
