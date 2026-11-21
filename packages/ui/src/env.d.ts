// Vite-based apps (website, extension) inject these at build time from the repo-root `.env`.
interface ImportMetaEnv {
  readonly PUBLIC_BRAND_NAME?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
