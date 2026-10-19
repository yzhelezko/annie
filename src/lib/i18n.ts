export type Loc = string | Record<string, string>;
export interface Lang {
  code: string;
  label: string;
  name: string;
}

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

/** Everything a component needs to speak the page's language and link within the site. */
export interface Ctx {
  lang: string;
  def: string;
  langs: Lang[];
  /** Current page path without the language prefix, e.g. "work/halva/" or "". */
  path: string;
  t: (v?: Loc | null) => string;
  ui: (key: string) => string;
  href: (path?: string, lang?: string) => string;
  asset: (file: string) => string;
}

export function pick(v: Loc | null | undefined, lang: string, def: string): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] ?? v[def] ?? Object.values(v)[0] ?? '';
}

export function makeCtx(lang: string, path: string, langs: Lang[], ui: Record<string, Record<string, Loc>>): Ctx {
  const def = langs[0].code;
  const t = (v?: Loc | null) => pick(v, lang, def);
  return {
    lang,
    def,
    langs,
    path,
    t,
    ui: (key) => {
      const [group, name] = key.split('.');
      const v = ui[group]?.[name];
      if (v == null) throw new Error(`ui.yaml: нет ключа "${key}"`);
      return t(v);
    },
    href: (p = '', l = lang) => BASE + (l === def ? '' : l + '/') + p,
    asset: (file) => BASE + file,
  };
}

/** URL path segments for a language: the first language lives at the root. */
export const prefix = (lang: string, def: string) => (lang === def ? '' : lang + '/');

/** "+380687704060" → "+380 68 770 40 60"; other formats pass through. */
export const phoneLabel = (p: string) =>
  p.replace(/\s+/g, '').replace(/^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/, '+380 $1 $2 $3 $4');
export const phoneHref = (p: string) => 'tel:' + p.replace(/[^\d+]/g, '');
