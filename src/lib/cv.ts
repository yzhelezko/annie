import type { Ctx } from './i18n';
import { file } from './media';
import { load } from './data';

type Cv = Awaited<ReturnType<typeof load>>['cv'];
type Site = Awaited<ReturnType<typeof load>>['site'];

/** "2020 — 2023", "2023 — now", or a single year. */
export function span(e: { start?: string; end?: string | null }, ctx: Ctx) {
  if (!e.start) return e.end ?? '';
  const end = e.end === undefined || e.end === null || e.end === '' ? ctx.ui('cv.present') : e.end;
  return e.start === end ? e.start : `${e.start} — ${end}`;
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');

/** A PDF the maintainer supplied, or the one the build prints from the CV page. */
export function cvPdfUrl(cv: Cv, ctx: Ctx, site?: Site) {
  const own = typeof cv.pdf === 'string' ? cv.pdf : cv.pdf?.[ctx.lang] ?? cv.pdf?.[ctx.def];
  const name = `${slug(site ? ctx.t(site.name) : 'cv')}-cv-${ctx.lang}.pdf`;
  if (own) return { url: file(own, 'content/media', 'cv.yaml → pdf'), name, generated: false };
  return { url: ctx.asset(`cv-${ctx.lang}.pdf`), name, generated: true };
}
