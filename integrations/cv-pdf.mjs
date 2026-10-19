// After `astro build`, prints every language's /cv/ page to dist/cv-<lang>.pdf with headless Chrome.
// Uses an installed Chrome/Edge (GitHub's Ubuntu runners ship Chrome) or CHROME_PATH; skips with a warning if none.
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

function serve(root, base) {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.startsWith(base)) path = '/' + path.slice(base.length);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function browser(logger) {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    logger.warn('playwright-core is not installed — CV PDFs skipped.');
    return null;
  }
  const tries = [
    process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH },
    { channel: 'chrome' },
    { channel: 'msedge' },
    { channel: 'chromium' },
    {},
  ].filter(Boolean);
  for (const opts of tries) {
    try {
      return await chromium.launch(opts);
    } catch {}
  }
  logger.warn('No Chrome/Chromium found — CV PDFs skipped. Install Chrome or set CHROME_PATH.');
  return null;
}

export default function cvPdf() {
  let base = '/';
  return {
    name: 'cv-pdf',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : config.base + '/';
      },
      'astro:build:done': async ({ dir, logger }) => {
        const site = parse(readFileSync('./content/site.yaml', 'utf8'));
        const cv = parse(readFileSync('./content/cv.yaml', 'utf8'));
        const langs = site.languages.map((l) => l.code);
        const own = (lang) => (typeof cv.pdf === 'string' ? cv.pdf : cv.pdf?.[lang]);
        const todo = langs.filter((l) => !own(l));
        if (!todo.length) return;

        const root = fileURLToPath(dir);
        const b = await browser(logger);
        if (!b) return;
        const server = await serve(root, base);
        const origin = `http://127.0.0.1:${server.address().port}`;
        try {
          const page = await b.newPage();
          for (const lang of todo) {
            const t = performance.now();
            const path = `${base}${lang === langs[0] ? '' : lang + '/'}cv/`;
            await page.goto(origin + path, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
            await writeFile(join(root, `cv-${lang}.pdf`), pdf);
            logger.info(`cv-${lang}.pdf  ${(pdf.length / 1024).toFixed(0)} KB  ${(performance.now() - t).toFixed(0)}ms`);
          }
        } finally {
          await b.close();
          server.close();
        }
      },
    },
  };
}
