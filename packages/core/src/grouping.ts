/**
 * Sender grouping — see CLAUDE.md §5.
 *  - company domain  → group by registrable domain (billing@aws.amazon.com + invoices@amazon.com = amazon.com)
 *  - public provider → group by full address (two @gmail.com contractors stay separate)
 *  - payment platform (Stripe, Razorpay…) → group by the vendor named in the document, not the sender
 */

export interface SenderInfo {
  fromAddress: string;
  fromName?: string;
  /** Vendor name read from the PDF/email body. Needed for payment-platform senders. */
  vendorFromDocument?: string;
}

export type GroupKind = 'domain' | 'address' | 'platform';

export interface GroupKey {
  /** Stable key, used to remember the user's group edits between scans. */
  key: string;
  kind: GroupKind;
  /** Suggested display name; the user can rename it. */
  label: string;
  /** Registrable domain of the sender, e.g. `stripe.com`. */
  senderDomain: string;
  /** Set for payment-platform groups, e.g. `Stripe`. */
  platform?: string;
}

export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.net', 'mail.com',
  'zohomail.com', 'zohomail.in', 'rediffmail.com', 'yandex.com', 'fastmail.com', 'hey.com',
]);

/** Payment platforms that send receipts on behalf of many different vendors. */
export const PAYMENT_PLATFORMS: Record<string, string> = {
  'stripe.com': 'Stripe',
  'paddle.com': 'Paddle',
  'paddle.net': 'Paddle',
  'razorpay.com': 'Razorpay',
  'paypal.com': 'PayPal',
  'chargebee.com': 'Chargebee',
  'lemonsqueezy.com': 'Lemon Squeezy',
  'gumroad.com': 'Gumroad',
  'fastspring.com': 'FastSpring',
  'recurly.com': 'Recurly',
  'cashfree.com': 'Cashfree',
  'instamojo.com': 'Instamojo',
  'dodopayments.com': 'Dodo Payments',
};

/** Two-part public suffixes we care about. Not a full public-suffix list, on purpose. */
const MULTI_PART_SUFFIXES = new Set([
  'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'ac.in', 'gov.in',
  'co.uk', 'org.uk', 'ac.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp',
  'com.sg', 'com.my', 'com.br', 'co.za', 'com.mx', 'com.tr', 'co.id', 'com.ph',
]);

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/^<|>$/g, '');
}

export function registrableDomain(host: string): string {
  const parts = host.toLowerCase().replace(/\.$/, '').split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_SUFFIXES.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

function normalizeVendorKey(vendor: string): string {
  return vendor.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function titleFromDomain(domain: string): string {
  const name = domain.split('.')[0] ?? domain;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getGroupKey(sender: SenderInfo): GroupKey {
  const address = normalizeAddress(sender.fromAddress);
  const host = address.split('@')[1] ?? '';
  const domain = registrableDomain(host);
  const name = sender.fromName?.trim();

  const platform = PAYMENT_PLATFORMS[domain];
  if (platform) {
    const vendor = sender.vendorFromDocument?.trim();
    return {
      key: `platform:${domain}:${vendor ? normalizeVendorKey(vendor) : 'unknown'}`,
      kind: 'platform',
      label: vendor || `Unknown vendor`,
      senderDomain: domain,
      platform,
    };
  }

  if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return {
      key: `address:${address}`,
      kind: 'address',
      label: name || address.split('@')[0] || address,
      senderDomain: domain,
    };
  }

  return {
    key: `domain:${domain}`,
    kind: 'domain',
    label: name || titleFromDomain(domain),
    senderDomain: domain,
  };
}

export interface Group<T> {
  group: GroupKey;
  items: T[];
}

/** Groups items by sender. Largest groups first; ties keep first-seen order. */
export function groupBySender<T>(items: T[], getSender: (item: T) => SenderInfo): Group<T>[] {
  const byKey = new Map<string, Group<T>>();
  for (const item of items) {
    const group = getGroupKey(getSender(item));
    const existing = byKey.get(group.key);
    if (existing) existing.items.push(item);
    else byKey.set(group.key, { group, items: [item] });
  }
  return [...byKey.values()].sort((a, b) => b.items.length - a.items.length);
}
