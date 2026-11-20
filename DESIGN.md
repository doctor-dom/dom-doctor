# Lab notebook design (dom.doctor)

Content lives in markdown under `src/content/`. Layout and typography live in `src/styles/notebook.css` and `src/layouts/`. Change design without rewriting essays.

## Typography

- Body: Literata, black ink (`--ink`), warm paper (`--paper`).
- Left rule: blue vertical line; lined background suggests notebook paper.
- Handwritten insertions: Caveat in `--ink-blue`.

## Markdown conventions

| Authoring | Rendering |
| --- | --- |
| `~~removed idea~~` | Blue strikethrough; original words stay visible |
| `++added idea++` | Caveat “ink” insertion in blue |
| Paragraph starting `Margin: note` | Margin note in blue Caveat (standalone paragraph) |

Implemented in `src/lib/remark-notebook.ts` and wired in `astro.config.mjs`.

## Content fields

See `src/content.config.ts` for schemas:

- `profile/index.md` — home + about
- `projects/*.md` — catalog cards and detail pages
- `reviews/*.md` — first-person tool notes
- `notes/*.md` — journal / build log

ORCID and GitHub remain canonical elsewhere; this site explains which links matter.

## Forms

Contact and subscribe use Turnstile. Subscribe is double opt-in (D1). The inbox address is only a Worker secret, never in this repo.

## Deployed tools

Interactive repos that need their own release cycle deploy as separate Workers (for example `tool.dom.doctor`). Link them from project front matter `live` when ready.