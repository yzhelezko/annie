import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import cvPdf from './integrations/cv-pdf.mjs';

const site = parse(readFileSync('./content/site.yaml', 'utf8'));
const locales = site.languages.map((l) => l.code);

// GitHub Actions passes the Pages origin and base path; locally the site lives at "/".
export default defineConfig({
  site: process.env.SITE_URL || site.deploy?.site || undefined,
  base: process.env.BASE_PATH || site.deploy?.base || '/',
  trailingSlash: 'always',
  compressHTML: true,
  image: { responsiveStyles: false },
  integrations: [
    sitemap({
      i18n: { defaultLocale: locales[0], locales: Object.fromEntries(locales.map((l) => [l, l])) },
    }),
    cvPdf(),
  ],
});
