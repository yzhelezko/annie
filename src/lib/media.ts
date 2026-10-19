import type { ImageMetadata } from 'astro';

const images = import.meta.glob<ImageMetadata>('/content/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
});
const files = import.meta.glob<string>('/content/**/*.{mp4,m4v,webm,mov,pdf,MP4,M4V,WEBM,MOV,PDF}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export type Resolved =
  | { kind: 'image'; img: ImageMetadata }
  | { kind: 'remote'; url: string }
  | { kind: 'video'; url: string; type: string; poster?: ImageMetadata }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string };

const VIDEO: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

const ext = (s: string) => s.split('?')[0].split('.').pop()!.toLowerCase();
const key = (dir: string, src: string) => '/' + [dir, src.replace(/^\.\//, '')].filter(Boolean).join('/');

function youtube(u: URL) {
  if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  if (!u.hostname.endsWith('youtube.com') && !u.hostname.endsWith('youtube-nocookie.com')) return null;
  return u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
}

function vimeo(u: URL) {
  if (!u.hostname.endsWith('vimeo.com')) return null;
  return u.pathname.match(/(\d{6,})/)?.[1] ?? null;
}

/**
 * Turns a YAML media reference into something renderable.
 * dir: folder of the YAML file ("content/projects/x"); where: shown in errors so the maintainer finds the line.
 */
export function resolve(src: string, dir: string, where: string, poster?: string): Resolved {
  if (/^https?:\/\//.test(src)) {
    const u = new URL(src);
    const yt = youtube(u);
    if (yt) return { kind: 'youtube', id: yt };
    const vm = vimeo(u);
    if (vm) return { kind: 'vimeo', id: vm };
    if (VIDEO[ext(src)]) return { kind: 'video', url: src, type: VIDEO[ext(src)], poster: poster ? image(poster, dir, where) : undefined };
    return { kind: 'remote', url: src };
  }
  const e = ext(src);
  if (VIDEO[e]) {
    const url = files[key(dir, src)];
    if (!url) missing(src, dir, where);
    const auto = src.replace(/\.[^.]+$/, '');
    const still = poster ?? ['jpg', 'jpeg', 'png', 'webp'].map((x) => `${auto}.${x}`).find((p) => images[key(dir, p)]);
    return { kind: 'video', url, type: VIDEO[e], poster: still ? image(still, dir, where) : undefined };
  }
  return { kind: 'image', img: image(src, dir, where) };
}

export function image(src: string, dir: string, where: string): ImageMetadata {
  const img = images[key(dir, src)];
  if (!img) missing(src, dir, where);
  return img;
}

export function file(src: string, dir: string, where: string): string {
  const url = files[key(dir, src)];
  if (!url) missing(src, dir, where);
  return url;
}

function missing(src: string, dir: string, where: string): never {
  throw new Error(`Файл не найден: "${src}" (${where}). Положите его в ${dir}/ или исправьте имя в YAML.`);
}
