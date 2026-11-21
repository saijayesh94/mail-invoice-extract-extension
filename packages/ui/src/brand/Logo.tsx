import { BRAND, LOGO_MARK_SVG } from './brand.ts';

interface LogoMarkProps {
  size?: number;
  class?: string;
}

export function LogoMark({ size = 28, class: className = '' }: LogoMarkProps) {
  return (
    <span
      class={`inline-block shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
      // Trusted constant from brand.ts — the single source for the mark.
      dangerouslySetInnerHTML={{ __html: LOGO_MARK_SVG }}
    />
  );
}

interface LogoProps extends LogoMarkProps {
  textClass?: string;
}

export function Logo({ size = 28, class: className = '', textClass = 'text-lg' }: LogoProps) {
  return (
    <span class={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span class={`font-semibold tracking-tight text-ink ${textClass}`}>{BRAND.name}</span>
    </span>
  );
}
