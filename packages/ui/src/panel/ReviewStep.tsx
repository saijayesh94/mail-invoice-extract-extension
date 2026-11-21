import type { InvoiceField } from '@app/core';
import type { ComponentChildren } from 'preact';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LockIcon, MailIcon } from '../icons.tsx';
import { formatMoney, summarize, type ReviewGroup, type ReviewRow } from './model.ts';
import { GhostButton, PrimaryButton, StepLayout } from './PanelShell.tsx';

interface ReviewStepProps {
  groups: ReviewGroup[];
  onToggleItem: (itemId: string, include: boolean) => void;
  onToggleGroup: (groupKey: string, include: boolean) => void;
  onRenameGroup: (groupKey: string, label: string) => void;
  onSkipGroup: (groupKey: string, skip: boolean) => void;
  onFieldChange: (itemId: string, field: InvoiceField, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ReviewStep(props: ReviewStepProps) {
  const summary = summarize(props.groups);

  return (
    <StepLayout
      footer={
        <div class="flex gap-2">
          <GhostButton onClick={props.onBack}>
            <ArrowLeftIcon size={15} /> Back
          </GhostButton>
          <PrimaryButton class="flex-1" onClick={props.onContinue} disabled={summary.selected === 0}>
            Export {summary.selected} files <ArrowRightIcon size={15} />
          </PrimaryButton>
        </div>
      }
    >
      <div class="flex items-center justify-between">
        <h2 class="text-[15px] font-semibold">Review</h2>
        <span class="text-[11.5px] text-slate-500">
          <b class="font-semibold text-ink">{summary.selected}</b> of {summary.total} selected
        </span>
      </div>
      <p class="mt-1 text-[12.5px] leading-relaxed text-slate-500">
        Rename a sender once — every invoice in the group follows, and we remember it next month.
      </p>
      {summary.needsCheck > 0 && (
        <p class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11.5px] text-amber-800">
          <span class="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          {summary.needsCheck} {summary.needsCheck === 1 ? 'field needs' : 'fields need'} a quick check
        </p>
      )}

      <div class="mt-3 space-y-2.5">
        {props.groups.map((g) => (
          <GroupCard key={g.group.key} g={g} {...props} />
        ))}
      </div>
    </StepLayout>
  );
}

function GroupCard({ g, onToggleGroup, onToggleItem, onRenameGroup, onSkipGroup, onFieldChange }: ReviewStepProps & { g: ReviewGroup }) {
  const key = g.group.key;

  if (g.skipped) {
    return (
      <div class="flex items-center justify-between rounded-xl border border-dashed border-line px-3 py-2 text-[12px] text-slate-500">
        <span class="truncate">
          <s>{g.label}</s> · skipped, also next time
        </span>
        <button type="button" class="font-medium text-brand-dark hover:underline" onClick={() => onSkipGroup(key, false)}>
          Undo
        </button>
      </div>
    );
  }

  const selectable = g.rows.filter((r) => !r.item.locked);
  const onCount = selectable.filter((r) => r.include).length;
  const allOn = selectable.length > 0 && onCount === selectable.length;
  const someOn = onCount > 0 && !allOn;

  return (
    <section class="overflow-hidden rounded-xl border border-line" aria-label={`Sender group ${g.label}`}>
      <div class="flex items-start gap-2.5 border-b border-line bg-slate-50/70 px-3 py-2">
        <input
          type="checkbox"
          class="mt-1.5 h-3.5 w-3.5 accent-brand"
          checked={allOn}
          indeterminate={someOn}
          disabled={selectable.length === 0}
          onChange={() => onToggleGroup(key, !allOn)}
          aria-label={`Include all from ${g.label}`}
        />
        <div class="min-w-0 flex-1">
          <input
            value={g.label}
            onInput={(e) => onRenameGroup(key, e.currentTarget.value)}
            aria-label="Vendor name for this sender"
            title="Click to rename — applies to every invoice from this sender"
            class="-mx-1 w-full rounded px-1 py-0.5 text-[13px] font-semibold text-ink outline-none hover:bg-white focus:bg-white focus:ring-1 focus:ring-brand"
          />
          <p class="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
            <span>
              {g.rows.length} {g.rows.length === 1 ? 'invoice' : 'invoices'}
            </span>
            <span aria-hidden="true">·</span>
            <span class="truncate">{g.detail}</span>
            {g.remembered && (
              <span class="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-50 px-1 text-[10px] font-medium text-brand-dark">
                <CheckIcon size={9} /> remembered
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSkipGroup(key, true)}
          class="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-white hover:text-ink"
        >
          Skip sender
        </button>
      </div>

      <ul class="divide-y divide-line">
        {g.rows.map((row) => (
          <Row key={row.item.id} row={row} onToggleItem={onToggleItem} onFieldChange={onFieldChange} />
        ))}
      </ul>
    </section>
  );
}

function Row({
  row,
  onToggleItem,
  onFieldChange,
}: {
  row: ReviewRow;
  onToggleItem: ReviewStepProps['onToggleItem'];
  onFieldChange: ReviewStepProps['onFieldChange'];
}) {
  const { item, fields } = row;
  const check = (f: InvoiceField) => row.needsCheck.includes(f);
  const lowField = (f: InvoiceField) => item.lowConfidence?.includes(f);

  return (
    <li class={`flex items-center gap-2.5 px-3 py-2 ${row.include ? '' : 'bg-slate-50/50'}`}>
      <input
        type="checkbox"
        class="h-3.5 w-3.5 accent-brand"
        checked={row.include}
        disabled={item.locked}
        onChange={(e) => onToggleItem(item.id, e.currentTarget.checked)}
        aria-label={`Include ${item.originalName}`}
      />
      <div class={`min-w-0 flex-1 ${row.include ? '' : 'opacity-60'}`}>
        <div class="flex items-center gap-1.5 text-[12px]">
          {lowField('date') ? (
            <input
              value={fields.date ?? ''}
              placeholder="YYYY-MM-DD"
              onInput={(e) => onFieldChange(item.id, 'date', e.currentTarget.value)}
              aria-label="Invoice date"
              class={`w-[86px] rounded px-1 py-0.5 font-mono text-[11px] outline-none focus:ring-1 focus:ring-brand ${
                check('date') ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50'
              }`}
            />
          ) : (
            <span class="font-mono text-[11px] text-slate-600">{fields.date ?? 'No date'}</span>
          )}
          <span class="truncate font-mono text-[10.5px] text-slate-400" title={item.subject}>
            {item.originalName}
          </span>
        </div>
        {(item.locked || row.duplicateOf || item.source === 'email-body') && (
          <div class="mt-1 flex flex-wrap gap-1">
            {item.locked && (
              <Badge tone="slate">
                <LockIcon size={9} /> Locked — add manually
              </Badge>
            )}
            {row.duplicateOf && <Badge tone="amber">Duplicate</Badge>}
            {item.source === 'email-body' && (
              <Badge tone="sky">
                <MailIcon size={9} /> Saved from email text
              </Badge>
            )}
          </div>
        )}
      </div>
      {item.locked ? (
        <span class="text-[12px] text-slate-400">—</span>
      ) : lowField('amount') ? (
        <input
          value={fields.amount ?? ''}
          inputMode="decimal"
          // onChange (on blur), so typing "12." isn't reformatted mid-keystroke.
          onChange={(e) => onFieldChange(item.id, 'amount', e.currentTarget.value)}
          aria-label="Amount"
          class={`w-[72px] rounded px-1 py-0.5 text-right font-mono text-[11.5px] outline-none focus:ring-1 focus:ring-brand ${
            check('amount') ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50'
          }`}
        />
      ) : (
        <span class={`text-right text-[12px] font-semibold tabular-nums ${row.include ? 'text-ink' : 'text-slate-400'}`}>
          {formatMoney(fields.amount, fields.currency)}
        </span>
      )}
    </li>
  );
}

function Badge({ tone, children }: { tone: 'slate' | 'amber' | 'sky'; children: ComponentChildren }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-700',
  };
  return (
    <span class={`inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
