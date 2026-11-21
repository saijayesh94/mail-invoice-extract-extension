import {
  dedupePaths,
  findDuplicates,
  getGroupKey,
  renderFilename,
  renderFolderPath,
  type FormatOptions,
  type GroupKey,
  type InvoiceField,
  type InvoiceFields,
} from '@app/core';

/**
 * View model for the 3-step panel (CLAUDE.md §4).
 * The extension feeds real scan results in; the landing-page simulator feeds demo data.
 */

export type Step = 'find' | 'review' | 'export';

export const STEPS: { id: Step; label: string }[] = [
  { id: 'find', label: 'Find' },
  { id: 'review', label: 'Review' },
  { id: 'export', label: 'Export' },
];

export interface FoundItem {
  id: string;
  fromName?: string;
  fromAddress: string;
  subject: string;
  /** Attachment file name as received, e.g. `invoice (12).pdf`. */
  originalName: string;
  source: 'attachment' | 'email-body';
  /** Vendor named inside the document (needed for Stripe/Razorpay/… senders). */
  vendorFromDocument?: string;
  fields: InvoiceFields;
  /** Fields the reader is unsure about — highlighted for the user to check. */
  lowConfidence?: InvoiceField[];
  /** Password-protected PDF: can't be read, user adds it manually. */
  locked?: boolean;
}

export interface ReviewState {
  /** User's (or remembered) vendor name per group key. */
  groupLabels: Record<string, string>;
  /** Group keys whose label came from a previous scan. */
  rememberedGroups: string[];
  skippedGroups: string[];
  /** Per-item include/exclude chosen by the user. */
  included: Record<string, boolean>;
  /** Per-item field corrections. */
  edits: Record<string, Partial<InvoiceFields>>;
}

export const emptyReviewState = (): ReviewState => ({
  groupLabels: {},
  rememberedGroups: [],
  skippedGroups: [],
  included: {},
  edits: {},
});

export interface ReviewRow {
  item: FoundItem;
  /** Fields after the user's corrections (vendor not applied — that comes from the group). */
  fields: InvoiceFields;
  include: boolean;
  duplicateOf?: string;
  /** Low-confidence fields the user has not corrected yet. */
  needsCheck: InvoiceField[];
}

export interface ReviewGroup {
  group: GroupKey;
  label: string;
  /** What to show under the name: domain, full address, or "via Stripe". */
  detail: string;
  remembered: boolean;
  skipped: boolean;
  rows: ReviewRow[];
}

export function buildReviewGroups(items: FoundItem[], state: ReviewState): ReviewGroup[] {
  const keyed = items.map((item) => ({
    item,
    group: getGroupKey({
      fromAddress: item.fromAddress,
      fromName: item.fromName,
      vendorFromDocument: item.vendorFromDocument,
    }),
  }));

  const duplicates = findDuplicates(
    keyed.map(({ item, group }) => ({
      id: item.id,
      groupKey: group.key,
      fields: { ...item.fields, ...state.edits[item.id] },
    })),
  );

  const groups = new Map<string, ReviewGroup>();
  for (const { item, group } of keyed) {
    let entry = groups.get(group.key);
    if (!entry) {
      entry = {
        group,
        label: state.groupLabels[group.key] ?? group.label,
        detail:
          group.kind === 'platform'
            ? `via ${group.platform}`
            : group.kind === 'address'
              ? item.fromAddress.toLowerCase()
              : group.senderDomain,
        remembered: state.rememberedGroups.includes(group.key),
        skipped: state.skippedGroups.includes(group.key),
        rows: [],
      };
      groups.set(group.key, entry);
    }

    const edits = state.edits[item.id] ?? {};
    const duplicateOf = duplicates.get(item.id);
    const defaultInclude = !item.locked && !duplicateOf;
    entry.rows.push({
      item,
      fields: { ...item.fields, ...edits },
      include: !item.locked && (state.included[item.id] ?? defaultInclude),
      duplicateOf,
      needsCheck: (item.lowConfidence ?? []).filter((f) => !(f in edits)),
    });
  }

  return [...groups.values()].sort((a, b) => b.rows.length - a.rows.length);
}

export function isExported(group: ReviewGroup, row: ReviewRow): boolean {
  return !group.skipped && row.include && !row.item.locked;
}

export interface ReviewSummary {
  total: number;
  selected: number;
  needsCheck: number;
  senders: number;
}

export function summarize(groups: ReviewGroup[]): ReviewSummary {
  let total = 0;
  let selected = 0;
  let needsCheck = 0;
  for (const group of groups) {
    for (const row of group.rows) {
      total++;
      if (isExported(group, row)) {
        selected++;
        if (row.needsCheck.length) needsCheck++;
      }
    }
  }
  return { total, selected, needsCheck, senders: groups.length };
}

export interface ExportFile {
  itemId: string;
  path: string;
}

export interface ExportPlan {
  files: ExportFile[];
  /** Locked PDFs — listed in summary.csv as "add manually". */
  lockedCount: number;
}

export function buildExportPlan(
  groups: ReviewGroup[],
  fileTemplate: string,
  folderTemplate: string,
  opts: FormatOptions = {},
): ExportPlan {
  const ids: string[] = [];
  const paths: string[] = [];
  let lockedCount = 0;

  for (const group of groups) {
    for (const row of group.rows) {
      if (row.item.locked && !group.skipped) lockedCount++;
      if (!isExported(group, row)) continue;
      const fields = { ...row.fields, vendor: group.label };
      const folder = renderFolderPath(folderTemplate, fields, opts);
      const name = renderFilename(fileTemplate, fields, opts);
      ids.push(row.item.id);
      paths.push(folder ? `${folder}/${name}` : name);
    }
  }

  const unique = dedupePaths(paths);
  return {
    files: unique.map((path, i) => ({ itemId: ids[i]!, path })),
    lockedCount,
  };
}

export function formatMoney(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ''}`.trim();
  }
}
