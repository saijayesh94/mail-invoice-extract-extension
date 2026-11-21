import { BRAND } from '@app/ui';

/**
 * Site settings. Values come from `.env` at the repo root (copy `.env.example`).
 * Empty values fall back to visible placeholders so nothing silently looks "done".
 * Product name + logo: packages/ui/src/brand/brand.ts (name also reads PUBLIC_BRAND_NAME).
 */
const env = import.meta.env;
const pick = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const checkoutUrl = env.PUBLIC_CHECKOUT_URL?.trim() ?? '';

export const SITE = {
  name: BRAND.name,
  url: pick(env.PUBLIC_SITE_URL, 'https://example.pages.dev'),
  checkoutUrl,

  price: { display: '$19', amount: 19, currency: 'USD' },
  /** What typical receipt apps cost per month — used in the comparison. */
  competitorMonthly: '$20–$50',

  deliveryDays: 30,
  refundDaysAfterDelivery: 14,
  devicesPerLicense: 3,
  trialFiles: 10,

  business: {
    legalName: pick(env.PUBLIC_BUSINESS_LEGAL_NAME, '[Your Business Legal Name]'),
    email: pick(env.PUBLIC_CONTACT_EMAIL, 'support@example.com'),
    address: pick(env.PUBLIC_BUSINESS_ADDRESS, '[Business address]'),
    jurisdiction: pick(env.PUBLIC_JURISDICTION, '[City, State], India'),
  },

  policiesUpdated: '21 November 2026',
} as const;

/** Until a checkout link is set, buy buttons scroll to #pricing instead. */
export const CHECKOUT_READY = /^https:\/\//.test(checkoutUrl);
export const CHECKOUT_HREF = CHECKOUT_READY ? checkoutUrl : '#pricing';
