/**
 * Records the landing-page demo video from the dev-only /studio page.
 *
 *   pnpm video            (from the repo root)
 *
 * Output → apps/web/public/demo/invoice-demo.mp4 + invoice-demo-poster.jpg
 * Re-run after changing the brand name (.env PUBLIC_BRAND_NAME), the panel UI or the demo data.
 *
 * Needs Google Chrome installed. Set CHROME_PATH if it isn't found automatically.
 * Starts `astro dev` itself unless STUDIO_URL points at an already-running server.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = path.join(ROOT, 'apps/web/public/demo');
const TMP_DIR = path.join(ROOT, 'tools/demo-video/.tmp');
const CONCAT = path.join(TMP_DIR, 'frames.txt');
const MP4 = path.join(OUT_DIR, 'invoice-demo.mp4');
const POSTER = path.join(OUT_DIR, 'invoice-demo-poster.jpg');

const PORT = 4399;
let STUDIO_URL = process.env.STUDIO_URL ?? `http://localhost:${PORT}/studio`;
const VIEW = { width: 1280, height: 800 };
const OUTPUT_WIDTH = 1600; // final video width (16:10 → 1600×1000)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to your chrome executable.');
  return found;
}

async function isUp(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

async function startDevServerIfNeeded() {
  // Astro allows one dev server per project — reuse yours if `pnpm dev` is already running.
  const candidates = [STUDIO_URL, ...Array.from({ length: 10 }, (_, i) => `http://localhost:${4321 + i}/studio`)];
  for (const url of candidates) {
    if (await isUp(url)) {
      STUDIO_URL = url;
      console.log('› using running dev server', url);
      return null;
    }
  }
  console.log('› starting astro dev on port', PORT);
  const child = spawn('pnpm', ['--filter', 'web', 'dev', '--port', String(PORT)], {
    cwd: ROOT,
    shell: true,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
  });
  for (let i = 0; i < 120; i++) {
    if (await isUp(STUDIO_URL)) return child;
    await sleep(500);
  }
  stopServer(child);
  throw new Error(`Studio page did not come up at ${STUDIO_URL}`);
}

function stopServer(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-child.pid);
  } catch {
    /* already gone */
  }
}

/**
 * Captures screencast frames as JPEGs with their real timestamps and, on stop(), writes an
 * ffmpeg concat list where each frame is held until the next one arrived.
 */
async function startFrameCapture(page) {
  const client = await page.createCDPSession();
  const frames = [];
  client.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = path.join(TMP_DIR, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, ts: metadata.timestamp ?? Date.now() / 1000 });
    client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: OUTPUT_WIDTH * 1.25,
    maxHeight: OUTPUT_WIDTH * 1.25,
    everyNthFrame: 1,
  });

  return {
    async stop() {
      const end = Date.now() / 1000;
      await client.send('Page.stopScreencast');
      await sleep(200);
      if (frames.length === 0) throw new Error('No frames captured');
      const lines = [];
      frames.forEach((f, i) => {
        const next = frames[i + 1]?.ts ?? end;
        lines.push(`file '${f.file.replace(/\\/g, '/')}'`, `duration ${Math.max(0.001, next - f.ts).toFixed(4)}`);
      });
      // concat demuxer quirk: repeat the last file so its duration is honoured.
      lines.push(`file '${frames.at(-1).file.replace(/\\/g, '/')}'`);
      writeFileSync(CONCAT, lines.join('\n'));
      return frames.length;
    },
  };
}

/** Visible cursor + click ripple (headless screenshots don't show the real pointer). */
function installCursor() {
  const install = () => {
    const cursor = document.createElement('div');
    cursor.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l15 11.2-6.3.9 3.9 7.4-2.9 1.5-3.8-7.5L4 20z" fill="#0F172A" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, {
      position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none',
      transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))',
    });
    document.body.appendChild(cursor);
    window.__hideCursor = () => (cursor.style.display = 'none');
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`;
    }, true);
    document.addEventListener('mousedown', (e) => {
      const ring = document.createElement('div');
      Object.assign(ring.style, {
        position: 'fixed', left: `${e.clientX - 18}px`, top: `${e.clientY - 18}px`, width: '36px', height: '36px',
        borderRadius: '50%', border: '3px solid #10B981', zIndex: '2147483646', pointerEvents: 'none',
      });
      document.body.appendChild(ring);
      ring.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 450, easing: 'ease-out' })
        .onfinish = () => ring.remove();
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const server = await startDevServerIfNeeded();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    defaultViewport: { ...VIEW, deviceScaleFactor: 2 },
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.evaluateOnNewDocument(installCursor);
    await page.goto(STUDIO_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-rec="extension-icon"]');
    await page.evaluate(() => document.fonts.ready);
    await sleep(800); // let dev-mode hydration settle before recording

    // ── Director helpers ──────────────────────────────────────────────
    let pos = { x: VIEW.width * 0.55, y: VIEW.height * 0.6 };
    await page.mouse.move(pos.x, pos.y);

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    async function moveTo(x, y, ms = 650) {
      const from = { ...pos };
      const steps = Math.max(8, Math.round(ms / 16));
      for (let i = 1; i <= steps; i++) {
        const t = ease(i / steps);
        await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
        await sleep(16);
      }
      pos = { x, y };
    }
    async function centerOf(handle) {
      const box = await handle.boundingBox();
      if (!box) throw new Error('element not visible');
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    async function reveal(handle) {
      await handle.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await sleep(550);
    }
    async function hover(handle, ms) {
      const c = await centerOf(handle);
      await moveTo(c.x, c.y, ms);
    }
    async function click(handle, { pause = 140 } = {}) {
      await hover(handle);
      await sleep(pause);
      await page.mouse.click(pos.x, pos.y);
    }
    /** A button/element inside the side panel whose text contains `text`. */
    async function byText(text, selector = 'button') {
      const h = await page.waitForFunction(
        (t, sel) => [...document.querySelectorAll(`aside ${sel}`)].find((el) => el.textContent?.includes(t)),
        { timeout: 10_000 }, text, selector,
      );
      return h.asElement();
    }
    async function inputWhere(label, value) {
      const h = await page.waitForFunction(
        (l, v) => [...document.querySelectorAll(`aside input[aria-label="${l}"]`)].find((el) => v === undefined || el.value === v),
        { timeout: 10_000 }, label, value,
      );
      return h.asElement();
    }
    async function retype(handle, text, delay = 75) {
      await reveal(handle);
      await click(handle);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await sleep(150);
      await page.keyboard.type(text, { delay });
    }

    // ── Recording ─────────────────────────────────────────────────────
    // Chrome only sends a frame when pixels change, so we keep each frame's real timestamp
    // and later tell ffmpeg exactly how long to hold it (puppeteer's page.screencast() loses
    // still moments, which squeezes pauses and drops the end card).
    const recorder = await startFrameCapture(page);
    const t0 = Date.now();
    const marks = {};

    await sleep(1300);
    await click(await page.$('[data-rec="extension-icon"]'));            // open side panel
    await sleep(1100);
    await hover(await byText('Last month'));
    await sleep(500);
    await click(await byText('Scan Gmail'));                            // Step 1: Find
    await sleep(3200);
    await click(await byText('Review 12'));                             // Step 2: Review
    marks.review = Date.now() - t0;
    await sleep(1100);
    await hover(await byText('remembered', 'span'), 700);
    await sleep(1000);
    await retype(await inputWhere('Vendor name for this sender', 'Priya Sharma'), 'Priya Design Studio');
    await sleep(500);
    await retype(await inputWhere('Invoice date'), '2026-10-27', 90);
    await sleep(400);
    await retype(await inputWhere('Amount'), '1180', 110);
    await page.keyboard.press('Tab');                                   // amount commits on blur
    await sleep(700);
    await reveal(await byText('Locked', 'span'));
    await hover(await byText('Locked', 'span'), 600);
    await sleep(1300);
    await click(await byText(' files'));                                // Step 3: Export
    marks.export = Date.now() - t0;
    await sleep(1300);
    await click(await byText('Accountant style'));
    await sleep(1400);
    await click(await byText('Default'));
    await sleep(500);
    const format = await page.$('aside #file-template');
    await click(format);
    await page.keyboard.press('End');
    await page.keyboard.type('{currency}', { delay: 85 });              // custom format, live preview
    await sleep(1100);
    await click(await byText('By vendor'));
    await sleep(1400);
    await click(await byText('By month'));
    await sleep(600);
    await click(await byText('Download ZIP'));
    await sleep(1500);
    await click(await page.waitForSelector('[data-rec="download-bubble"]'));
    marks.explorer = Date.now() - t0;
    await sleep(3800);
    await page.evaluate(() => {
      window.__hideCursor?.();
      window.__studio?.showEnd();
    });
    await sleep(3200);
    const frameCount = await recorder.stop();

    if (errors.length) throw new Error(`Page errors during recording:\n${errors.join('\n')}`);
    console.log(`› recorded ${((Date.now() - t0) / 1000).toFixed(1)}s, ${frameCount} frames`, marks);

    // ── Encode ────────────────────────────────────────────────────────
    const ff = (args) => execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
    ff(['-f', 'concat', '-safe', '0', '-i', CONCAT, '-vf', `fps=30,scale=${OUTPUT_WIDTH}:-2:flags=lanczos`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', MP4]);
    // Poster: the Review step (grouped senders) — the most telling single frame.
    const posterAt = ((marks.review ?? 9000) + 1500) / 1000;
    ff(['-ss', posterAt.toFixed(2), '-i', MP4, '-frames:v', '1', '-q:v', '3', POSTER]);

    const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(2);
    console.log(`✓ ${path.relative(ROOT, MP4)} (${mb(MP4)} MB)`);
    console.log(`✓ ${path.relative(ROOT, POSTER)} (${mb(POSTER)} MB)`);
    rmSync(TMP_DIR, { recursive: true, force: true }); // raw frames are large
  } finally {
    await browser.close();
    stopServer(server);
  }
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
