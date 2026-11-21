import type { InvoiceFields } from './types.ts';

export interface DuplicateCandidate {
  id: string;
  /** Group key from `getGroupKey`, so the same invoice no. from two vendors is not a duplicate. */
  groupKey: string;
  fields: InvoiceFields;
}

function fingerprint(item: DuplicateCandidate): string | null {
  const { invoiceNo, date, amount, currency } = item.fields;
  if (invoiceNo) return `${item.groupKey}|no:${invoiceNo.trim().toLowerCase()}`;
  if (date && amount !== undefined) return `${item.groupKey}|${date}|${amount}|${currency ?? ''}`;
  return null; // not enough data to call it a duplicate safely
}

/**
 * Finds duplicates (e.g. the same invoice forwarded twice).
 * Returns a map of duplicate id → id of the first copy seen.
 */
export function findDuplicates(items: DuplicateCandidate[]): Map<string, string> {
  const firstSeen = new Map<string, string>();
  const duplicates = new Map<string, string>();
  for (const item of items) {
    const key = fingerprint(item);
    if (!key) continue;
    const original = firstSeen.get(key);
    if (original) duplicates.set(item.id, original);
    else firstSeen.set(key, item.id);
  }
  return duplicates;
}
