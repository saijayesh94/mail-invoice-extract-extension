import { describe, expect, it } from 'vitest';
import {
  dedupePaths,
  parseTemplate,
  renderFilename,
  renderFolderPath,
  sanitizeSegment,
} from '../src/index.ts';

const fields = {
  date: '2026-11-03',
  vendor: 'Client A',
  amount: 4500,
  currency: 'inr',
  invoiceNo: 'INV 1042',
  gst: '29abcde1234f1z5',
};

describe('renderFilename', () => {
  it('renders the default format', () => {
    expect(renderFilename('{date}_{vendor}_{amount}', fields)).toBe('2026-11-03_ClientA_4500.pdf');
  });

  it('keeps free text and supports every token', () => {
    expect(
      renderFilename('{year}-{month} {month_name} INV-{invoice_no} {gst} {amount}{currency}', fields),
    ).toBe('2026-11 November INV-INV1042 29ABCDE1234F1Z5 4500INR.pdf');
  });

  it('formats decimals with two places', () => {
    expect(renderFilename('{amount}', { amount: 84.1 })).toBe('84.10.pdf');
  });

  it('supports other date formats', () => {
    expect(renderFilename('{date}', fields, { dateFormat: 'DD-MM-YYYY' })).toBe('03-11-2026.pdf');
    expect(renderFilename('{date}', fields, { dateFormat: 'YYYYMMDD' })).toBe('20261103.pdf');
  });

  it('shows visible placeholders for missing values', () => {
    expect(renderFilename('{date}_{vendor}_{amount}', {})).toBe('NO-DATE_NO-VENDOR_NO-AMOUNT.pdf');
    expect(renderFilename('{month_name}', { date: 'not a date' })).toBe('NO-DATE.pdf');
  });

  it('strips characters that are illegal on Windows/macOS', () => {
    expect(renderFilename('{vendor}: <draft>?', { vendor: 'A/B "Co"|*' })).toBe('ABCo draft.pdf');
  });

  it('removes trailing dots and spaces and guards reserved names', () => {
    expect(renderFilename('{vendor}...', { vendor: 'Acme' })).toBe('Acme.pdf');
    expect(renderFilename('CON', {})).toBe('_CON.pdf');
  });

  it('caps the length', () => {
    const name = renderFilename('{vendor}', { vendor: 'x'.repeat(500) }, { maxLength: 50 });
    expect(name).toBe(`${'x'.repeat(50)}.pdf`);
  });

  it('leaves unknown tokens as typed', () => {
    expect(renderFilename('{nope}_{vendor}', { vendor: 'A' })).toBe('{nope}_A.pdf');
  });
});

describe('renderFolderPath', () => {
  it('splits folders on slash', () => {
    expect(renderFolderPath('{year}/{month}-{month_name}', fields)).toBe('2026/11-November');
  });

  it('ignores empty segments', () => {
    expect(renderFolderPath('/{vendor}//', fields)).toBe('ClientA');
  });
});

describe('dedupePaths', () => {
  it('appends _2, _3 before the extension, ignoring case', () => {
    expect(dedupePaths(['a/x.pdf', 'a/X.pdf', 'a/x.pdf', 'b/x.pdf'])).toEqual([
      'a/x.pdf',
      'a/X_2.pdf',
      'a/x_3.pdf',
      'b/x.pdf',
    ]);
  });
});

describe('parseTemplate', () => {
  it('reports known and unknown tokens', () => {
    expect(parseTemplate('{date}_{foo}_{amount}')).toEqual({ tokens: ['date', 'amount'], unknown: ['foo'] });
  });
});

describe('sanitizeSegment', () => {
  it('never returns an empty name', () => {
    expect(sanitizeSegment('???')).toBe('unnamed');
  });
});
