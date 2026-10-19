# Портфолио · CV

Сайт-визитка с портфолио и резюме. Весь контент — в YAML в папке `content/`, вёрстку трогать не нужно.
Astro → GitHub Pages. Три языка (RU · EN · UA). PDF-резюме собирается автоматически.

Главная — живая ванна эбру (настоящая математика мраморирования). Вода всё время слегка колышется, в простое сами падают капли.
Курсор размешивает краску, удержание — льёт новый цвет, протяжка — прочёсывает, прокрутка страницы тянет гребень (обратно — возвращает узор).
Кнопки: следующий цвет, «Прочесать» (гребень или вихрь), «Новая ванна», «Снять оттиск» (PNG с подписью). Блок контактов внизу — оттиск с той же ванны.
При «уменьшить движение» в системе фоновое движение выключено.

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:4321 — правки видны сразу
npm run build      # сборка в dist/ + PDF резюме
npm run preview    # посмотреть собранный сайт
```

## Где что лежит

```
content/
  site.yaml          имя, роль, почта, соцсети, языки, цвета
  ui.yaml            тексты интерфейса (кнопки, заголовки) на всех языках
  about.yaml         «Обо мне»: текст, портрет, услуги, клиенты
  cv.yaml            резюме: опыт, образование, навыки, инструменты, языки
  media/             общие файлы: portrait.jpg, og.jpg, свой PDF
  projects/
    <папка-проекта>/
      project.yaml   описание проекта
      cover.jpg      картинки и видео — рядом с project.yaml
      loop.mp4
```

## Тексты на нескольких языках

Любое текстовое поле — строка (одинаково везде) или словарь:

```yaml
title: Orbit FM
title: { en: Halva bakery, ru: Пекарня «Халва», uk: Пекарня «Халва» }
```

Если в тексте есть **запятая или двоеточие** внутри `{ … }` — возьмите текст в кавычки: `ru: "Ведите, чтобы…"`.
Не указан перевод — покажется текст языка по умолчанию.

## Добавить проект

```bash
npm run new -- my-project
```

Создастся `content/projects/my-project/project.yaml` (черновик). Положите в папку файлы, впишите их имена, удалите `draft: true`.

```yaml
title: { en: …, ru: …, uk: … }
year: 2026
client: Client name
role: { en: Identity, ru: Айдентика, uk: Айдентика }
tags: [ { en: Motion, ru: Моушн, uk: Моушн } ]
summary: { en: …, ru: …, uk: … }

cover: cover.jpg     # картинка ИЛИ видео (.mp4 крутится без звука)
size: half           # размер на главной: full · wide · half · third
color: "#23349c"     # цвет проекта (необязательно)
order: 1             # порядок (меньше — выше); без order — по году
home: true           # false — не показывать на главной
draft: false         # true — виден только в npm run dev

blocks:              # страница проекта, сверху вниз
  - src: hero.jpg
    width: full                      # full · wide · narrow
    caption: { en: …, ru: … }
  - src: loop.mp4                    # луп: без звука, автоплей, постер — loop.jpg рядом
  - src: film.mp4                    # видео со звуком и кнопками
    controls: true
  - src: https://youtu.be/XXXXXXXX   # YouTube / Vimeo — просто ссылка
  - row: [ { src: a.jpg }, { src: b.mp4 } ]   # 2–4 в ряд; ratio: 4/5 по умолчанию
  - gallery: [ a.jpg, b.jpg, c.jpg ]          # сетка
    columns: 3
  - text: { en: "Paragraph.\n\nSecond paragraph.", ru: … }
  - quote: { en: "…" }               # только настоящие цитаты
    author: Name, Company
credits:
  - { role: { en: Design, ru: Дизайн }, name: Name }
links:
  - { label: Behance, url: https://… }
```

Тип медиа определяется по расширению: `jpg png webp avif gif` — картинка, `mp4 webm` — видео, ссылка YouTube/Vimeo — встраивание.
Любой медиа-элемент принимает `alt`, `caption`, `ratio: 16/9`, `poster` (кадр для видео).
Если файла нет — сборка остановится и скажет, какой файл и в каком YAML.

## Картинки и видео

- **Картинки** кладите в хорошем качестве (до ~3000 px). При сборке они сжимаются в AVIF/WebP разных размеров.
- **Видео** — mp4 (H.264). GitHub не принимает файлы больше 100 МБ; лупы держите в пределах 2–10 МБ.
  Сжать и сделать постер одной командой (нужен ffmpeg):

  ```bash
  scripts/encode-video.sh исходник.mov content/projects/my-project/loop          # без звука
  SOUND=1 scripts/encode-video.sh film.mov content/projects/my-project/film      # со звуком
  ```
- Длинные ролики (шоурил) лучше держать на YouTube/Vimeo и вставлять ссылкой. Плеер грузится только по клику.

## Резюме и PDF

`content/cv.yaml` → страница `/cv/` и PDF `cv-en.pdf`, `cv-ru.pdf`, `cv-uk.pdf`. PDF печатается из той же страницы при каждой сборке (нужен установленный Chrome; на GitHub он есть). Свой готовый PDF: положите в `content/media/` и укажите `pdf: my-cv.pdf` (или по языкам).

## Языки

`site.yaml → languages`. Первый язык — основной (адрес `/`), остальные — `/en/`, `/uk/`.
Новый язык: добавьте его в `languages` и переводы в `ui.yaml` и текстах. Неизвестный код языка в YAML сборка подсветит ошибкой.

## Цвета и узор

`site.yaml → theme`: `paper` (фон), `ink` (текст), `pigments` (краски ванны; первая — фон ванны и секции «Обо мне»).
Берите насыщенные и достаточно тёмные краски — белое имя должно читаться поверх.
`pattern`: `battal` (капли) · `gelgit` (волна) · `tarakli` (гребень) · `bulbul` (вихри) · `random`.

## Публикация на GitHub Pages

1. Settings → Pages → Source: **GitHub Actions**.
2. Пуш в `main` — сайт собирается и публикуется (`.github/workflows/deploy.yml`). Адрес и базовый путь (`/repo/`) подставляются автоматически.
3. Свой домен: Settings → Pages → Custom domain.

## Для разработчика

- `src/engine/marbling.ts` — математика мраморирования (Lu, Jaffer et al., *Mathematical Marbling*): капли, гребни, стилус, вихри. Без DOM; `npm run bench` — замер.
- `src/content.config.ts` — схемы YAML. Новый тип блока: добавить в union `block` и ветку в `src/components/blocks/Blocks.astro`.
- `src/pages/[...path].astro` — все маршруты (язык × страница). Новая страница: вьюха в `src/views/` + пути там.
- `integrations/cv-pdf.mjs` — печать PDF после сборки.
- Визуальная система — `DESIGN.md`.
