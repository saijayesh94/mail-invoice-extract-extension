import { ArrowRightIcon, CheckIcon, SearchIcon } from '../icons.tsx';
import { GhostButton, PrimaryButton, StepLayout } from './PanelShell.tsx';

export interface RangeOption {
  id: string;
  label: string;
  /** e.g. "Oct 2026" or "Apr – Nov 2026" */
  hint: string;
}

export type ScanStatus = 'idle' | 'scanning' | 'done';

interface FindStepProps {
  ranges: RangeOption[];
  range: string;
  onRangeChange: (id: string) => void;
  status: ScanStatus;
  progress: { done: number; total: number };
  found: { receipts: number; senders: number };
  onScan: () => void;
  onCancel: () => void;
  onContinue: () => void;
}

const LOOKS_FOR = ['invoice', 'receipt', 'bill', 'tax invoice', 'Stripe · Razorpay · Paddle'];

export function FindStep(props: FindStepProps) {
  const { ranges, range, onRangeChange, status, progress, found, onScan, onCancel, onContinue } = props;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const footer =
    status === 'done' ? (
      <PrimaryButton class="w-full" onClick={onContinue}>
        Review {found.receipts} receipts <ArrowRightIcon size={15} />
      </PrimaryButton>
    ) : status === 'scanning' ? (
      <GhostButton class="w-full" onClick={onCancel}>
        Cancel
      </GhostButton>
    ) : (
      <PrimaryButton class="w-full" onClick={onScan}>
        <SearchIcon size={15} /> Scan Gmail
      </PrimaryButton>
    );

  return (
    <StepLayout footer={footer}>
      <h2 class="text-[15px] font-semibold">Find receipts</h2>
      <p class="mt-1 text-[12.5px] leading-relaxed text-slate-500">
        Pick a period. We search this Gmail account for PDF attachments and receipts written in the email itself.
      </p>

      <fieldset class="mt-4" disabled={status === 'scanning'}>
        <legend class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Period</legend>
        <div class="grid grid-cols-3 gap-2">
          {ranges.map((r) => {
            const active = r.id === range;
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={active}
                onClick={() => onRangeChange(r.id)}
                class={`rounded-lg border px-2 py-2 text-left transition ${
                  active
                    ? 'border-brand bg-emerald-50 ring-1 ring-brand'
                    : 'border-line hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span class={`block text-[12px] font-semibold ${active ? 'text-brand-dark' : 'text-ink'}`}>
                  {r.label}
                </span>
                <span class="mt-0.5 block text-[10.5px] text-slate-500">{r.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div class="mt-4">
        <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Looks for</p>
        <div class="flex flex-wrap gap-1.5">
          {LOOKS_FOR.map((w) => (
            <span key={w} class="rounded-md border border-line bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
              {w}
            </span>
          ))}
        </div>
      </div>

      {status === 'scanning' && (
        <div class="mt-5" role="status" aria-live="polite">
          <div class="flex justify-between text-[12px]">
            <span class="font-medium">Reading emails…</span>
            <span class="font-mono text-slate-500">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
          <p class="mt-2 text-[11px] text-slate-500">Everything is read here, in your browser. Nothing is uploaded.</p>
        </div>
      )}

      {status === 'done' && (
        <div class="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3" role="status">
          <span class="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
            <CheckIcon size={12} />
          </span>
          <div>
            <p class="text-[13px] font-semibold">
              Found {found.receipts} receipts from {found.senders} senders
            </p>
            <p class="mt-0.5 text-[11.5px] text-slate-600">Grouped by sender, ready for a quick check.</p>
          </div>
        </div>
      )}
    </StepLayout>
  );
}
