/**
 * THE one place to change the product name and logo (CLAUDE.md §8).
 * Used by: site header, favicon (apps/web/src/pages/favicon.svg.ts), extension panel, extension icons.
 */
export const BRAND = {
  /** Set PUBLIC_BRAND_NAME in the repo-root `.env`. "InvoiceSnap" is only a placeholder. */
  name: import.meta.env?.PUBLIC_BRAND_NAME?.trim() || 'InvoiceSnap',
  shortPitch: 'Gmail invoices, renamed and ready for your accountant.',
} as const;

/** Logo mark: emerald tile with a document and a check. Keep colours in sync with theme.css. */
export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%"><rect width="32" height="32" rx="8" fill="#10B981"/><path d="M10.5 6.5h7.75l5.25 5.25V24.5a1.5 1.5 0 0 1-1.5 1.5h-11.5A1.5 1.5 0 0 1 9 24.5V8a1.5 1.5 0 0 1 1.5-1.5z" fill="#FFFFFF"/><path d="M18.25 6.5v4.25a1 1 0 0 0 1 1h4.25z" fill="#A7F3D0"/><path d="M12.5 18.5l2.6 2.6 4.9-5.1" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
