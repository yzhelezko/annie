import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

let cache: Promise<Awaited<ReturnType<typeof read>>> | undefined;

async function read() {
  const one = async <C extends 'site' | 'ui' | 'about' | 'cv'>(c: C) => {
    const e = await getEntry(c, c);
    if (!e) throw new Error(`Нет файла content/${c}.yaml`);
    return e.data;
  };
  const [site, ui, about, cv] = await Promise.all([one('site'), one('ui'), one('about'), one('cv')]);
  const projects = (await getCollection('projects', (p) => import.meta.env.DEV || !p.data.draft)).sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) || b.data.year.localeCompare(a.data.year) || a.id.localeCompare(b.id),
  );
  return { site, ui, about, cv, projects };
}

export const load = () => (cache ??= read());

/** Folder that relative media paths in an entry resolve against. */
export const dirOf = (filePath?: string) => (filePath ?? '').replace(/\/[^/]+$/, '');
