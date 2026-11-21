import { describe, expect, it } from 'vitest';
import { findDuplicates, getGroupKey, groupBySender, registrableDomain } from '../src/index.ts';

describe('registrableDomain', () => {
  it('handles normal and two-part suffixes', () => {
    expect(registrableDomain('bills.aws.amazon.com')).toBe('amazon.com');
    expect(registrableDomain('mail.tatapower.co.in')).toBe('tatapower.co.in');
    expect(registrableDomain('example.com')).toBe('example.com');
  });
});

describe('getGroupKey', () => {
  it('groups company senders by domain', () => {
    const a = getGroupKey({ fromAddress: 'billing@aws.amazon.com', fromName: 'Amazon Web Services' });
    const b = getGroupKey({ fromAddress: 'invoices@amazon.com' });
    expect(a.key).toBe('domain:amazon.com');
    expect(b.key).toBe(a.key);
    expect(a.label).toBe('Amazon Web Services');
    expect(b.label).toBe('Amazon');
  });

  it('groups public-provider senders by full address', () => {
    const priya = getGroupKey({ fromAddress: 'Priya.Designs@gmail.com', fromName: 'Priya Sharma' });
    const rahul = getGroupKey({ fromAddress: 'rahul.dev@gmail.com' });
    expect(priya.key).toBe('address:priya.designs@gmail.com');
    expect(priya.kind).toBe('address');
    expect(priya.label).toBe('Priya Sharma');
    expect(rahul.key).not.toBe(priya.key);
    expect(rahul.label).toBe('rahul.dev');
  });

  it('groups payment-platform senders by the vendor in the document', () => {
    const notion = getGroupKey({ fromAddress: 'receipts@stripe.com', vendorFromDocument: 'Notion Labs' });
    const figma = getGroupKey({ fromAddress: 'receipts+abc@stripe.com', vendorFromDocument: 'Figma' });
    const notion2 = getGroupKey({ fromAddress: 'invoice@stripe.com', vendorFromDocument: 'notion labs' });
    expect(notion.kind).toBe('platform');
    expect(notion.platform).toBe('Stripe');
    expect(notion.key).not.toBe(figma.key);
    expect(notion2.key).toBe(notion.key);
  });

  it('marks platform receipts with no vendor as unknown', () => {
    const g = getGroupKey({ fromAddress: 'no-reply@razorpay.com' });
    expect(g.key).toBe('platform:razorpay.com:unknown');
  });
});

describe('groupBySender', () => {
  it('puts the largest groups first', () => {
    const items = [
      { from: 'a@x.com' },
      { from: 'b@y.com' },
      { from: 'c@y.com' },
    ];
    const groups = groupBySender(items, (i) => ({ fromAddress: i.from }));
    expect(groups.map((g) => [g.group.key, g.items.length])).toEqual([
      ['domain:y.com', 2],
      ['domain:x.com', 1],
    ]);
  });
});

describe('findDuplicates', () => {
  it('matches by invoice number within a group', () => {
    const dupes = findDuplicates([
      { id: '1', groupKey: 'g', fields: { invoiceNo: 'A-1' } },
      { id: '2', groupKey: 'g', fields: { invoiceNo: 'a-1 ' } },
      { id: '3', groupKey: 'other', fields: { invoiceNo: 'A-1' } },
    ]);
    expect([...dupes]).toEqual([['2', '1']]);
  });

  it('falls back to date + amount, and skips items with too little data', () => {
    const dupes = findDuplicates([
      { id: '1', groupKey: 'g', fields: { date: '2026-10-01', amount: 10, currency: 'USD' } },
      { id: '2', groupKey: 'g', fields: { date: '2026-10-01', amount: 10, currency: 'USD' } },
      { id: '3', groupKey: 'g', fields: { amount: 10 } },
      { id: '4', groupKey: 'g', fields: { amount: 10 } },
    ]);
    expect([...dupes]).toEqual([['2', '1']]);
  });
});
