import type { FoundItem, RangeOption, ReviewState } from '@app/ui';

/** Sample data for the landing-page simulator. All people, numbers and IDs are made up. */

export const DEMO_RANGES: RangeOption[] = [
  { id: 'last-month', label: 'Last month', hint: 'Oct 2026' },
  { id: 'last-3-months', label: 'Last 3 months', hint: 'Aug – Oct 2026' },
  { id: 'this-fy', label: 'This FY', hint: 'Apr – Nov 2026' },
];

export const DEMO_ZIP_NAMES: Record<string, string> = {
  'last-month': 'invoices-2026-10.zip',
  'last-3-months': 'invoices-2026-08-to-10.zip',
  'this-fy': 'invoices-FY2026-27.zip',
};

/** Emails "read" during the scan, per range — just for the progress counter. */
export const DEMO_SCAN_TOTALS: Record<string, number> = {
  'last-month': 64,
  'last-3-months': 187,
  'this-fy': 412,
};

export const DEMO_ITEMS: FoundItem[] = [
  {
    id: 'aws-1',
    fromName: 'Amazon Web Services',
    fromAddress: 'aws-billing@amazon.com',
    subject: 'Amazon Web Services Invoice Available',
    originalName: 'invoice (12).pdf',
    source: 'attachment',
    fields: { date: '2026-10-02', amount: 84.12, currency: 'USD', invoiceNo: '1184520931' },
  },
  {
    id: 'aws-2',
    fromName: 'Amazon Web Services',
    fromAddress: 'aws-billing@amazon.com',
    subject: 'Amazon Web Services Invoice Available (Marketplace)',
    originalName: 'invoice (13).pdf',
    source: 'attachment',
    fields: { date: '2026-10-03', amount: 12.5, currency: 'USD', invoiceNo: '1184602217' },
  },
  {
    id: 'aws-3',
    fromName: 'Amazon Web Services',
    fromAddress: 'aws-billing@amazon.com',
    subject: 'Fwd: Amazon Web Services Invoice Available',
    originalName: 'invoice (14).pdf',
    source: 'attachment',
    fields: { date: '2026-10-02', amount: 84.12, currency: 'USD', invoiceNo: '1184520931' },
  },
  {
    id: 'priya-1',
    fromName: 'Priya Sharma',
    fromAddress: 'priya.designs@gmail.com',
    subject: 'Invoice #42 – Brand refresh',
    originalName: 'INV_0042_final.pdf',
    source: 'attachment',
    fields: { date: '2026-10-05', amount: 25000, currency: 'INR', invoiceNo: 'INV-0042' },
  },
  {
    id: 'priya-2',
    fromName: 'Priya Sharma',
    fromAddress: 'priya.designs@gmail.com',
    subject: 'Invoice #43 – Social templates',
    originalName: 'INV_0043.pdf',
    source: 'attachment',
    fields: { date: '2026-10-14', amount: 18000, currency: 'INR', invoiceNo: 'INV-0043' },
  },
  {
    id: 'priya-3',
    fromName: 'Priya Sharma',
    fromAddress: 'priya.designs@gmail.com',
    subject: 'updated invoice',
    originalName: 'invoice_oct_v2 (1).pdf',
    source: 'attachment',
    fields: { date: '2026-10-28', amount: 12500, currency: 'INR', invoiceNo: 'INV-0044' },
    lowConfidence: ['date'],
  },
  {
    id: 'notion-1',
    fromName: 'Notion',
    fromAddress: 'invoice+statements@stripe.com',
    subject: 'Your receipt from Notion Labs #2847-1023',
    originalName: 'Receipt-2847-1023.pdf',
    source: 'attachment',
    vendorFromDocument: 'Notion',
    fields: { date: '2026-10-08', amount: 10, currency: 'USD', invoiceNo: '2847-1023' },
  },
  {
    id: 'figma-1',
    fromName: 'Figma',
    fromAddress: 'invoice+statements@stripe.com',
    subject: 'Your receipt from Figma #4410-2210',
    originalName: 'Receipt-4410-2210.pdf',
    source: 'attachment',
    vendorFromDocument: 'Figma',
    fields: { date: '2026-10-11', amount: 15, currency: 'USD', invoiceNo: '4410-2210' },
  },
  {
    id: 'zoho-1',
    fromName: 'Razorpay',
    fromAddress: 'no-reply@razorpay.com',
    subject: 'Payment successful – Zoho Corporation',
    originalName: 'Invoice_ZH-88213.pdf',
    source: 'attachment',
    vendorFromDocument: 'Zoho',
    fields: { date: '2026-10-15', amount: 1180, currency: 'INR', invoiceNo: 'ZH-88213', gst: '29ABCDE1234F1Z5' },
    lowConfidence: ['amount'],
  },
  {
    id: 'rahul-1',
    fromName: 'Rahul Verma',
    fromAddress: 'rahul.codes@gmail.com',
    subject: 'Invoice for October dev work',
    originalName: 'Invoice.pdf',
    source: 'attachment',
    fields: { date: '2026-10-31', amount: 40000, currency: 'INR', invoiceNo: 'RV-10' },
  },
  {
    id: 'ride-1',
    fromName: 'CityRide',
    fromAddress: 'receipts@cityride.app',
    subject: 'Your Tuesday evening ride receipt',
    originalName: 'email text',
    source: 'email-body',
    fields: { date: '2026-10-21', amount: 342, currency: 'INR' },
  },
  {
    id: 'fiber-1',
    fromName: 'FiberLink Broadband',
    fromAddress: 'billing@fiberlink.co.in',
    subject: 'Your FiberLink bill for October 2026',
    originalName: 'Bill_Oct2026.pdf',
    source: 'attachment',
    fields: {},
    locked: true,
  },
];

/** Shows "remembered from last month": the user renamed Amazon Web Services → AWS before. */
export const DEMO_INITIAL_REVIEW: ReviewState = {
  groupLabels: { 'domain:amazon.com': 'AWS' },
  rememberedGroups: ['domain:amazon.com'],
  skippedGroups: [],
  included: {},
  edits: {},
};

/** One email row in the demo inbox (used by the video studio). */
export interface InboxRow {
  id: string;
  from: string;
  subject: string;
  /** Grey preview text after the subject. */
  snippet: string;
  date: string;
  unread?: boolean;
  attachment?: string;
  /** Links to a DEMO_ITEMS id when this email holds a receipt. */
  itemId?: string;
}

const SNIPPETS: Record<string, string> = {
  'aws-1': 'Greetings from Amazon Web Services, your invoice for October is now available.',
  'aws-2': 'Your AWS Marketplace invoice is now available.',
  'aws-3': '---------- Forwarded message --------- From: Amazon Web Services',
  'priya-1': 'Hi! Attached is the invoice for the brand refresh. Thanks for a great project.',
  'priya-2': 'Invoice for the social media templates attached. Payment terms 15 days.',
  'priya-3': 'Sorry, small fix in the earlier one. Please use this version.',
  'notion-1': 'Receipt from Notion Labs, Inc. Amount paid $10.00.',
  'figma-1': 'Receipt from Figma, Inc. Amount paid $15.00.',
  'zoho-1': 'Your payment of ₹1,180.00 to Zoho Corporation was successful.',
  'rahul-1': 'Hey, sharing the invoice for October. Let me know if anything needs changing.',
  'ride-1': 'Thanks for riding with CityRide. Total ₹342.00 · Paid by UPI.',
  'fiber-1': 'Your bill is attached. The PDF is password protected with your account number.',
};

const short = (iso?: string) => {
  if (!iso) return 'Oct 30';
  const day = Number(iso.slice(8, 10));
  return `Oct ${day}`;
};

const receiptRows: InboxRow[] = [...DEMO_ITEMS]
  .sort((a, b) => (b.fields.date ?? '2026-10-30').localeCompare(a.fields.date ?? '2026-10-30'))
  .map((item, i) => ({
    id: `mail-${item.id}`,
    from: item.fromName ?? item.fromAddress,
    subject: item.subject,
    snippet: SNIPPETS[item.id] ?? '',
    unread: i % 4 !== 3,
    date: short(item.fields.date),
    attachment: item.source === 'attachment' ? item.originalName : undefined,
    itemId: item.id,
  }));

const otherRows: InboxRow[] = [
  { id: 'n1', from: 'Product Hunt Daily', subject: 'Top 5 launches you missed this week', snippet: 'An AI that names your files, a calmer calendar, and more.', date: 'Oct 30' },
  { id: 'n2', from: 'Ananya (Client A)', subject: 'Re: Homepage feedback round 2', snippet: 'Love the new hero! Can we try the CTA in green?', date: 'Oct 18', unread: true },
  { id: 'n3', from: 'Team Standup', subject: 'Notes – sprint 42 planning', snippet: 'Agenda: release checklist, QA sign-off, retro.', date: 'Oct 9' },
  { id: 'n4', from: 'Design Weekly', subject: 'The month in design tools', snippet: 'Five plugins worth installing this month.', date: 'Oct 3' },
];

/** Newest first, with ordinary emails mixed in so it looks like a real inbox. */
export const DEMO_INBOX: InboxRow[] = (() => {
  const out: InboxRow[] = [];
  receiptRows.forEach((row, i) => {
    out.push(row);
    const other = otherRows[i / 3];
    if (i % 3 === 0 && other) out.push(other);
  });
  return out;
})();
