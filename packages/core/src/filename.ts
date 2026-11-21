import type { InvoiceFields } from './types.ts';

/**
 * File & folder name templates — see CLAUDE.md §6.
 * A template is free text plus tokens, e.g. `{date}_{vendor}_{amount}`.
 */

export const TOKENS = [
  'date',
  'vendor',
  'amount',
  'currency',
  'invoice_no',
  'gst',
  'year',
  'month',
  'month_name',
] as const;
export type Token = (typeof TOKENS)[number];

export const TOKEN_HELP: Record<Token, string> = {
  date: 'Invoice date (format set in settings)',
  vendor: 'Vendor name, spaces removed',
  amount: 'Total amount, e.g. 4500 or 84.12',
  currency: 'Currency code, e.g. INR, USD',
  invoice_no: 'Invoice number',
  gst: 'GSTIN / tax ID',
  year: 'Year, e.g. 2026',
  month: 'Month number, e.g. 11',
  month_name: 'Month name, e.g. November',
};

export interface Preset {
  id: string;
  label: string;
  template: string;
}

export const FILENAME_PRESETS: Preset[] = [
  { id: 'default', label: 'Default', template: '{date}_{vendor}_{amount}' },
  { id: 'accountant', label: 'Accountant style', template: '{date}_{vendor}_{invoice_no}_{amount}{currency}' },
  { id: 'india-gst', label: 'India GST style', template: '{date}_{vendor}_{gst}_{amount}{currency}' },
];

export const FOLDER_PRESETS: Preset[] = [
  { id: 'by-month', label: 'By month', template: '{year}/{month}-{month_name}' },
  { id: 'by-vendor', label: 'By vendor', template: '{vendor}' },
];

export type DateFormat = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'YYYYMMDD';

export interface FormatOptions {
  dateFormat?: DateFormat;
  /** Max characters for one file or folder name, excluding the extension. */
  maxLength?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Characters not allowed in file names on Windows or macOS, plus control characters. */
// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS = /[\\/:*?"<>|\u0000-\u001F]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const TOKEN_PATTERN = /\{([a-z_]+)\}/g;
const DEFAULT_MAX_LENGTH = 120;

const MISSING: Record<Token, string> = {
  date: 'NO-DATE',
  vendor: 'NO-VENDOR',
  amount: 'NO-AMOUNT',
  currency: 'NO-CURRENCY',
  invoice_no: 'NO-INVOICE-NO',
  gst: 'NO-GST',
  year: 'NO-DATE',
  month: 'NO-DATE',
  month_name: 'NO-DATE',
};

function isToken(name: string): name is Token {
  return (TOKENS as readonly string[]).includes(name);
}

/** Lists tokens used in a template and any `{unknown}` ones (shown as a warning in the UI). */
export function parseTemplate(template: string): { tokens: Token[]; unknown: string[] } {
  const tokens: Token[] = [];
  const unknown: string[] = [];
  for (const match of template.matchAll(TOKEN_PATTERN)) {
    const name = match[1]!;
    if (isToken(name)) tokens.push(name);
    else unknown.push(name);
  }
  return { tokens, unknown };
}

function parseIsoDate(iso: string | undefined): { y: string; m: string; d: string } | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match as unknown as [string, string, string, string];
  const month = Number(m);
  if (month < 1 || month > 12) return null;
  return { y, m, d };
}

export function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function cleanValue(value: string): string {
  return value.replace(ILLEGAL_CHARS, '').replace(/\s+/g, ' ').trim();
}

function tokenValue(token: Token, fields: InvoiceFields, opts: FormatOptions): string | undefined {
  const date = parseIsoDate(fields.date);
  switch (token) {
    case 'date': {
      if (!date) return undefined;
      const fmt = opts.dateFormat ?? 'YYYY-MM-DD';
      if (fmt === 'DD-MM-YYYY') return `${date.d}-${date.m}-${date.y}`;
      if (fmt === 'YYYYMMDD') return `${date.y}${date.m}${date.d}`;
      return `${date.y}-${date.m}-${date.d}`;
    }
    case 'year':
      return date?.y;
    case 'month':
      return date?.m;
    case 'month_name':
      return date ? MONTH_NAMES[Number(date.m) - 1] : undefined;
    case 'vendor':
      return fields.vendor ? cleanValue(fields.vendor).replace(/ /g, '') : undefined;
    case 'amount':
      return fields.amount === undefined || Number.isNaN(fields.amount) ? undefined : formatAmount(fields.amount);
    case 'currency':
      return fields.currency ? cleanValue(fields.currency).toUpperCase() : undefined;
    case 'invoice_no':
      return fields.invoiceNo ? cleanValue(fields.invoiceNo).replace(/ /g, '') : undefined;
    case 'gst':
      return fields.gst ? cleanValue(fields.gst).replace(/ /g, '').toUpperCase() : undefined;
  }
}

/** Makes one file/folder name safe on Windows and macOS. */
export function sanitizeSegment(name: string, maxLength = DEFAULT_MAX_LENGTH): string {
  let out = name.replace(ILLEGAL_CHARS, '').replace(/\s+/g, ' ').trim();
  if (out.length > maxLength) out = out.slice(0, maxLength);
  // Windows drops trailing dots and spaces.
  out = out.replace(/[. ]+$/, '');
  if (out === '') return 'unnamed';
  if (WINDOWS_RESERVED.test(out)) out = `_${out}`;
  return out;
}

function renderSegment(template: string, fields: InvoiceFields, opts: FormatOptions): string {
  const rendered = template.replace(TOKEN_PATTERN, (whole, name: string) => {
    if (!isToken(name)) return whole; // unknown tokens stay as typed; the UI warns via parseTemplate()
    return tokenValue(name, fields, opts) || MISSING[name];
  });
  return sanitizeSegment(rendered, opts.maxLength ?? DEFAULT_MAX_LENGTH);
}

/** Renders a file name, e.g. `2026-11-03_ClientA_4500.pdf`. Any `/` in the template is removed. */
export function renderFilename(
  template: string,
  fields: InvoiceFields,
  opts: FormatOptions = {},
  extension = 'pdf',
): string {
  const base = renderSegment(template.replace(/[\\/]/g, ''), fields, opts);
  return extension ? `${base}.${extension}` : base;
}

/** Renders a folder path; `/` in the template separates folders, e.g. `2026/11-November`. */
export function renderFolderPath(template: string, fields: InvoiceFields, opts: FormatOptions = {}): string {
  return template
    .split(/[\\/]/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => renderSegment(part, fields, opts))
    .join('/');
}

/**
 * Makes paths unique by appending `_2`, `_3`, … before the extension.
 * Comparison ignores case because Windows and macOS file systems usually do.
 */
export function dedupePaths(paths: string[]): string[] {
  const used = new Set<string>();
  return paths.map((path) => {
    const slash = path.lastIndexOf('/');
    const dir = path.slice(0, slash + 1);
    const file = path.slice(slash + 1);
    const dot = file.lastIndexOf('.');
    const stem = dot > 0 ? file.slice(0, dot) : file;
    const ext = dot > 0 ? file.slice(dot) : '';

    let candidate = path;
    for (let n = 2; used.has(candidate.toLowerCase()); n++) {
      candidate = `${dir}${stem}_${n}${ext}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
