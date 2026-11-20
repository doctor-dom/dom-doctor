# Lab notebook design (dom.doctor)

Content lives in markdown under `src/content/`. Layout and typography live in `src/styles/notebook.css` and `src/layouts/`. Change design without rewriting essays.

## Reference

Visual direction **mirrors and is inspired by** [Michelle Lin, MD](https://michellelinmd.com/) — a living academic notebook (ruled paper, ink edits, margin asides), not a marketing site.

When a later request asks to change look, spacing, type, ink, gutters, or page structure, open that site first and match its spirit before inventing a new system. Use it as the style reference for:

- Warm off-white ruled writing column; body text sits on the lines
- Unlined side gutters for handwritten comments and arrows (no heavy vertical “barrier” rules)
- Serif body (Literata here); blue/red pen hand for insertions, strikeouts, and margin notes (Caveat here)
- Living-document voice: dated notes, crossed-out phrases, first-person interval notes, simple catalog tables
- Quiet chrome (name + nav). The page *is* the notebook — not cards, heroes, or a product landing page

This site is not a clone. Keep physician-scientist content and the dual-gutter / closest-margin processor below. When in doubt on taste, prefer michellelinmd.com over generic academic or SaaS patterns.

## Typography

- Body: Literata, black ink (`--ink`), warm off-white paper (`--paper`, `#faf8f4`).
- Tan ruling only in the writing column, spaced to the body line-height so black text sits on the lines. Gutters on both sides stay unlined (no vertical barrier) for arrows and handwritten notes.
- Side gutters (`--margin`, 9.75rem on desktop, 8rem under 1100px): Caveat notes, wrapping as phrases rather than one word per line. Each note sits in the **closer** margin to its caret.
- Handwritten insertions in the body: Caveat in `--ink-blue`.

## Markdown conventions

Implemented in `src/lib/remark-notebook.ts` (parse) and `src/scripts/sidenotes.ts` (place notes, draw arrows).

| Authoring | Rendering |
| --- | --- |
| `~~removed idea~~` | Blue strikethrough; original words stay visible |
| `++added idea++` | Caveat “ink” insertion in the line |
| `^((check live URL when deployed))` | Caret in the body; note in the closer gutter; arrow from the caret into that gutter (does not cross the sentence) |
| `^((#id))` plus a later `Margin[id]: note` | Same as above when the note is too long to keep inline |
| Paragraph `Margin: note` with no caret | Gutter note with no arrow (legacy) |

### Margin notes (workflow)

Use these when a handwritten comment should sit in a **side margin** and point at a **specific place** in the sentence. The processor places the note in whichever gutter is closer to the caret (left or right) and draws the arrow into that gutter along the line gap, not across the words. A lone `Margin:` paragraph is a hanging left-gutter note with no arrow.

**How to notate (so this is processed correctly)**

1. In the markdown body, put `^((your note))` **immediately after** the word the arrow should leave from — no space, no extra markup.
2. Keep the note as plain text. Do not put `))`, `++ ++`, links, or markdown inside the parentheses.
3. Do not wrap the caret in `{ }` or `[ ]` — Markdown and Astro steal those.
4. If the note is long, or you need two notes in one paragraph, use `^((#id))` at the caret and a following `Margin[id]:` paragraph. The `id` is letters first (`url`, `replace`) and never appears on the page.
5. Rebuild/dev reload is enough; do not add HTML or CSS in the content file.

**1. Preferred — note at the caret**

Place `^((…))` immediately after the word or phrase the arrow should leave from.

```md
When a repository graduates to its own Worker, add `live`^((check live URL when deployed)) in front matter.
```

What the processor does:

1. Remark turns `^((…))` into a `.sidenote` (caret `^` in the line + `.sidenote-body` with the note).
2. `src/scripts/sidenotes.ts` hoists each `.sidenote-body` into a `.sidenote-gutter` layer so the caret’s layout box stays in the sentence.
3. The script picks the closer margin, stacks notes on that side if they would overlap, and draws an SVG hook from the caret up into the line gap, then into the gutter to the note. The stroke stays out of the writing column.

Author the caret against the word you want the arrow to leave from; the processor does the rest. Do not hand-place CSS or HTML in content files.

**2. Split — long notes, or several notes in one paragraph**

Put a labeled caret in the sentence, then a `Margin[id]:` paragraph **after** that paragraph. The `id` is letters first (`live`, `url-1`). It never appears on the page.

```md
Add `live`^((#url)) in front matter and leave this narrative here.

Margin[url]: check live URL when deployed
```

Several carets in one paragraph:

```md
Ship on workers.dev^((#preview)) first, then attach the apex^((#apex)) after DNS is clear.

Margin[preview]: keep this URL for collaborators
Margin[apex]: wait until the A record is free
```

**Do not**

- Put `Margin: …` on its own with no `^((…))` if you want an arrow. That is a hanging note only.
- Nest markdown, `))`, or `++ ++` inside `^((…))`.
- Reuse the same `id` twice on one page.

Edit in Cursor or on GitHub; the files stay ordinary `.md`.

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