import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const codes = (parse(readFileSync('./content/site.yaml', 'utf8')).languages as { code: string }[]).map((l) => l.code) as [string, ...string[]];

/** Plain string for every language, or { en: "…", ru: "…", uk: "…" } using codes from site.yaml. */
const loc = z.union([z.string(), z.partialRecord(z.enum(codes), z.string())], {
  error: `Текст: строка или словарь по языкам (${codes.join(', ')}). Если в тексте есть запятая или двоеточие — возьмите его в кавычки.`,
});
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like "#23349c"');
const date = z.union([z.number(), z.string()]).transform(String);

const single = (file: string) => glob({ pattern: file, base: './content' });

const site = defineCollection({
  loader: single('site.yaml'),
  schema: z.object({
    name: loc,
    role: loc,
    location: loc.optional(),
    availability: loc.optional(),
    email: z.email(),
    phone: z.string().optional(),
    socials: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    languages: z.array(z.object({ code: z.string(), label: z.string(), name: z.string() })).min(1),
    seo: z.object({ description: loc, image: z.string().optional() }),
    theme: z.object({
      paper: hex,
      ink: hex,
      pigments: z.array(hex).min(3),
      pattern: z.enum(['battal', 'gelgit', 'tarakli', 'bulbul', 'random']).default('random'),
    }),
    deploy: z.object({ site: z.url().optional(), base: z.string().optional() }).optional(),
  }),
});

const ui = defineCollection({
  loader: single('ui.yaml'),
  schema: z.record(z.string(), z.record(z.string(), loc)),
});

const about = defineCollection({
  loader: single('about.yaml'),
  schema: z.object({
    portrait: z.string().nullish(),
    portraitAlt: loc.optional(),
    bio: z.array(loc).default([]),
    services: z.array(loc).default([]),
    clients: z.array(z.union([z.string(), z.object({ name: z.string(), url: z.url().optional() })])).default([]),
  }),
});

const span = { start: date.optional(), end: date.nullish() };

const cv = defineCollection({
  loader: single('cv.yaml'),
  schema: z.object({
    pdf: z.union([z.string(), z.record(z.string(), z.string())]).nullish(),
    summary: loc.optional(),
    experience: z
      .array(z.object({ role: loc, company: z.string(), place: loc.optional(), text: loc.optional(), ...span }))
      .default([]),
    education: z.array(z.object({ title: loc, place: z.string(), ...span })).default([]),
    skills: z.array(loc).default([]),
    tools: z.array(z.string()).default([]),
    awards: z.array(z.object({ title: loc, year: date.optional(), place: z.string().optional() })).default([]),
    languages: z.array(loc).default([]),
  }),
});

const media = z.object({
  src: z.string(),
  position: z.string().optional(),
  alt: loc.optional(),
  caption: loc.optional(),
  poster: z.string().optional(),
  ratio: z.string().regex(/^\d+(\.\d+)?\/\d+(\.\d+)?$/, 'Ratio looks like "16/9"').optional(),
  controls: z.boolean().optional(),
});

const block = z.union([
  media.extend({ width: z.enum(['full', 'wide', 'narrow']).default('wide') }).transform((b) => ({ type: 'media' as const, ...b })),
  z.object({ row: z.array(media).min(2).max(4), caption: loc.optional() }).transform((b) => ({ type: 'row' as const, ...b })),
  z
    .object({ gallery: z.array(z.union([z.string().transform((src) => ({ src })), media])).min(1), columns: z.number().int().min(2).max(4).default(3) })
    .transform((b) => ({ type: 'gallery' as const, ...b })),
  z.object({ text: loc, title: loc.optional() }).transform((b) => ({ type: 'text' as const, ...b })),
  z.object({ quote: loc, author: z.string() }).transform((b) => ({ type: 'quote' as const, ...b })),
]);

const projects = defineCollection({
  loader: glob({
    pattern: '*/project.{yaml,yml}',
    base: './content/projects',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    title: loc,
    summary: loc.optional(),
    year: date,
    client: loc.optional(),
    role: loc.optional(),
    tags: z.array(loc).default([]),
    color: hex.optional(),
    palette: z.array(hex).min(2).optional(),
    cover: z.string(),
    poster: z.string().optional(),
    coverRatio: z.string().regex(/^(auto|\d+(\.\d+)?\/\d+(\.\d+)?)$/, 'coverRatio: "16/10" или "auto" (как у файла)').optional(),
    coverPosition: z.string().optional(),
    size: z.enum(['full', 'wide', 'half', 'third']).default('half'),
    order: z.number().optional(),
    home: z.boolean().default(true),
    draft: z.boolean().default(false),
    demo: z.boolean().default(false),
    blocks: z.array(block).default([]),
    credits: z.array(z.object({ role: loc, name: z.string() })).default([]),
    links: z.array(z.object({ label: loc, url: z.url() })).default([]),
  }),
});

export const collections = { site, ui, about, cv, projects };
