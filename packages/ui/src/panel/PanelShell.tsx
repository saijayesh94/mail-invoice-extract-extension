import type { ComponentChildren } from 'preact';
import { Logo } from '../brand/Logo.tsx';
import { CheckIcon, LockIcon } from '../icons.tsx';
import { STEPS, type Step } from './model.ts';

interface PanelShellProps {
  step: Step;
  /** Optional: lets the user jump between steps (simulator only). */
  onStepClick?: (step: Step) => void;
  class?: string;
  children: ComponentChildren;
}

/** Frame of the extension side panel: header, 3-step progress, content. */
export function PanelShell({ step, onStepClick, class: className = '', children }: PanelShellProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div class={`flex flex-col overflow-hidden bg-white font-sans text-ink ${className}`}>
      <header class="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <Logo size={22} textClass="text-[15px]" />
        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
          <LockIcon size={11} />
          Runs in your browser
        </span>
      </header>

      <nav aria-label="Steps" class="border-b border-line px-4 py-2.5">
        <ol class="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            const clickable = Boolean(onStepClick) && i <= activeIndex;
            return (
              <li key={s.id} class="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStepClick?.(s.id)}
                  aria-current={active ? 'step' : undefined}
                  class={`flex items-center gap-1.5 text-[12px] font-medium ${
                    active ? 'text-ink' : done ? 'text-brand-dark' : 'text-slate-400'
                  } ${clickable && !active ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                >
                  <span
                    class={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active
                        ? 'bg-brand text-white'
                        : done
                          ? 'bg-emerald-100 text-brand-dark'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <CheckIcon size={11} /> : i + 1}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <span class={`h-px flex-1 ${done ? 'bg-emerald-200' : 'bg-line'}`} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div class="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Scrollable body + pinned footer, used by each step. */
export function StepLayout({ children, footer }: { children: ComponentChildren; footer?: ComponentChildren }) {
  return (
    <>
      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && <div class="border-t border-line bg-white px-4 py-3">{footer}</div>}
    </>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  class: className = '',
}: {
  children: ComponentChildren;
  onClick?: () => void;
  disabled?: boolean;
  class?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      class={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  class: className = '',
}: {
  children: ComponentChildren;
  onClick?: () => void;
  class?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}
