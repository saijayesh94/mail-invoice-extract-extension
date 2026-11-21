# CLAUDE.md — Gmail Invoice & Receipt Extractor

> **Source of truth for this project.** Read this before any work.
> **Rule:** whenever the product flow, v1 scope, tech stack, or any decision below changes,
> update this file *in the same change* and add a line to the **Change log** at the bottom.
> If code and this file disagree, stop and ask the owner which one is right.

---

## 1. What we are building

A **zero-backend, privacy-first Chrome extension (Manifest V3)** plus a **static landing page on Cloudflare Pages**.

- **Core job:** inside Gmail, find invoice/receipt emails → read them locally in the browser →
  let the user review → export cleanly renamed PDFs (default `YYYY-MM-DD_Vendor_Amount.pdf`) + a summary CSV.
- **Pricing:** one-time lifetime license. Early-bird **$19**, sold as a pre-order.
- **Payments & licensing:** Dodo Payments checkout + Dodo License Key API (validated from the extension). No custom auth, no database.
- **Brand name:** _TBD_ (keep name + SVG logo modular so they can be swapped in one place).

### Why zero-backend
1. No server/API costs → lifetime pricing stays profitable.
2. Privacy: emails and financial PDFs never touch our servers.
3. No Gmail restricted-scope security audit (we do **not** use the Gmail API).

### Target customers
1. Freelancers / solopreneurs with 30–200+ scattered SaaS & contractor receipts.
2. Small agency owners & bootstrapped founders handing folders to a bookkeeper / CA.
3. Bookkeepers & accountants managing several client inboxes (best long-term customer → future Pro tier).

**Positioning vs Dext / Hubdoc / receipt apps:** one-time price, nothing leaves your browser, works inside Gmail.
India angle: GSTIN + GST amount extraction, April–March financial year support.

---

## 2. Phases ("sell first, build second")

| Phase | What | Status |
|---|---|---|
| 1 | Landing page + demo video + Dodo pre-order button + Privacy / Terms / Refund pages, on Cloudflare Pages | **Built** (`.env` + Dodo link to fill, not yet deployed) |
| 2 | Build v1 extension, publish to Chrome Web Store (also works on Edge/Brave/Arc) | After paid validation |
| 3 | v2: Google Drive upload (`drive.file` scope), optional local AI extraction, Pro tier | Later |

Pre-order wording must be explicit: "pre-order", delivery as **"beta access within 30 days"** (14 days is too tight given Web Store review), 100% refund guarantee.

---

## 3. Key technical decisions (and why)

- **No Gmail API.** The extension runs a content script inside the user's open Gmail tab and fetches
  attachments using their existing session (as if they clicked "download"). Free, no audit.
  Trade-off: Gmail UI changes can break it.
- **Remote selector config:** Gmail page selectors/patterns live in a JSON file hosted on our Cloudflare site,
  so breakage can be fixed without a Web Store review. **Data only — never remote code** (MV3 forbids it).
- **v1 exports a ZIP download** (renamed PDFs + CSV). **No Google OAuth in v1.** Drive upload is v2.
- **Extraction is rules-based** (PDF text + patterns). Accuracy will not be 100% → the **review table is mandatory**.
- **Extension UI = Chrome Side Panel** (`chrome.sidePanel`), not a popup: a popup closes when the user clicks
  away, which would kill a long scan. The side panel stays open next to Gmail. ~360–400px wide.
- **Minimal permissions:** Gmail host access, `storage`, `downloads`, `sidePanel`. No analytics/tracking in the extension.
- Privacy policy must describe exactly what the extension does (Web Store checks this).

---

## 4. v1 user flow (the extension side panel — the demo video must mirror this 1:1)

The panel UI is implemented ONCE in `packages/ui/src/panel/` and used by both the video studio and the extension.

**Step 1 — Find**
- Quick period buttons: Last month · Last 3 months · This FY (financial year).
- Searches Gmail for invoice/receipt/bill emails + known billing senders (Stripe, Razorpay, Paddle, …).
- Progress bar + Cancel.

**Step 2 — Review (grouped table)**
- Rows grouped by sender (see §5), e.g. "Client A · 5 invoices".
- Editable per row: date, vendor, amount, currency, GST/tax, invoice no. Include/exclude checkbox.
- **Edit a whole group at once.** Group edits are **remembered** for future scans.
- Low-confidence fields highlighted (yellow). Duplicates flagged automatically.
- "Always skip this sender" option.
- Password-protected PDFs: not failed silently — shown as "🔒 Locked — add manually".

**Step 3 — Export**
- ZIP of renamed PDFs, folder layout by month (`2026/11-November/`) or by vendor (user's choice).
- Summary CSV inside the ZIP (date, vendor, amount, currency, tax, GSTIN, invoice no., original filename, email subject).
- Receipts that live in the email body (no attachment) are saved as a basic PDF.

---

## 5. Grouping rules

Implemented in `packages/core/src/grouping.ts` (tested). Duplicates: `packages/core/src/duplicates.ts`
(same group + same invoice no., or same group + date + amount + currency).

| Situation | Group by |
|---|---|
| Normal company sender (`billing@aws.com`, `invoices@aws.com`) | **Company domain** (`aws.com`) |
| Public email providers (gmail.com, outlook.com, yahoo.com, …) | **Full email address** |
| Payment platforms (Stripe, Paddle, Razorpay, …) — one sender, many vendors | **Vendor name read from the PDF / email**, not the sender |

Remembered per group (stored locally): vendor display name, include/skip, folder name.

---

## 6. File & folder name format

Free text + tokens, with live preview and presets.

Implemented in `packages/core/src/filename.ts` (tested).

- **Tokens:** `{date}` `{vendor}` `{amount}` `{currency}` `{invoice_no}` `{gst}` `{year}` `{month}` (`11`) `{month_name}` (`November`)
- **Default:** `{date}_{vendor}_{amount}` → `2026-11-03_ClientA_4500.pdf` (vendor spaces removed)
- **Presets:** Default · Accountant style (`{date}_{vendor}_{invoice_no}_{amount}{currency}`) · India GST style (`{date}_{vendor}_{gst}_{amount}{currency}`).
- **Folder format** uses the same token engine: By month `{year}/{month}-{month_name}` · By vendor `{vendor}`.
- Unknown tokens (e.g. `{foo}`) stay as typed and the UI shows a warning.
- **Safety rules:**
  - Strip characters illegal on Windows/macOS: `/ \ : * ? " < > |`
  - Cap total length (keep well under OS limits).
  - Missing value → visible placeholder (e.g. `NO-AMOUNT`), never a silent gap.
  - Name collisions → append `_2`, `_3`, … (never overwrite).
- Settings: date format, separator, default currency, financial-year start (April for India / January).

---

## 7. Licensing & trial

- **Free trial:** first **10 files** free, then license key required.
- License screen: paste key → validate with Dodo License Key API.
- **Device limit:** 3 activations per key.
- **Grace mode:** if the license check fails due to network/Dodo outage, keep working and re-check later. Never lock out a paying user.

---

## 8. Brand & design (shared by landing page AND extension)

- **Colors:** Emerald `#10B981` / `#059669`, Deep Slate `#0F172A`, white surfaces, slate borders `#E2E8F0`.
  Defined once as Tailwind tokens in `packages/ui/src/styles/theme.css` (`bg-brand`, `text-brand-dark`, `text-ink`, `border-line`).
- **Fonts:** `Inter` (UI), `JetBrains Mono` (filenames, license keys). Self-hosted via Fontsource (no Google Fonts request — privacy).
- **Logo + name:** ONE source, `packages/ui/src/brand/brand.ts` (`BRAND.name`, `LOGO_MARK_SVG`). The favicon is generated
  from it (`apps/web/src/pages/favicon.svg.ts`); extension icons must be generated from it too.
- **Continuity rule:** the landing page hero shows a **demo video** of the exact v1 flow
  **Gmail (messy PDFs) → side panel: Find → grouped Review → Export → ZIP + CSV**. Drive shown only as "coming soon".
  The video is recorded from the real shared panel components, so the extension must keep the same layout,
  labels, colors and steps. Captioned on the site as a "product preview" (extension in development).
- **Gmail in the video is Gmail-STYLE, never Gmail's logo/wordmark** (trademark + implied endorsement risk).
  Once the real extension exists, re-record inside real Gmail — that's fine.

---

## 9. Out of scope for v1

Google Drive upload · AI extraction · bookkeeper multi-client mode · Income vs Expense tagging ·
per-group filename formats · scheduled/automatic scans · Outlook.

---

## 10. Tech stack

_Confirmed by owner on 2026-11-21._

| Layer | Choice |
|---|---|
| Repo | **pnpm** workspaces monorepo, TypeScript everywhere |
| `packages/core` | Pure TS logic: filename/folder token engine, grouping, extraction rules, duplicate detection. Tested with Vitest. |
| `packages/ui` | Shared Preact components + design tokens (Tailwind). Used by BOTH the video studio and the extension side panel. |
| `apps/web` | Astro (static output) + Tailwind → Cloudflare Pages. Hero = MP4 demo video. |
| `tools/demo-video` | puppeteer-core (drives installed Chrome) + ffmpeg-static → records the demo video |
| Config | Repo-root `.env` (template: `.env.example`), all `PUBLIC_*`, read via Vite `envDir` |
| `apps/extension` | WXT (MV3, Vite-based) + Preact + Tailwind |
| PDF reading | `pdfjs-dist` |
| PDF creation (email-body receipts) | `pdf-lib` |
| ZIP | `jszip` (or `fflate`) |
| CSV | Hand-written, UTF-8 with BOM (so Excel shows ₹ correctly) |

### Layout

```
packages/core   @app/core  pure logic: filename.ts, grouping.ts, duplicates.ts   (+ test/)
packages/ui     @app/ui    brand/ (name, logo), styles/theme.css, panel/ (PanelShell, FindStep, ReviewStep, ExportStep, model.ts)
apps/web        web        Astro site: pages/ (index, privacy, terms, refund, favicon.svg), config/site.ts,
                           components/demo/ (demoData.ts, useDemoFlow.tsx), studio/ (dev-only video stage),
                           public/demo/ (invoice-demo.mp4, invoice-demo-poster.jpg)
tools/demo-video demo-video record.mjs — records the video from /studio
apps/extension  (Phase 2, not created yet)
```

### Commands (run from repo root)

- `pnpm dev` — website dev server · `pnpm build` — build site to `apps/web/dist` · `pnpm preview` — serve the build
- `pnpm test` — unit tests (Vitest) · `pnpm typecheck` — type check all packages
- `pnpm video` — re-record the demo video (~1 min). **Re-run after changing the brand name, panel UI or demo data.**
  Dev-only stage: `http://localhost:<dev port>/studio` (injected only in `astro dev`, never deployed).

### Configuration (`.env`)

Copy `.env.example` → `.env` at the repo root: brand name, site URL, Dodo checkout URL, business name, email,
address, jurisdiction. All values are public (`PUBLIC_` prefix) — never put secrets there. Empty values fall back to
visible placeholders. **On Cloudflare Pages, set the same variables in the dashboard** (`.env` is git-ignored).

### Gotchas

- **Preact must be a single copy.** `@app/ui` lists preact as a *peer* dependency, and every app must set
  Vite `resolve.dedupe: ['preact']`. Two copies crash hooks with "Cannot read properties of undefined (reading '__H')".
- `apps/web` pins **TypeScript 6** because `@astrojs/check` doesn't support TS 7 yet. Core/ui use TS 7.
- Tailwind must scan `packages/ui/src` — see the `@source` line in `apps/web/src/styles/global.css`.
- Headless Chrome won't render narrower than 512px; to test phone width, load the page inside a 390px iframe.
- Astro allows **one dev server per project**; `pnpm video` reuses a running one (ports 4321–4330) or starts its own.
- Video recording: don't use puppeteer's `page.screencast()` — Chrome only sends frames on change, so it loses
  still moments. `record.mjs` captures timestamped frames via CDP and builds an ffmpeg concat list instead.
- pnpm blocks install scripts; `ffmpeg-static` is allowed via `allowBuilds` in `pnpm-workspace.yaml`.

### Deploy (Cloudflare Pages) — not done yet

Build command `pnpm build`, output directory `apps/web/dist`, root = repo root.
Verify Cloudflare's build image supports the pnpm version in `packageManager` when first deploying.

---

## 11. Open items

- [ ] Owner creates `.env` from `.env.example` (brand name, site URL, checkout URL, business details)
- [ ] Brand / product name — placeholder **"InvoiceSnap"** → `PUBLIC_BRAND_NAME`, then `pnpm video` to re-record
- [ ] Dodo Payments: account + business verification, $19 one-time product with license keys (3 activations),
      test purchase, then `PUBLIC_CHECKOUT_URL` (until set, buy buttons scroll to #pricing)
- [ ] Policy pages are a starting template, **not legal advice** — have them reviewed before launch
- [ ] Owner to confirm promises written on the site: "All future updates included", "price goes up at launch",
      refund = any time before delivery + 14 days after delivery, 3 browsers per license
- [ ] Deploy to Cloudflare Pages
- [x] Confirm tech stack (§10)
- [x] Package manager: pnpm

---

## Change log

- **2026-11-21** — File created. Captured original brief + agreed changes: no Gmail API (in-page content script),
  v1 = ZIP + CSV export (Drive moved to v2), mandatory review table, sender grouping rules, token-based
  filename/folder format, free trial + device limit + grace mode, remote selector config, delivery window → 30 days.
  Tech stack proposed (pending).
- **2026-11-21** — Tech stack confirmed. Placeholders approved for brand ("InvoiceSnap"), Dodo link and
  business details. Git repo initialised. Package manager (pnpm vs npm) still to decide.
- **2026-11-21** — pnpm chosen. Phase 1 built: monorepo (core/ui/web), tested filename + grouping + duplicate logic,
  shared side-panel UI, landing page with interactive simulator, Privacy/Terms/Refund pages.
  Decisions made while building: extension uses Chrome **Side Panel** (not popup); period buttons are
  "Last month / Last 3 months / This FY" (was "Last quarter"); added `{month_name}` token; fonts self-hosted.
- **2026-11-21** — Owner chose a **demo video** instead of the interactive simulator (product doesn't exist yet).
  Added dev-only `/studio` page (Gmail-style inbox + Chrome side panel, no Google logo) and `pnpm video`
  recorder → `apps/web/public/demo/`. Hero button "Try the demo" → "Watch how it works"; video captioned as a
  product preview. Site settings moved to repo-root `.env` (`.env.example`). Removed the in-page simulator.
