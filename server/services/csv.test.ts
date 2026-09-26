import { describe, expect, it } from "vitest";
import { CSV_BOM, csvCell, csvRow } from "./csv";

describe("csvCell", () => {
  it("quotes plain values", () => {
    expect(csvCell("Pamela Smith")).toBe('"Pamela Smith"');
  });

  it("keeps a comma inside one cell", () => {
    expect(csvCell("Smith, Pamela")).toBe('"Smith, Pamela"');
  });

  it("doubles quotes so they survive the round trip", () => {
    expect(csvCell('He said "hello"')).toBe('"He said ""hello"""');
  });

  it("keeps a newline inside the cell rather than starting a row", () => {
    expect(csvCell("line one\nline two")).toBe('"line one\nline two"');
  });

  it("writes empty for null and undefined", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it("keeps numbers as written", () => {
    expect(csvCell(25.5)).toBe('"25.5"');
    expect(csvCell(0)).toBe('"0"');
  });

  // The important one: these are values a customer can choose.
  it("defuses a value a spreadsheet would run as a formula", () => {
    for (const attack of [
      "=1+1",
      "+1+1",
      "-1+1",
      "@SUM(A1)",
      '=HYPERLINK("http://evil.example","click")',
      "=cmd|'/c calc'!A1",
    ]) {
      const cell = csvCell(attack);
      expect(cell.startsWith(`"'`)).toBe(true);
    }
  });

  it("leaves ordinary text that merely contains those characters alone", () => {
    expect(csvCell("Top-up 1+1 bonus")).toBe('"Top-up 1+1 bonus"');
    expect(csvCell("a@b.com")).toBe('"a@b.com"');
  });
});

describe("csvRow", () => {
  it("joins cells and ends the line the way CSV readers expect", () => {
    expect(csvRow(["a", "b"])).toBe('"a","b"\r\n');
  });

  it("survives a row where every value is awkward", () => {
    expect(csvRow(['=1', null, 'say "hi"'])).toBe('"\'=1","","say ""hi"""\r\n');
  });
});

describe("CSV_BOM", () => {
  it("is the byte order mark Excel looks for", () => {
    expect(CSV_BOM).toBe("﻿");
    expect(CSV_BOM.charCodeAt(0)).toBe(0xfeff);
  });
});
