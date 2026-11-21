# Recommendations: Gmail Invoice & Receipt Extractor

> A living file. Every recommendation goes here with **what**, **why**, **evidence** and **status**.
> Update the status as things get done and add new items at the bottom of the right section.
> CLAUDE.md stays the source of truth for *decisions*. When the owner adopts a recommendation, update
> CLAUDE.md in the same change and mark the item **Adopted** here.
>
> Status values: `Open` · `In progress` · `Done` · `Adopted` (moved into CLAUDE.md) · `Rejected` (say why)

---

## Overall verdict (2026-11-21)

**NO-GO on building v1 as currently pitched** ($19 lifetime pre-order aimed mainly at freelancers).
**GO on a cheap (~$155), ~3-week validation sprint** with a reshaped offer, and decide go or stop on real numbers.

| Check | Result | Source |
|---|---|---|
| Board (3 lenses) | 2 FUND IF · 1 PASS, average 4.3/10 | [founder/board.md](founder/board.md) |
| Simulated buyer panel (20) | 2 buy · 18 pass = **10%** (bar is 25%) | [founder/panel/results.md](founder/panel/results.md) |
| Price sensitivity | Acceptable range $5.24–$45.08; $19 is inside | [founder/pricing-curve.md](founder/pricing-curve.md) |
| Unit economics | $15.55 per sale (82%); cash costs ~$7/month | [founder/cfo.md](founder/cfo.md) |
| Computed verdict | **Not yet**: money passes, demand fails | [founder/business-plan.md](founder/business-plan.md) |

**Why "Not yet":** the product is not losing money. The demand signal is weak, and the reasons are about trust and need, not price.
The panel is simulated, so treat its 10% as a best case. Only real buyers confirm anything.

---

## A. Do first (this week)

### A1. Test extraction on 5 real inboxes before building anything else
- **Status:** Open
- **What:** run the rules-based PDF extraction on 5 real inboxes (yours, 2 Indian freelancers, 2 CAs). Measure:
  1. % of fields (date, vendor, amount, GST, invoice no.) correct **without edits**
  2. % of invoices that arrive **only as a portal link** (no PDF attached)
  3. minutes from install to a ZIP ready for the accountant
- **Why:** the whole product depends on the review table *not* turning into data entry. Nobody has measured this yet. If link-only invoices are common, the core promise breaks.
- **Evidence:** Product lens, "the review table becomes data entry" and "invoices that are not attachments" ([product.md](founder/board/product.md)). Panel buyers P012 and P019 said most of their receipts are portal links ([results](founder/panel/results.md)).
- **Pass mark (proposed):** ≥70% of fields correct without edits; link-only invoices under ~30%.

### A2. Talk to 10 CAs / bookkeepers
- **Status:** Open
- **What:** ask whether they'd pay **$79–$99/year** for a version that works across several client inboxes, pulls GSTIN + GST, follows the April–March year, and gives a Tally/Zoho-ready CSV.
- **Why:** they are the only segment with monthly pain *and* money, and they bring their clients (distribution). India GST + CA is **the only open gap** the competitor research found.
- **Evidence:** Offers and Monopoly lenses both put CAs first ([board.md](founder/board.md)). 0 of 4 panel bookkeepers bought v1, and every one asked for several inboxes plus an accounting import. No existing tool does local Gmail → GST extraction → Tally ([competitors.md §5](founder/competitors.md)).
- **Pass mark (proposed):** at least 3 of 10 say "yes, I'd pay" (better: put down a deposit).

---

## B. Change the offer

### B1. Let people try before they pay (free 10-file beta you can install)
- **Status:** Open (**owner decision**: this bends the "sell first, build second" rule in CLAUDE.md §2)
- **What:** put **two buttons** on the landing page: "Join the free beta" and "Founding-member pre-order". Compare how many people click each. Ship a narrow beta (see C1) people can actually install, with the 10 free files.
- **Why:** the most common reason panel buyers gave for changing a no was "let me run the 10 free files now". A blind pre-order from an unknown brand for software that can read Gmail is the main barrier.
- **Evidence:** 7 of 18 "no" answers were about trust; the "what would flip a no" list is dominated by "installable now" ([results.md](founder/panel/results.md)). Offers lens: "perceived likelihood is near zero".

### B2. Make the privacy claim checkable
- **Status:** Open
- **What:** open-source the extension (it runs in the browser anyway; the license check still works), or publish a "check it yourself: open the DevTools network tab" page. Explain on the landing page, before install, the Chrome warning that the extension can "read and change data on mail.google.com".
- **Why:** "nothing leaves your browser" is only believed if buyers can check it. Privacy-cautious and agency buyers said they would need open code or an audit.
- **Evidence:** panel P001, P003, P009, P010 ([results.md](founder/panel/results.md)). Monopoly lens calls privacy a real wedge, but only if it is credible.

### B3. Stand out from the free "Receipt Collector for Gmail"
- **Status:** Open
- **What:** lead the messaging with what the free tool doesn't do: **GST/GSTIN extraction, the review table, a CSV your CA can use, April–March year**. Don't lead with "ZIP of renamed PDFs"; that job is already free.
- **Why:** a free, local, no-sign-in extension already promises the plain ZIP-and-rename job.
- **Evidence:** [Receipt Collector listing](https://chromewebstore.google.com/detail/ehpdfnjjnknigpaoapboagakfcoedodg): free, 60 users ([competitors.md](founder/competitors.md)).

---

## C. Product scope

### C1. Narrow v1 to the one thing
- **Status:** Open
- **What:** v1 = Last month → review table → ZIP + CSV with the default filename, plus GST fields. Defer filename presets, the by-vendor folder layout, remembered group edits and the separate payment-platform grouping rule until users ask for them.
- **Why:** each extra feature is another place the experience can crack, and every Gmail change has to be fixed for free on a one-time price. A smaller v1 also ships faster, which B1 needs.
- **Evidence:** Product lens, "too many features and too many seams for $19 lifetime" ([product.md](founder/board/product.md)).

### C2. Handle link-only invoices honestly
- **Status:** Open (depends on A1)
- **What:** at minimum, **list** the emails that have an invoice link but no attachment ("12 invoices are behind portal links, open them here"), instead of quietly saving the email body as a PDF the accountant can't use.
- **Why:** a PDF of the email body is not the invoice an accountant needs.
- **Evidence:** Product lens risk #2; panel P012 and P019.

### C3. Plan (don't build yet) a multi-client CA mode
- **Status:** Open (only if A2 passes)
- **What:** client profiles, a GST summary sheet, and a Tally/Zoho import CSV. This is the paid recurring tier.
- **Why:** it is what every CA on the panel asked for, and it creates something that compounds (CA relationships, a vendor/GST rule library).
- **Evidence:** Monopoly lens conditions; panel P005, P015, P017, P018.

---

## D. Pricing

### D1. Raise the solo price to $29 one-time; test $39
- **Status:** Open
- **What:** solo tier at $29 (test $39). Keep $19 only as **"founding member: first 100 buyers"**, and keep it true with a real counter.
- **Why:** price isn't what stops people (no "no" was mainly about price), and $39 is still far below a year of any paid competitor. The CFO tool: at $39, year-1 profit goes from **$1,432 → $6,472** at the same volume.
- **Evidence:** [pricing.md](founder/pricing.md), [cfo.md](founder/cfo.md). Panel median "getting expensive" = $39. Competitors cost ~$120–$300/year.

### D2. Change "all future updates included" → "all v1 updates included"
- **Status:** Open (needs a site copy change + CLAUDE.md §11 item)
- **What:** cap the lifetime promise to v1.x. Drive, AI and multi-client mode are paid upgrades.
- **Why:** every Gmail change is maintenance paid for forever with no recurring revenue.
- **Evidence:** raised by all three board lenses ([board.md](founder/board.md)).

### D3. Add a CA/bookkeeper tier at $79–$99/year (test)
- **Status:** Open (only after A2)
- **Why / evidence:** see A2 and C3.

---

## E. Launch & timing

### E1. Run a ~3-week validation sprint with stop criteria written in advance
- **Status:** Open
- **What:** deploy the landing page (CLAUDE.md §11), set up the Dodo link, do A1 + A2, send targeted traffic (Indian freelancer/CA communities, a small ~$150 ad test), and measure.
- **Stop or pivot if** (proposed; adjust before starting, **not after**):
  - fewer than 3 of 10 CAs would pay, **or**
  - under 70% of fields correct without edits, **or**
  - weak waitlist/pre-order numbers from targeted traffic (set the exact number before launch)
- **Why:** the Offers lens's first condition is a target set *before* launch. Missing it means PASS.
- **Next skill:** `/founder-launch` turns this into a dated plan.

### E2. Time the real launch to tax deadlines
- **Status:** Open
- **What:** aim the paid launch at the weeks before India's income-tax filing season (around June–July) and the US tax season (March–April), not November.
- **Why:** freelancers feel this pain at tax time. Panel buyers said "it's November, I'd forget about it until the deadline".
- **Evidence:** panel P007, P009, P020 ([results.md](founder/panel/results.md)).

---

## F. Founder-pack steps not run yet

| Skill | Why run it | Status |
|---|---|---|
| `/founder-offer` | Build the offer that answers the trust objections, then re-test it on the panel (same seed) | Open |
| `/founder-marketing` | Name the first channel and the most you can pay to win a customer (board condition) | Open |
| `/founder-launch` | Dated validation sprint + stop criteria (E1) | Open |
| `/founder-brand` | Final name (currently the "InvoiceSnap" placeholder) + trademark/domain checks | Open |
| `/founder-ops` | One-page map of the buyer's path: checkout → key → install warning → first export → "Gmail broke it" | Open |

---

## Decision log

| Date | Item | Decision | By |
|---|---|---|---|
| 2026-11-21 | Founder-pack validation run | Verdict "Not yet". Recommendations A–F written | Claude (pending owner review) |
