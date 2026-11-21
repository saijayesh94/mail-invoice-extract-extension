import { FILENAME_PRESETS, FOLDER_PRESETS, parseTemplate, type Token } from '@app/core';
import { useRef } from 'preact/hooks';
import { ArrowLeftIcon, CheckIcon, CloudIcon, DownloadIcon, FileIcon, FolderIcon } from '../icons.tsx';
import type { ExportPlan } from './model.ts';
import { GhostButton, PrimaryButton, StepLayout } from './PanelShell.tsx';

export type ExportStatus = 'idle' | 'zipping' | 'done';

interface ExportStepProps {
  fileTemplate: string;
  onFileTemplateChange: (template: string) => void;
  folderTemplate: string;
  onFolderTemplateChange: (template: string) => void;
  plan: ExportPlan;
  zipName: string;
  status: ExportStatus;
  onDownload: () => void;
  onBack: () => void;
}

const INSERTABLE: Token[] = ['date', 'vendor', 'amount', 'currency', 'invoice_no', 'gst', 'month_name'];
const PREVIEW_LIMIT = 6;

export function ExportStep(props: ExportStepProps) {
  const { fileTemplate, onFileTemplateChange, folderTemplate, onFolderTemplateChange, plan, zipName, status } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const { unknown } = parseTemplate(fileTemplate);
  const firstFile = plan.files[0]?.path.split('/').pop();

  const insertToken = (token: Token) => {
    const el = inputRef.current;
    const text = `{${token}}`;
    if (!el) return onFileTemplateChange(fileTemplate + text);
    const start = el.selectionStart ?? fileTemplate.length;
    const end = el.selectionEnd ?? start;
    onFileTemplateChange(fileTemplate.slice(0, start) + text + fileTemplate.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const footer = (
    <div class="space-y-2">
      {status === 'done' ? (
        <div class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12.5px]" role="status">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <CheckIcon size={12} />
          </span>
          <span class="min-w-0">
            <b class="block truncate font-mono text-[12px] font-semibold">{zipName}</b>
            <span class="text-slate-600">
              {plan.files.length} PDFs + summary.csv, saved to Downloads
            </span>
          </span>
        </div>
      ) : (
        <div class="flex gap-2">
          <GhostButton onClick={props.onBack}>
            <ArrowLeftIcon size={15} /> Back
          </GhostButton>
          <PrimaryButton class="flex-1" onClick={props.onDownload} disabled={status === 'zipping' || plan.files.length === 0}>
            <DownloadIcon size={15} />
            {status === 'zipping' ? 'Building ZIP…' : 'Download ZIP'}
          </PrimaryButton>
        </div>
      )}
      <div
        class="flex items-center justify-between rounded-lg border border-dashed border-line px-3 py-2 text-[12px] text-slate-400"
        aria-disabled="true"
      >
        <span class="inline-flex items-center gap-1.5">
          <CloudIcon size={14} /> Save to Google Drive
        </span>
        <span class="rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Coming soon
        </span>
      </div>
    </div>
  );

  return (
    <StepLayout footer={footer}>
      <h2 class="text-[15px] font-semibold">Export</h2>

      <label class="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500" for="file-template">
        File name format
      </label>
      <input
        id="file-template"
        ref={inputRef}
        value={fileTemplate}
        onInput={(e) => onFileTemplateChange(e.currentTarget.value)}
        spellcheck={false}
        autocomplete="off"
        class="mt-1.5 w-full rounded-lg border border-line px-2.5 py-2 font-mono text-[12px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
      <div class="mt-1.5 flex flex-wrap gap-1" aria-label="Insert a tag">
        {INSERTABLE.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => insertToken(t)}
            class="rounded border border-line bg-white px-1.5 py-px font-mono text-[10.5px] text-slate-600 hover:border-brand hover:text-brand-dark"
          >
            +{t}
          </button>
        ))}
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span class="text-slate-500">Presets:</span>
        {FILENAME_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onFileTemplateChange(p.template)}
            class={`rounded-full px-2 py-0.5 font-medium transition ${
              p.template === fileTemplate ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {unknown.length > 0 && (
        <p class="mt-2 text-[11px] text-amber-700">
          Unknown tag {unknown.map((u) => `{${u}}`).join(', ')} — it will appear as typed.
        </p>
      )}
      {firstFile && (
        <p class="mt-2.5 rounded-md bg-emerald-50 px-2.5 py-1.5 font-mono text-[11.5px] break-all text-brand-dark">
          {firstFile}
        </p>
      )}

      <p class="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Folders</p>
      <div class="mt-1.5 inline-flex rounded-lg bg-slate-100 p-0.5" role="radiogroup" aria-label="Folder layout">
        {FOLDER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.template === folderTemplate}
            onClick={() => onFolderTemplateChange(p.template)}
            class={`rounded-md px-3 py-1 text-[12px] font-medium transition ${
              p.template === folderTemplate ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div class="mt-4 rounded-lg border border-line bg-slate-50/60 p-2.5">
        <p class="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink">
          <FolderIcon size={13} class="text-brand-dark" /> {zipName}
        </p>
        <ul class="space-y-1 pl-1">
          {plan.files.slice(0, PREVIEW_LIMIT).map((f) => (
            <li key={f.itemId} class="flex items-start gap-1.5 font-mono text-[10.5px] text-slate-600">
              <FileIcon size={11} class="mt-px shrink-0 text-slate-400" />
              <span class="break-all">{f.path}</span>
            </li>
          ))}
          {plan.files.length > PREVIEW_LIMIT && (
            <li class="pl-4 text-[10.5px] text-slate-400">… and {plan.files.length - PREVIEW_LIMIT} more</li>
          )}
          <li class="flex items-start gap-1.5 font-mono text-[10.5px] font-semibold text-brand-dark">
            <FileIcon size={11} class="mt-px shrink-0" />
            summary.csv
            <span class="font-sans font-normal text-slate-400">
              — {plan.files.length + plan.lockedCount} rows
              {plan.lockedCount > 0 && `, incl. ${plan.lockedCount} locked to add manually`}
            </span>
          </li>
        </ul>
      </div>
    </StepLayout>
  );
}
