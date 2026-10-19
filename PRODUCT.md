# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro static site, deployed to GitHub Pages via GitHub Actions. All content (profile, CV, projects, media) lives in YAML files validated by schemas; images optimized at build time (avif/webp, srcset).

## Users

- Primary: studios, agencies, recruiters and direct clients evaluating an emerging AI motion designer (Anna Prokopets) for hire or commission. They skim fast, judge by the work first, then check CV and contact.
- Secondary: the designer (and whoever maintains the repo), who must add projects, images and videos and edit any text by touching YAML only.

## Product Purpose

Personal business card + CV + portfolio for Anna Prokopets, an emerging AI motion designer (owner's wording: «начинающий AI моушн дизайнер»). Success: a visitor sees strong work within the first viewport, can browse projects with images and video, and reaches contact/CV in one step. Maintainer success: adding a project = drop media in a folder + add a YAML entry.

## Positioning

Not a template portfolio: the site itself is a piece of the designer's brand and motion craft. Motion work is first-class (looping video in grid, full video on project pages), not an afterthought.

## Capabilities and Constraints

- Languages: RU, EN, UA (Ukrainian). Every user-facing string translatable in YAML; language switcher.
- Video: short loops hosted locally (mp4/webm, GitHub file limit 100 MB, site ~1 GB), long-form via YouTube/Vimeo embeds. Both supported per media item.
- Images: local files, optimized at build.
- Must be easy to extend: new sections, new media types, new languages without touching layout code.
- Confirmed: name (RU Анна Прокопец · EN Anna Prokopets · UA Анна Прокопець), email annieprokopets@gmail.com, phone +380687704060, language order RU · EN · UA.
- Not yet provided: real projects, bio, location, availability, tools, spoken languages, socials. All demo content is placeholder; do not invent facts about the person.

## Evidence on Hand

Contact details only. No real projects, media, clients, or testimonials supplied. Do not fabricate clients, awards, or press; placeholders must be clearly marked.

## Product Principles

1. The work leads; interface recedes.
2. Content is data: every fact editable in YAML, zero layout edits to add work.
3. Fast on any connection: optimized images, lazy video, no heavy runtime.
4. Motion is native to the site, as it is to the designer.
5. Three languages are equal citizens.
