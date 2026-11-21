// @ts-check
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/** Repo root — the single `.env` file lives there (see `.env.example`). */
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Adds the /studio page (demo-video stage) in `astro dev` only — it is never built or deployed. */
function studio() {
  return /** @type {import('astro').AstroIntegration} */ ({
    name: 'studio',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({
          pattern: '/studio',
          entrypoint: fileURLToPath(new URL('./src/studio/studio.astro', import.meta.url)),
        });
      },
    },
  });
}

export default defineConfig({
  output: 'static',
  integrations: [preact(), studio()],
  vite: {
    envDir: repoRoot,
    plugins: [tailwindcss()],
    // packages/ui and this app must share ONE Preact copy, or hooks crash ("reading '__H'").
    resolve: { dedupe: ['preact'] },
  },
});
