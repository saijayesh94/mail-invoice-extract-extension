import { BRAND, CheckIcon, FileIcon, FolderIcon, LogoMark, type ExportPlan } from '@app/ui';
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { DEMO_INBOX, type InboxRow } from '../components/demo/demoData.ts';
import { useDemoFlow } from '../components/demo/useDemoFlow.tsx';

/**
 * DEV-ONLY recording stage for the landing-page video (route /studio, see astro.config.mjs).
 * A Gmail-STYLE inbox inside a Chrome-style window, with our extension in the Chrome side panel.
 * On purpose: no Google logo or "Gmail" wordmark — it must not look like an official Google asset.
 * Driven by tools/demo-video/record.mjs through `data-rec` hooks and `window.__studio`.
 */

const G = {
  bg: '#F6F8FC',
  search: '#EAF1FB',
  compose: '#C2E7FF',
  navActive: '#D3E3FD',
  text: '#1F1F1F',
  sub: '#444746',
  readRow: '#F2F6FC',
  frame: '#DFE3E7',
  omnibox: '#E9EEF6',
};

declare global {
  interface Window {
    __studio?: { showEnd: () => void; openExplorer: () => void };
  }
}

export default function GmailStage() {
  const flow = useDemoFlow();
  const [panelOpen, setPanelOpen] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [explorer, setExplorer] = useState(false);
  const [endCard, setEndCard] = useState(false);

  useEffect(() => {
    if (flow.exportStatus !== 'done') return setBubble(false);
    const t = window.setTimeout(() => setBubble(true), 300);
    return () => clearTimeout(t);
  }, [flow.exportStatus]);

  useEffect(() => {
    window.__studio = { showEnd: () => setEndCard(true), openExplorer: () => setExplorer(true) };
  }, []);

  return (
    <div class="relative flex h-screen w-screen flex-col overflow-hidden" style={{ background: G.frame, fontFamily: 'Roboto, Arial, sans-serif' }}>
      <ChromeTabs />
      <ChromeToolbar
        onExtensionClick={() => setPanelOpen((o) => !o)}
        extensionActive={panelOpen}
        bubble={bubble ? flow.zipName : null}
        onBubbleClick={() => setExplorer(true)}
      />
      <div class="flex min-h-0 flex-1 bg-white">
        <GmailApp status={flow.status} scannedFraction={flow.scannedFraction} />
        <aside
          class="shrink-0 overflow-hidden transition-[width] duration-500 ease-out"
          style={{ width: panelOpen ? '400px' : '0px' }}
          aria-label="Side panel"
        >
          <div class="flex h-full w-[400px] flex-col border-l" style={{ borderColor: '#DADCE0' }}>
            <div class="flex h-11 shrink-0 items-center justify-between border-b px-3" style={{ borderColor: '#DADCE0' }}>
              <span class="flex items-center gap-2 text-[13px] font-medium" style={{ color: G.text }}>
                <LogoMark size={16} /> {BRAND.name}
                <ChevronDown />
              </span>
              <span class="flex items-center gap-3 text-[#5F6368]">
                <PinGlyph />
                <CloseGlyph />
              </span>
            </div>
            {flow.renderPanel('min-h-0 flex-1')}
          </div>
        </aside>
      </div>

      {explorer && <Explorer plan={flow.plan} zipName={flow.zipName} />}
      {endCard && <EndCard />}
    </div>
  );
}

/* ───────────────────────── Chrome window ───────────────────────── */

function ChromeTabs() {
  return (
    <div class="flex h-10 shrink-0 items-end gap-1 px-2">
      <span class="mb-3 ml-1 mr-3 flex gap-2">
        <span class="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span class="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span class="h-3 w-3 rounded-full bg-[#28C840]" />
      </span>
      <div class="flex h-8 w-60 items-center gap-2 rounded-t-lg bg-white px-3 text-[12px] text-[#1F1F1F]">
        <EnvelopeGlyph size={14} color="#C5221F" />
        <span class="truncate">Inbox (9) - you@yourstudio.com</span>
        <span class="ml-auto text-[#5F6368]">×</span>
      </div>
      <div class="flex h-8 w-48 items-center gap-2 px-3 text-[12px] text-[#5F6368]">
        <span class="h-3.5 w-3.5 rounded-sm bg-[#C4C7C5]" />
        <span class="truncate">Project tracker</span>
      </div>
      <span class="mb-1.5 ml-1 text-lg leading-none text-[#5F6368]">+</span>
    </div>
  );
}

function ChromeToolbar({
  onExtensionClick,
  extensionActive,
  bubble,
  onBubbleClick,
}: {
  onExtensionClick: () => void;
  extensionActive: boolean;
  bubble: string | null;
  onBubbleClick: () => void;
}) {
  return (
    <div class="relative z-20 flex h-11 shrink-0 items-center gap-3 border-b bg-white px-3" style={{ borderColor: '#DADCE0' }}>
      <span class="flex items-center gap-4 text-[#5F6368]">
        <NavArrow dir="left" />
        <NavArrow dir="right" />
        <ReloadGlyph />
      </span>
      <div class="flex h-8 flex-1 items-center gap-2 rounded-full px-4 text-[13px]" style={{ background: G.omnibox }}>
        <TuneGlyph />
        <span class="text-[#1F1F1F]">mail.google.com</span>
        <span class="text-[#5F6368]">/mail/u/0/#inbox</span>
      </div>
      <span class="flex items-center gap-1.5">
        <button
          type="button"
          data-rec="extension-icon"
          onClick={onExtensionClick}
          class={`rounded-full p-1.5 transition ${extensionActive ? 'bg-[#D3E3FD]' : 'hover:bg-[#F1F3F4]'}`}
          aria-label={`${BRAND.name} extension`}
        >
          <LogoMark size={18} />
        </button>
        <span class="p-1.5 text-[#5F6368]">
          <PuzzleGlyph />
        </span>
        <span class="relative p-1.5 text-[#5F6368]">
          <DownloadGlyph />
          {bubble && <span class="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />}
        </span>
        <span class="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#7B61FF] text-[12px] font-medium text-white">Y</span>
      </span>

      {bubble && (
        <button
          type="button"
          data-rec="download-bubble"
          onClick={onBubbleClick}
          class="animate-[studio-pop_.35s_ease-out] absolute top-12 right-14 w-[340px] rounded-xl bg-white p-3 text-left shadow-[0_8px_28px_rgba(60,64,67,.28)]"
        >
          <p class="text-[12px] font-medium text-[#5F6368]">Recent download history</p>
          <div class="mt-2 flex items-center gap-3 rounded-lg p-2 hover:bg-[#F1F3F4]">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-brand-dark">
              <FolderIcon size={18} />
            </span>
            <span class="min-w-0">
              <span class="block truncate font-mono text-[12.5px] font-semibold text-[#1F1F1F]">{bubble}</span>
              <span class="block text-[11.5px] text-[#5F6368]">186 KB · Done</span>
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Gmail-style app ───────────────────────── */

function GmailApp({ status, scannedFraction }: { status: string; scannedFraction: number }) {
  const scannedRows = Math.floor(scannedFraction * DEMO_INBOX.length);
  return (
    <div class="flex min-w-0 flex-1 flex-col" style={{ background: G.bg, color: G.text }}>
      {/* Header */}
      <div class="flex h-16 shrink-0 items-center gap-4 px-4">
        <span class="flex w-[220px] shrink-0 items-center gap-4 text-[#444746]">
          <MenuGlyph />
          <span class="flex items-center gap-2">
            <EnvelopeGlyph size={26} color="#5F6368" />
            <span class="text-[22px] text-[#444746]">Mail</span>
          </span>
        </span>
        <div class="flex h-12 max-w-[720px] flex-1 items-center gap-3 rounded-full px-4 text-[#444746]" style={{ background: G.search }}>
          <SearchGlyph />
          <span class="flex-1 text-[15px]">Search mail</span>
          <TuneGlyph />
        </div>
        <span class="ml-auto flex items-center gap-4 text-[#444746]">
          <HelpGlyph />
          <GearGlyph />
          <AppsGlyph />
        </span>
      </div>

      <div class="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav class="w-[220px] shrink-0 pr-2 pl-2">
          <span class="mb-4 ml-1 inline-flex h-14 items-center gap-3 rounded-2xl px-5 text-[14px] font-medium" style={{ background: G.compose }}>
            <PencilGlyph /> Compose
          </span>
          {[
            ['Inbox', '9', true],
            ['Starred', '', false],
            ['Snoozed', '', false],
            ['Sent', '', false],
            ['Drafts', '3', false],
            ['More', '', false],
          ].map(([label, count, active]) => (
            <div
              key={label as string}
              class={`flex h-8 items-center gap-4 rounded-r-full pr-3 pl-6 text-[14px] ${active ? 'font-bold' : ''}`}
              style={{ background: active ? G.navActive : 'transparent' }}
            >
              <NavDot active={Boolean(active)} />
              <span class="flex-1">{label}</span>
              <span class="text-[12px]">{count}</span>
            </div>
          ))}
          <p class="mt-5 pl-6 text-[15px] font-medium">Labels</p>
          {['Clients', 'Receipts', 'Team'].map((l) => (
            <div key={l} class="flex h-8 items-center gap-4 pl-6 text-[14px]">
              <span class="h-3 w-3 rotate-45 rounded-[2px] border-2 border-[#444746]" />
              {l}
            </div>
          ))}
        </nav>

        {/* Mail list */}
        <div class="mr-2 mb-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white">
          <div class="flex h-12 shrink-0 items-center gap-5 px-4 text-[#444746]">
            <span class="h-4 w-4 rounded-[3px] border-2 border-[#747775]" />
            <ReloadGlyph />
            <span class="text-lg leading-none">⋮</span>
            <span class="ml-auto text-[12px]">1–50 of 2,184</span>
          </div>
          <div class="flex shrink-0 border-b text-[14px]" style={{ borderColor: '#F1F1F1' }}>
            {['Primary', 'Promotions', 'Social', 'Updates'].map((t, i) => (
              <span
                key={t}
                class={`flex h-12 w-48 items-center gap-3 px-4 ${i === 0 ? 'border-b-[3px] font-medium text-[#0B57D0]' : 'text-[#444746]'}`}
                style={{ borderColor: i === 0 ? '#0B57D0' : 'transparent' }}
              >
                <TabGlyph /> {t}
              </span>
            ))}
          </div>
          <ul class="min-h-0 flex-1 overflow-hidden">
            {DEMO_INBOX.map((row, i) => (
              <MailRow
                key={row.id}
                row={row}
                scanning={status === 'scanning' && i === scannedRows}
                found={Boolean(row.itemId) && (status === 'done' || (status === 'scanning' && i < scannedRows))}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MailRow({ row, scanning, found }: { row: InboxRow; scanning: boolean; found: boolean }) {
  const bg = scanning ? '#E6F4EA' : found ? '#F0FBF5' : row.unread ? '#FFFFFF' : G.readRow;
  return (
    <li class="relative flex border-b px-4 py-2.5 transition-colors duration-200" style={{ background: bg, borderColor: '#F1F1F1' }}>
      {found && <span class="absolute inset-y-0 left-0 w-[3px] bg-brand" />}
      <span class="flex w-14 shrink-0 items-start gap-3 pt-0.5">
        <span class="h-4 w-4 rounded-[3px] border-2 border-[#C4C7C5]" />
        <StarGlyph />
      </span>
      <span class={`w-[170px] shrink-0 truncate pr-4 text-[14px] ${row.unread ? 'font-bold' : ''}`}>{row.from}</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[14px]">
          <span class={row.unread ? 'font-bold' : ''}>{row.subject}</span>
          <span class="text-[#5F6368]"> - {row.snippet}</span>
        </span>
        {row.attachment && (
          <span class="mt-1.5 inline-flex h-8 max-w-[260px] items-center gap-2 rounded-full border bg-white px-3 text-[13px]" style={{ borderColor: '#DADCE0' }}>
            <PdfGlyph />
            <span class="truncate">{row.attachment}</span>
          </span>
        )}
      </span>
      <span class={`w-16 shrink-0 pt-0.5 text-right text-[12px] ${row.unread ? 'font-bold' : 'text-[#5F6368]'}`}>{row.date}</span>
    </li>
  );
}

/* ───────────────────────── After-download scenes ───────────────────────── */

function Explorer({ plan, zipName }: { plan: ExportPlan; zipName: string }) {
  const folder = plan.files[0]?.path.split('/').slice(0, -1).join(' › ') ?? '';
  return (
    <div class="absolute inset-0 z-30 flex items-center justify-center bg-[#0F172A]/25 animate-[studio-fade_.3s_ease-out]">
      <div class="w-[880px] overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,.35)] animate-[studio-pop_.35s_ease-out]" style={{ fontFamily: 'Inter Variable, sans-serif' }}>
        <div class="flex h-10 items-center gap-2 border-b border-line bg-slate-50 px-4">
          <span class="flex gap-1.5">
            <span class="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span class="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span class="h-3 w-3 rounded-full bg-[#28C840]" />
          </span>
          <span class="ml-3 flex items-center gap-1.5 text-[13px] font-medium text-ink">
            <FolderIcon size={14} class="text-brand-dark" /> Downloads › <span class="font-mono">{zipName}</span>
            {folder && <span class="text-slate-500"> › {folder}</span>}
          </span>
        </div>
        <div class="grid grid-cols-[200px_1fr]">
          <div class="border-r border-line bg-slate-50/60 p-3 text-[12.5px]">
            <p class="flex items-center gap-1.5 font-mono font-semibold text-ink">
              <FolderIcon size={13} class="text-brand-dark" /> {zipName.replace('.zip', '')}
            </p>
            <p class="mt-2 ml-4 flex items-center gap-1.5 text-slate-600">
              <FolderIcon size={13} /> 2026
            </p>
            <p class="mt-1.5 ml-8 flex items-center gap-1.5 rounded bg-emerald-50 px-1 font-medium text-brand-dark">
              <FolderIcon size={13} /> 10-October
            </p>
            <p class="mt-1.5 ml-4 flex items-center gap-1.5 font-mono text-slate-600">
              <FileIcon size={13} /> summary.csv
            </p>
          </div>
          <div class="p-2">
            <div class="grid grid-cols-[1fr_90px_70px] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              <span>Name</span>
              <span>Type</span>
              <span class="text-right">Size</span>
            </div>
            {plan.files.map((f, i) => (
              <div
                key={f.itemId}
                class="grid grid-cols-[1fr_90px_70px] items-center rounded-md px-3 py-[7px] text-[13px] opacity-0 animate-[studio-rise_.35s_ease-out_forwards] odd:bg-slate-50"
                style={{ animationDelay: `${150 + i * 90}ms` }}
              >
                <span class="flex items-center gap-2 font-mono text-[12.5px] text-ink">
                  <PdfGlyph /> {f.path.split('/').pop()}
                </span>
                <span class="text-slate-500">PDF</span>
                <span class="text-right text-slate-500">{40 + ((i * 37) % 160)} KB</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EndCard() {
  return (
    <div class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white animate-[studio-fade_.5s_ease-out]" style={{ fontFamily: 'Inter Variable, sans-serif' }}>
      <div class="absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(55%_60%_at_50%_0%,#d1fae5_0%,rgba(255,255,255,0)_70%)]" />
      <div class="relative flex flex-col items-center text-center">
        <LogoMark size={84} />
        <p class="mt-6 text-[52px] font-bold tracking-tight text-ink">{BRAND.name}</p>
        <p class="mt-3 max-w-[760px] text-[26px] leading-snug text-slate-600">Gmail invoices, renamed and ready for your accountant.</p>
        <div class="mt-8 flex items-center gap-6 text-[17px] text-slate-500">
          {['Runs in your browser', 'Grouped by sender', 'ZIP + summary.csv'].map((t) => (
            <span key={t} class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                <CheckIcon size={13} />
              </span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Generic glyphs (no Google marks) ───────────────────────── */

function Glyph({ children, size = 20 }: { children: ComponentChildren; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const MenuGlyph = () => <Glyph><path d="M4 6h16M4 12h16M4 18h16" /></Glyph>;
const SearchGlyph = () => <Glyph><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Glyph>;
const TuneGlyph = () => <Glyph size={18}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Glyph>;
const HelpGlyph = () => <Glyph><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></Glyph>;
const GearGlyph = () => <Glyph><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Glyph>;
const AppsGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[4, 12, 20].flatMap((x) => [4, 12, 20].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />))}
  </svg>
);
const PencilGlyph = () => <Glyph><path d="M4 20h4L19 9l-4-4L4 16z" /></Glyph>;
const ReloadGlyph = () => <Glyph size={18}><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></Glyph>;
const StarGlyph = () => <span class="text-[#C4C7C5]"><Glyph size={18}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></Glyph></span>;
const TabGlyph = () => <Glyph size={18}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 13h4l2 2h4l2-2h4" /></Glyph>;
const PuzzleGlyph = () => <Glyph size={18}><path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z" /></Glyph>;
const DownloadGlyph = () => <Glyph size={18}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Glyph>;
const ChevronDown = () => <span class="text-[#5F6368]"><Glyph size={14}><path d="M6 9l6 6 6-6" /></Glyph></span>;
const PinGlyph = () => <Glyph size={16}><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" /></Glyph>;
const CloseGlyph = () => <Glyph size={16}><path d="M6 6l12 12M18 6L6 18" /></Glyph>;
const NavArrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <Glyph size={18}>{dir === 'left' ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}</Glyph>
);
const NavDot = ({ active }: { active: boolean }) => (
  <span class={`h-4 w-4 rounded-[4px] border-2 ${active ? 'border-[#1F1F1F] bg-[#1F1F1F]/10' : 'border-[#444746]'}`} />
);

function EnvelopeGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  );
}

function PdfGlyph() {
  return (
    <span class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] bg-[#D93025] text-[7px] font-bold tracking-tight text-white">
      PDF
    </span>
  );
}
