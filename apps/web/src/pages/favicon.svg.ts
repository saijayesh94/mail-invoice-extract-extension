import { LOGO_MARK_SVG } from '@app/ui';

/** Favicon generated from the single logo source in packages/ui/src/brand/brand.ts. */
export function GET() {
  return new Response(LOGO_MARK_SVG, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
