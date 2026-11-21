import { FILENAME_PRESETS, FOLDER_PRESETS, type InvoiceField } from '@app/core';
import {
  ExportStep,
  FindStep,
  PanelShell,
  ReviewStep,
  buildExportPlan,
  buildReviewGroups,
  type ExportStatus,
  type ReviewState,
  type ScanStatus,
  type Step,
} from '@app/ui';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  DEMO_INITIAL_REVIEW,
  DEMO_ITEMS,
  DEMO_RANGES,
  DEMO_SCAN_TOTALS,
  DEMO_ZIP_NAMES,
} from './demoData.ts';

const SCAN_MS = 2400;
const TICK_MS = 40;

/**
 * Demo state machine for the 3-step panel, fed with sample data.
 * Uses the SAME panel components + logic as the extension (packages/ui, packages/core).
 */
export function useDemoFlow() {
  const [step, setStep] = useState<Step>('find');
  const [range, setRange] = useState('last-month');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [review, setReview] = useState<ReviewState>(DEMO_INITIAL_REVIEW);
  const [fileTemplate, setFileTemplate] = useState(FILENAME_PRESETS[0]!.template);
  const [folderTemplate, setFolderTemplate] = useState(FOLDER_PRESETS[0]!.template);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    // Timers share one ID pool, so clearInterval also cancels timeouts.
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const groups = useMemo(() => buildReviewGroups(DEMO_ITEMS, review), [review]);
  const plan = useMemo(() => buildExportPlan(groups, fileTemplate, folderTemplate), [groups, fileTemplate, folderTemplate]);
  const zipName = DEMO_ZIP_NAMES[range] ?? 'invoices.zip';
  const scannedFraction = status === 'done' ? 1 : progress.total ? progress.done / progress.total : 0;

  const scan = () => {
    clearTimers();
    const total = DEMO_SCAN_TOTALS[range] ?? 64;
    const perTick = total / (SCAN_MS / TICK_MS);
    let done = 0;
    setStatus('scanning');
    setProgress({ done: 0, total });
    timers.current.push(
      window.setInterval(() => {
        done = Math.min(total, done + perTick);
        setProgress({ done: Math.round(done), total });
        if (done >= total) {
          clearTimers();
          setStatus('done');
        }
      }, TICK_MS),
    );
  };

  const updateReview = (fn: (s: ReviewState) => ReviewState) => {
    setReview(fn);
    setExportStatus('idle');
  };

  const onFieldChange = (itemId: string, field: InvoiceField, value: string) => {
    updateReview((s) => {
      const parsed = field === 'amount' ? Number.parseFloat(value.replace(/,/g, '')) : value.trim();
      const next = field === 'amount' && Number.isNaN(parsed) ? undefined : parsed;
      return { ...s, edits: { ...s.edits, [itemId]: { ...s.edits[itemId], [field]: next } } };
    });
  };

  const renderPanel = (className = '') => (
    <PanelShell class={className} step={step} onStepClick={setStep}>
      {step === 'find' && (
        <FindStep
          ranges={DEMO_RANGES}
          range={range}
          onRangeChange={(id) => {
            setRange(id);
            if (status === 'done') setStatus('idle');
          }}
          status={status}
          progress={progress}
          found={{ receipts: DEMO_ITEMS.length, senders: groups.length }}
          onScan={scan}
          onCancel={() => {
            clearTimers();
            setStatus('idle');
            setProgress({ done: 0, total: 0 });
          }}
          onContinue={() => setStep('review')}
        />
      )}
      {step === 'review' && (
        <ReviewStep
          groups={groups}
          onToggleItem={(id, include) => updateReview((s) => ({ ...s, included: { ...s.included, [id]: include } }))}
          onToggleGroup={(key, include) =>
            updateReview((s) => {
              const included = { ...s.included };
              groups
                .find((g) => g.group.key === key)
                ?.rows.forEach((r) => {
                  if (!r.item.locked) included[r.item.id] = include;
                });
              return { ...s, included };
            })
          }
          onRenameGroup={(key, label) =>
            updateReview((s) => ({
              ...s,
              groupLabels: { ...s.groupLabels, [key]: label },
              rememberedGroups: s.rememberedGroups.filter((k) => k !== key),
            }))
          }
          onSkipGroup={(key, skip) =>
            updateReview((s) => ({
              ...s,
              skippedGroups: skip ? [...s.skippedGroups, key] : s.skippedGroups.filter((k) => k !== key),
            }))
          }
          onFieldChange={onFieldChange}
          onBack={() => setStep('find')}
          onContinue={() => setStep('export')}
        />
      )}
      {step === 'export' && (
        <ExportStep
          fileTemplate={fileTemplate}
          onFileTemplateChange={(t) => {
            setFileTemplate(t);
            setExportStatus('idle');
          }}
          folderTemplate={folderTemplate}
          onFolderTemplateChange={(t) => {
            setFolderTemplate(t);
            setExportStatus('idle');
          }}
          plan={plan}
          zipName={zipName}
          status={exportStatus}
          onDownload={() => {
            setExportStatus('zipping');
            timers.current.push(window.setTimeout(() => setExportStatus('done'), 900));
          }}
          onBack={() => setStep('review')}
        />
      )}
    </PanelShell>
  );

  return { step, status, scannedFraction, plan, zipName, exportStatus, renderPanel };
}
