// npm run new -- my-project   → content/projects/my-project/project.yaml
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const slug = (process.argv[2] || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
if (!slug) {
  console.error('Укажите имя папки латиницей: npm run new -- my-project');
  process.exit(1);
}
const dir = `content/projects/${slug}`;
if (existsSync(dir)) {
  console.error(`${dir} уже существует`);
  process.exit(1);
}
const langs = parse(readFileSync('content/site.yaml', 'utf8')).languages.map((l) => l.code);
const loc = (v) => `{ ${langs.map((l) => `${l}: "${v}"`).join(', ')} }`;
mkdirSync(dir, { recursive: true });
writeFileSync(
  `${dir}/project.yaml`,
  `# Положите картинки и видео в эту папку и впишите их имена ниже.
title: ${loc('Project title')}
year: ${new Date().getFullYear()}
client: ""
role: ${loc('Role')}
tags:
  - ${loc('Tag')}
summary: ${loc('One or two sentences about the project.')}

cover: cover.jpg        # картинка или видео .mp4
size: half              # full · wide · half · third
# color: "#23349c"      # цвет проекта
# order: 1              # порядок на главной (меньше — выше)
draft: true             # уберите, чтобы опубликовать

blocks:
  - src: cover.jpg
  # - src: loop.mp4                     # видео без звука, крутится по кругу
  # - src: film.mp4                     # видео со звуком и кнопками:
  #   controls: true
  # - src: https://vimeo.com/123456789  # YouTube / Vimeo
  # - row: [ { src: a.jpg }, { src: b.jpg } ]
  # - gallery: [ a.jpg, b.jpg, c.jpg ]
  #   columns: 3
  # - text: ${loc('Paragraph text.')}
`,
);
console.log(`Создано: ${dir}/project.yaml (черновик — виден только в npm run dev)`);
