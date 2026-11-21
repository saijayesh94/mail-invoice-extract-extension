interface ImportMetaEnv {
  readonly PUBLIC_BRAND_NAME?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_CHECKOUT_URL?: string;
  readonly PUBLIC_BUSINESS_LEGAL_NAME?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_BUSINESS_ADDRESS?: string;
  readonly PUBLIC_JURISDICTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
